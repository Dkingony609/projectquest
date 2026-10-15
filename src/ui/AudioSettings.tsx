export interface AudioPreferences {
  musicVolume: number;
  effectsVolume: number;
  muted: boolean;
}

interface AudioSettingsProps {
  preferences: AudioPreferences;
  onChange: (preferences: AudioPreferences) => void;
  onEnable: () => void;
  started: boolean;
  supported: boolean;
  playing: boolean;
  error: string | null;
}

export function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {muted ? (
        <>
          <path d="m16 9 5 6M21 9l-5 6" />
        </>
      ) : (
        <>
          <path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
        </>
      )}
    </svg>
  );
}

export default function AudioSettings({
  preferences,
  onChange,
  onEnable,
  started,
  supported,
  playing,
  error,
}: AudioSettingsProps) {
  return (
    <section className="audio-settings" aria-labelledby="audio-settings-title">
      <div className="audio-settings-heading">
        <div>
          <h3 id="audio-settings-title">Soundtrack & sound</h3>
          <p>“First Light” · an original piano, pad and brushed-beat score.</p>
        </div>
        <SoundIcon muted={preferences.muted} />
      </div>
      {!supported ? (
        <p className="audio-note">
          This browser does not support game audio. Every mission remains
          playable with the visible cues.
        </p>
      ) : (
        <>
          <label className="audio-mute">
            <span>Mute all audio</span>
            <input
              type="checkbox"
              checked={preferences.muted}
              onChange={(event) =>
                onChange({ ...preferences, muted: event.target.checked })
              }
            />
          </label>
          <label className="audio-slider">
            <span>
              Music volume{" "}
              <output>{Math.round(preferences.musicVolume * 100)}%</output>
            </span>
            <input
              aria-label="Music volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={preferences.musicVolume}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  musicVolume: Number(event.target.value),
                })
              }
            />
          </label>
          <label className="audio-slider">
            <span>
              Sound effects volume{" "}
              <output>{Math.round(preferences.effectsVolume * 100)}%</output>
            </span>
            <input
              aria-label="Sound effects volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={preferences.effectsVolume}
              onChange={(event) =>
                onChange({
                  ...preferences,
                  effectsVolume: Number(event.target.value),
                })
              }
            />
          </label>
          {!started && (
            <button className="secondary" type="button" onClick={onEnable}>
              Enable game audio
            </button>
          )}
          <p className="audio-note" role="status">
            {error
              ? "Audio could not start. You can retry or keep playing with visual feedback."
              : preferences.muted
                ? "Audio muted. Your volume preferences are kept."
                : playing
                  ? "Soundtrack playing. Audio pauses when you leave this tab."
                  : !started
                    ? "Audio starts after your first interaction, as required by your browser."
                    : "Preparing soundtrack…"}
          </p>
          {error && started && (
            <button className="text-button" type="button" onClick={onEnable}>
              Retry audio
            </button>
          )}
        </>
      )}
    </section>
  );
}
