import { describe, expect, it } from "vitest";
import {
  normalizeAudioPreferences,
  DEFAULT_AUDIO_PREFERENCES,
} from "./preferences";

describe("persistent audio controls", () => {
  it("retains safe defaults when old settings do not contain audio preferences", () => {
    expect(normalizeAudioPreferences({ highContrast: true })).toEqual(
      DEFAULT_AUDIO_PREFERENCES,
    );
    expect(normalizeAudioPreferences(null)).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });
  it("bounds volume and rejects corrupt or coerced values without losing mute", () => {
    expect(
      normalizeAudioPreferences({
        musicVolume: 4,
        effectsVolume: -2,
        muted: true,
      }),
    ).toEqual({ musicVolume: 1, effectsVolume: 0, muted: true });
    expect(
      normalizeAudioPreferences(
        { musicVolume: NaN, effectsVolume: "0.9", muted: "false" },
        { musicVolume: 0.6, effectsVolume: 0.2, muted: true },
      ),
    ).toEqual({ musicVolume: 0.6, effectsVolume: 0.2, muted: true });
  });
});
