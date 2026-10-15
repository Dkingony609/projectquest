import {
  DEFAULT_AUDIO_PREFERENCES,
  normalizeAudioPreferences,
  type AudioPreferences,
} from "./preferences";

export type AudioScene = "menu" | "workplace" | "debrief";
export type AudioCue =
  | "click"
  | "decision"
  | "success"
  | "setback"
  | "notification";

export interface AudioStatus extends AudioPreferences {
  supported: boolean;
  started: boolean;
  contextState: AudioContextState | "unavailable";
  activeVoices: number;
  musicPlaying: boolean;
  trackLoaded: boolean;
  outputLevel: number;
  scene: AudioScene;
  error: string | null;
  trackDuration: number;
}

const SCORE_DURATION = 4342154 / 44100;
const SCENE_MIX: Record<AudioScene, { level: number; cutoff: number }> = {
  menu: { level: 0.82, cutoff: 4600 },
  workplace: { level: 1, cutoff: 12500 },
  debrief: { level: 0.88, cutoff: 6200 },
};
const MAX_CUES = 8;

function audioConstructor(): typeof AudioContext | undefined {
  return (
    globalThis.AudioContext ??
    (
      globalThis as typeof globalThis & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext
  );
}

function smooth(
  parameter: AudioParam,
  value: number,
  time: number,
  seconds = 0.045,
) {
  parameter.cancelScheduledValues(time);
  parameter.setTargetAtTime(value, time, seconds);
}

interface CueVoice {
  gain: GainNode;
  sources: OscillatorNode[];
}

/** One lazily created context. Audio failure must never interrupt the learning loop. */
export class GameAudio {
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private sceneGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private meter: Float32Array<ArrayBuffer> | null = null;
  private effectRoom: ConvolverNode | null = null;
  private tone: PeriodicWave | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private score: AudioBuffer | null = null;
  private cues = new Set<CueVoice>();
  private preferences: AudioPreferences = { ...DEFAULT_AUDIO_PREFERENCES };
  private scene: AudioScene = "menu";
  private started = false;
  private paused = false;
  private generation = 0;
  private loadTask: Promise<void> | null = null;
  private resumeTask: Promise<boolean> | null = null;
  private abort: AbortController | null = null;
  private error: string | null = null;
  private lastClick = -Infinity;

  /** Call directly from a pointer/keyboard gesture; resume happens before any await. */
  unlock(): Promise<boolean> {
    this.paused = false;
    if (this.resumeTask) return this.resumeTask;
    const Constructor = audioConstructor();
    if (!Constructor) return Promise.resolve(false);
    try {
      if (!this.context || this.context.state === "closed")
        this.createContext(Constructor);
      const context = this.context!;
      const generation = this.generation;
      const resumed =
        context.state === "running" ? Promise.resolve() : context.resume();
      const task = resumed
        .then(() => {
          if (this.context !== context || this.generation !== generation)
            return false;
          this.started = context.state === "running";
          if (this.paused) {
            void context.suspend().catch(() => undefined);
            return false;
          }
          if (!this.started) return false;
          // A failed asset fetch is retryable on the next user interaction.
          if (!this.score && !this.loadTask)
            this.loadScore(context, generation);
          if (this.score) this.startMusic(context);
          return true;
        })
        .catch(() => false)
        .finally(() => {
          if (this.resumeTask === task) this.resumeTask = null;
        });
      this.resumeTask = task;
      return task;
    } catch {
      return Promise.resolve(false);
    }
  }

  setPreferences(preferences: Partial<AudioPreferences>): AudioPreferences {
    this.preferences = normalizeAudioPreferences(preferences, this.preferences);
    this.applyLevels();
    return { ...this.preferences };
  }

  setScene(scene: AudioScene): void {
    this.scene = scene;
    const context = this.context;
    if (!context || !this.sceneGain || !this.musicFilter) return;
    const mix = SCENE_MIX[scene];
    smooth(this.sceneGain.gain, mix.level, context.currentTime, 0.65);
    smooth(this.musicFilter.frequency, mix.cutoff, context.currentTime, 0.85);
  }

  playCue(cue: AudioCue): void {
    const context = this.context;
    if (
      !context ||
      context.state !== "running" ||
      !this.started ||
      this.paused ||
      this.preferences.muted ||
      this.preferences.effectsVolume === 0 ||
      !this.effectsGain ||
      !this.tone
    )
      return;
    const now = context.currentTime;
    if (cue === "click" && now - this.lastClick < 0.055) return;
    if (cue === "click") this.lastClick = now;
    if (this.cues.size >= MAX_CUES) return;

    // Notes, offsets and durations are authored as short, soft musical gestures.
    const notes: Record<AudioCue, readonly [number, number, number, number][]> =
      {
        click: [[74, 0, 0.045, 0.1]],
        decision: [
          [62, 0, 0.23, 0.15],
          [69, 0.085, 0.28, 0.1],
        ],
        success: [
          [74, 0, 0.3, 0.12],
          [78, 0.11, 0.33, 0.1],
          [81, 0.23, 0.42, 0.085],
        ],
        setback: [
          [69, 0, 0.26, 0.11],
          [65, 0.13, 0.32, 0.09],
          [62, 0.27, 0.39, 0.08],
        ],
        notification: [
          [76, 0, 0.2, 0.1],
          [81, 0.12, 0.27, 0.065],
        ],
      };
    const bus = context.createGain();
    const voice: CueVoice = { gain: bus, sources: [] };
    bus.gain.value = 1;
    bus.connect(this.effectsGain);
    if (cue !== "click" && this.effectRoom) bus.connect(this.effectRoom);
    this.cues.add(voice);
    let pending = notes[cue].length;
    for (const [midi, offset, duration, level] of notes[cue]) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const time = now + offset;
      oscillator.setPeriodicWave(this.tone);
      oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(level, time + 0.006);
      envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      oscillator.connect(envelope).connect(bus);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
        if (--pending === 0) {
          bus.disconnect();
          this.cues.delete(voice);
        }
      };
      voice.sources.push(oscillator);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.02);
    }
  }

  async suspend(): Promise<void> {
    this.paused = true;
    const context = this.context;
    if (!context || context.state === "closed") return;
    try {
      await context.suspend();
      // A visible-tab resume may have superseded this operation while pending.
      if (!this.paused && this.context === context && this.started)
        await context.resume();
    } catch {
      /* Browser interruption is recoverable on the next user gesture. */
    }
  }

  resume(): Promise<boolean> {
    this.paused = false;
    return this.started ? this.unlock() : Promise.resolve(false);
  }

  getStatus(): AudioStatus {
    const context = this.context;
    let outputLevel = 0;
    if (this.analyser && this.meter && context?.state === "running") {
      this.analyser.getFloatTimeDomainData(this.meter);
      let energy = 0;
      for (const sample of this.meter) energy += sample * sample;
      outputLevel = Math.sqrt(energy / this.meter.length);
    }
    return {
      ...this.preferences,
      supported: Boolean(audioConstructor()),
      started: this.started,
      contextState: context?.state ?? "unavailable",
      activeVoices: this.cues.size + Number(Boolean(this.musicSource)),
      musicPlaying: Boolean(
        this.musicSource &&
          context?.state === "running" &&
          !this.paused &&
          !this.preferences.muted &&
          this.preferences.musicVolume > 0,
      ),
      trackLoaded: Boolean(this.score),
      outputLevel,
      scene: this.scene,
      error: this.error,
      trackDuration: this.score?.duration ?? 0,
    };
  }

  /** Idempotent and reusable: a later gesture can start a fresh context. */
  dispose(): void {
    this.generation++;
    this.abort?.abort();
    this.abort = null;
    this.loadTask = null;
    this.resumeTask = null;
    this.musicSource?.stop();
    this.musicSource?.disconnect();
    this.musicSource = null;
    for (const voice of this.cues) {
      for (const source of voice.sources) {
        source.onended = null;
        try {
          source.stop();
        } catch {
          /* The cue may have just ended. */
        }
        source.disconnect();
      }
      voice.gain.disconnect();
    }
    this.cues.clear();
    const context = this.context;
    this.context = null;
    this.score = null;
    this.started = false;
    this.paused = false;
    this.error = null;
    this.lastClick = -Infinity;
    this.musicGain = this.effectsGain = this.sceneGain = this.masterGain = null;
    this.musicFilter = null;
    this.effectRoom = null;
    this.tone = null;
    this.analyser = null;
    this.meter = null;
    if (context && context.state !== "closed")
      void context.close().catch(() => undefined);
  }

  private createContext(Constructor: typeof AudioContext): void {
    const context = new Constructor({ latencyHint: "interactive" });
    this.context = context;
    this.musicGain = context.createGain();
    this.effectsGain = context.createGain();
    this.sceneGain = context.createGain();
    this.musicFilter = context.createBiquadFilter();
    this.masterGain = context.createGain();
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.meter = new Float32Array(this.analyser.fftSize);
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -7;
    limiter.knee.value = 10;
    limiter.ratio.value = 5;
    limiter.attack.value = 0.006;
    limiter.release.value = 0.22;
    this.musicFilter.type = "lowpass";
    this.musicFilter.Q.value = 0.35;
    this.musicFilter.frequency.value = SCENE_MIX[this.scene].cutoff;
    this.sceneGain.gain.value = SCENE_MIX[this.scene].level;
    this.musicGain.gain.value = this.preferences.musicVolume;
    this.effectsGain.gain.value = this.preferences.effectsVolume;
    this.masterGain.gain.value = this.preferences.muted ? 0 : 0.85;
    this.musicFilter
      .connect(this.sceneGain)
      .connect(this.musicGain)
      .connect(limiter);
    this.effectsGain.connect(limiter);
    limiter
      .connect(this.masterGain)
      .connect(this.analyser)
      .connect(context.destination);

    this.effectRoom = context.createConvolver();
    const impulse = context.createBuffer(
      2,
      Math.round(context.sampleRate * 0.7),
      context.sampleRate,
    );
    let seed = 9817;
    for (let channel = 0; channel < 2; channel++) {
      const samples = impulse.getChannelData(channel);
      for (let index = 0; index < samples.length; index++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const time = index / context.sampleRate;
        samples[index] =
          time < 0.012
            ? 0
            : ((seed / 0xffffffff) * 2 - 1) * Math.exp(-time * 9);
      }
    }
    this.effectRoom.buffer = impulse;
    const roomLevel = context.createGain();
    roomLevel.gain.value = 0.1;
    this.effectRoom.connect(roomLevel).connect(this.effectsGain);
    this.tone = context.createPeriodicWave(
      new Float32Array(5),
      new Float32Array([0, 1, 0.23, 0.07, 0.018]),
    );
  }

  private applyLevels(): void {
    const context = this.context;
    if (!context || !this.musicGain || !this.effectsGain || !this.masterGain)
      return;
    smooth(
      this.musicGain.gain,
      this.preferences.musicVolume,
      context.currentTime,
    );
    smooth(
      this.effectsGain.gain,
      this.preferences.effectsVolume,
      context.currentTime,
    );
    smooth(
      this.masterGain.gain,
      this.preferences.muted ? 0 : 0.85,
      context.currentTime,
      0.02,
    );
  }

  private loadScore(context: AudioContext, generation: number): void {
    const abort = new AbortController();
    this.abort = abort;
    this.error = null;
    const task = (async () => {
      // Ogg is compact and sample accurate. MP3 supports browsers without Vorbis.
      for (const filename of ["first-light.ogg", "first-light.mp3"]) {
        try {
          const response = await fetch(
            `${import.meta.env.BASE_URL}audio/${filename}`,
            { signal: abort.signal },
          );
          if (!response.ok) throw new Error("Score unavailable");
          const data = await response.arrayBuffer();
          if (this.context !== context || this.generation !== generation)
            return;
          const buffer = await context.decodeAudioData(data);
          if (this.context !== context || this.generation !== generation)
            return;
          this.score = buffer;
          this.startMusic(context);
          return;
        } catch {
          if (
            abort.signal.aborted ||
            this.context !== context ||
            this.generation !== generation
          )
            return;
        }
      }
      this.error =
        "Background music could not be loaded. Sound effects remain available.";
    })().finally(() => {
      if (this.loadTask === task) this.loadTask = null;
      if (this.abort === abort) this.abort = null;
    });
    this.loadTask = task;
  }

  private startMusic(context: AudioContext): void {
    if (
      this.musicSource ||
      !this.score ||
      !this.musicFilter ||
      context.state === "closed" ||
      !this.started
    )
      return;
    const source = context.createBufferSource();
    const entrance = context.createGain();
    source.buffer = this.score;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = Math.min(SCORE_DURATION, this.score.duration);
    entrance.gain.setValueAtTime(0, context.currentTime);
    entrance.gain.linearRampToValueAtTime(1, context.currentTime + 1.4);
    source.connect(entrance).connect(this.musicFilter);
    source.onended = () => {
      entrance.disconnect();
      source.disconnect();
      if (this.musicSource === source) this.musicSource = null;
    };
    this.musicSource = source;
    source.start();
  }
}
