export interface AudioPreferences {
  musicVolume: number;
  effectsVolume: number;
  muted: boolean;
}

export const DEFAULT_AUDIO_PREFERENCES: Readonly<AudioPreferences> =
  Object.freeze({
    musicVolume: 0.28,
    effectsVolume: 0.45,
    muted: false,
  });

/** Persisted browser settings are untrusted: reject coercion and nonfinite values. */
export function normalizeAudioPreferences(
  value: unknown,
  previous: Readonly<AudioPreferences> = DEFAULT_AUDIO_PREFERENCES,
): AudioPreferences {
  const input =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const volume = (key: "musicVolume" | "effectsVolume") => {
    const candidate = input[key];
    return typeof candidate === "number" && Number.isFinite(candidate)
      ? Math.max(0, Math.min(1, candidate))
      : previous[key];
  };
  return {
    musicVolume: volume("musicVolume"),
    effectsVolume: volume("effectsVolume"),
    muted: typeof input.muted === "boolean" ? input.muted : previous.muted,
  };
}
