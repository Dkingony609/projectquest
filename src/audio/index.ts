export {
  GameAudio,
  type AudioCue,
  type AudioScene,
  type AudioStatus,
} from "./GameAudio";
export {
  DEFAULT_AUDIO_PREFERENCES,
  normalizeAudioPreferences,
  type AudioPreferences,
} from "./preferences";

import { GameAudio } from "./GameAudio";

/** Shared by interface and game events; importing it never starts audio. */
export const gameAudio = new GameAudio();
