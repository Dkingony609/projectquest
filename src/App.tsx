import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  applyCommand,
  createGame,
  getObjectives,
  getFeedback,
  replayMission,
  parseSave,
  serializeSave,
  STORAGE_KEY,
  type Command,
  type GameState,
  type Profile,
} from "./game";
import type { WorldPosition, WorldTarget } from "./world/WorldCanvas";
import GamePanel from "./ui/GamePanel";
import Dialog from "./ui/Dialog";
import AudioSettings, { SoundIcon } from "./ui/AudioSettings";
import {
  gameAudio,
  normalizeAudioPreferences,
  DEFAULT_AUDIO_PREFERENCES,
} from "./audio";

const WorldCanvas = lazy(() => import("./world/WorldCanvas"));
type Screen = "menu" | "character" | "industry" | "play";
type Panel =
  | "mentor"
  | "board"
  | "lead"
  | "supplier"
  | "safety"
  | "report"
  | "journal"
  | "career"
  | "debrief"
  | "settings"
  | "routes"
  | null;
const DEFAULT_APPEARANCE = {
  skin: "#a9714b",
  shirt: "#167a79",
  hair: "#26211e",
};
const SKINS = ["#edc4a1", "#c79369", "#a9714b", "#764b38", "#4c3028"];
const SHIRTS = ["#167a79", "#c26342", "#485f9a", "#947044", "#5a4c72"];
const HAIR = ["#26211e", "#654130", "#c29856", "#8d8d87"];
const ROUTES = [
  {
    id: "mentor",
    name: "Alex · Mentor",
    room: "Field office",
    x: -4.7,
    z: -1.2,
  },
  { id: "board", name: "Project board", room: "War room", x: 7.3, z: -3.2 },
  {
    id: "lead",
    name: "Sam · Delivery lead",
    room: "Foundation site",
    x: -4.8,
    z: -8.4,
  },
  {
    id: "supplier",
    name: "Morgan · Supplier",
    room: "Contact desk",
    x: -6.3,
    z: 3.8,
  },
  {
    id: "safety",
    name: "Taylor · Safety",
    room: "Site entrance",
    x: 4.7,
    z: -8.9,
  },
  {
    id: "report",
    name: "Coordination meeting",
    room: "Meeting room",
    x: 7,
    z: 1.1,
  },
];
const FUTURE_INDUSTRIES = [
  ["⌘", "Software & Technology", "Triage a release-blocking defect."],
  ["✚", "Healthcare", "Coordinate a safe clinic rollout."],
  ["✦", "Events & Entertainment", "Bring a conference to opening day."],
  ["⚙", "Manufacturing & Operations", "Plan an installation and shutdown."],
  ["☀", "Energy & Sustainability", "Deliver a community solar project."],
];

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseSave(raw) : { state: null, error: undefined };
  } catch {
    return {
      state: null,
      error:
        "Browser storage is unavailable. You can play, but progress may not persist.",
    };
  }
}

function readSettings() {
  const defaults = {
    reducedMotion:
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    highContrast: false,
    largeText: false,
    lowSpec: false,
    ...DEFAULT_AUDIO_PREFERENCES,
  };
  try {
    const saved = JSON.parse(
      localStorage.getItem("projectquest.settings.v1") ?? "null",
    );
    if (!saved || typeof saved !== "object") return defaults;
    return {
      ...defaults,
      ...Object.fromEntries(
        Object.entries(defaults)
          .filter(([, value]) => typeof value === "boolean")
          .map(([key, value]) => [
            key,
            typeof saved[key] === "boolean" ? saved[key] : value,
          ]),
      ),
      ...normalizeAudioPreferences(saved),
    };
  } catch {
    return defaults;
  }
}

function AvatarPortrait({
  appearance,
}: {
  appearance: typeof DEFAULT_APPEARANCE;
}) {
  return (
    <svg
      viewBox="0 0 140 150"
      role="img"
      aria-label="Your customised avatar"
      className="avatar-portrait"
    >
      <circle cx="70" cy="70" r="65" fill="#e0ebe0" />
      <path d="M22 150v-25q0-30 48-30t48 30v25" fill={appearance.shirt} />
      <path d="M59 79h22v23q-11 12-22 0z" fill={appearance.skin} />
      <ellipse cx="70" cy="60" rx="30" ry="36" fill={appearance.skin} />
      <path
        d="M39 56q-5-41 31-41t31 41q-18-4-23-21-17 19-39 21"
        fill={appearance.hair}
      />
      <circle cx="59" cy="62" r="2.5" fill="#243436" />
      <circle cx="81" cy="62" r="2.5" fill="#243436" />
      <path
        d="M62 79q8 6 16 0"
        stroke="#674a3a"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M53 101l17 32 17-32"
        stroke="#e6ba64"
        strokeWidth="3"
        fill="none"
      />
      <rect x="61" y="127" width="18" height="22" rx="3" fill="#fffaf0" />
    </svg>
  );
}

export default function App() {
  const [initial] = useState(readSaved);
  const [game, setGame] = useState<GameState | null>(initial.state);
  const gameRef = useRef(game);
  gameRef.current = game;
  const [screen, setScreen] = useState<Screen>("menu");
  const [panel, setPanel] = useState<Panel>(null);
  const [focus, setFocus] = useState<WorldTarget | null>(null);
  const [name, setName] = useState("");
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [assistance, setAssistance] = useState<"guided" | "standard">("guided");
  const [notice, setNotice] = useState(initial.error ?? "");
  const [noticeError, setNoticeError] = useState(Boolean(initial.error));
  const [saved, setSaved] = useState(
    initial.state ? "Save found" : "No save yet",
  );
  const [settings, setSettings] = useState(readSettings);
  const [audioStatus, setAudioStatus] = useState(() => gameAudio.getStatus());
  const [worldEpoch, setWorldEpoch] = useState(0);
  const [ready, setReady] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const active = screen === "play" && Boolean(game);
  const close = useCallback(() => setPanel(null), []);

  const enableAudio = useCallback(() => {
    void gameAudio.unlock().then(() => setAudioStatus(gameAudio.getStatus()));
  }, []);

  useEffect(() => {
    gameAudio.setPreferences(settings);
    setAudioStatus(gameAudio.getStatus());
  }, [settings.musicVolume, settings.effectsVolume, settings.muted]);

  useEffect(() => {
    gameAudio.setScene(
      screen !== "play"
        ? "menu"
        : game?.phase === "debrief"
          ? "debrief"
          : "workplace",
    );
  }, [screen, game?.phase]);

  useEffect(() => {
    function gesture(event: Event) {
      if (event instanceof KeyboardEvent && event.repeat) return;
      if (
        !gameAudio.getStatus().started ||
        gameAudio.getStatus().contextState !== "running"
      )
        enableAudio();
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('button:not([disabled]), [role="tab"]') &&
        (!(event instanceof KeyboardEvent) ||
          ["Enter", " "].includes(event.key))
      )
        gameAudio.playCue("click");
    }
    function visibility() {
      if (document.hidden) void gameAudio.suspend();
      else void gameAudio.resume();
    }
    window.addEventListener("pointerdown", gesture, true);
    window.addEventListener("keydown", gesture, true);
    document.addEventListener("visibilitychange", visibility);
    const meter = window.setInterval(
      () => setAudioStatus(gameAudio.getStatus()),
      400,
    );
    return () => {
      window.removeEventListener("pointerdown", gesture, true);
      window.removeEventListener("keydown", gesture, true);
      document.removeEventListener("visibilitychange", visibility);
      clearInterval(meter);
      gameAudio.dispose();
    };
  }, [enableAudio]);

  const saveGame = useCallback((state: GameState) => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeSave(state));
      setSaved("Progress saved");
      return true;
    } catch {
      setSaved("Save unavailable");
      setNotice(
        "Your browser could not save progress. Keep this tab open or enable local storage.",
      );
      setNoticeError(true);
      return false;
    }
  }, []);

  useEffect(() => {
    if (game) saveGame(game);
  }, [game, saveGame]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "projectquest.settings.v1",
        JSON.stringify(settings),
      );
    } catch {
      /* Gameplay remains available without settings storage. */
    }
  }, [settings]);

  const dispatch = useCallback((command: Command) => {
    const current = gameRef.current;
    if (!current) return;
    const result = applyCommand(current, command);
    setNotice(result.error ?? result.notice ?? "Project record updated.");
    setNoticeError(Boolean(result.error));
    if (result.state !== current) {
      if (result.state.phase === "debrief" && current.phase !== "debrief")
        gameAudio.playCue(
          getFeedback(result.state)?.governancePassed ? "success" : "setback",
        );
      else
        gameAudio.playCue(
          [
            "ask",
            "chooseRecommendation",
            "chooseScheduleRecommendation",
            "answerReview",
            "followUp",
          ].includes(command.type)
            ? "decision"
            : "notification",
        );
      gameRef.current = result.state;
      setGame(result.state);
      if (result.state.missionId !== current.missionId) {
        setPanel(null);
        setWorldEpoch((value) => value + 1);
      }
    }
    if (result.state.phase === "debrief" && current.phase !== "debrief")
      setPanel("debrief");
  }, []);

  const positionChanged = useCallback(
    (position: WorldPosition) => {
      if (!gameRef.current || screen !== "play") return;
      setGame((current) => (current ? { ...current, position } : current));
    },
    [screen],
  );
  const interact = useCallback(
    (id: string) => {
      if (!gameRef.current || screen !== "play") return;
      setNotice("");
      if (
        ["mentor", "board", "lead", "supplier", "safety", "report"].includes(id)
      )
        setPanel(id as Panel);
    },
    [screen],
  );

  useEffect(() => {
    function keys(event: KeyboardEvent) {
      if (
        !active ||
        event.repeat ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            'input,textarea,select,[contenteditable="true"],[role="dialog"]',
          ))
      )
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        setPanel((current) => (current ? null : "settings"));
      }
      if (!panel && event.key.toLowerCase() === "t") {
        event.preventDefault();
        setPanel("board");
      }
      if (!panel && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setPanel("journal");
      }
    }
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [active, panel]);

  function startNew() {
    if (game && !confirmNew) {
      setConfirmNew(true);
      return;
    }
    setConfirmNew(false);
    setNotice("");
    setScreen("character");
    setPanel(null);
  }

  function begin() {
    const profile: Profile = {
      name: name.trim(),
      industry: "construction",
      appearance,
      assistance,
    };
    const next = createGame(profile);
    setGame(next);
    gameRef.current = next;
    setWorldEpoch((value) => value + 1);
    setPanel(null);
    setNotice("Welcome to Riverside. Alex is waiting in the field office.");
    setNoticeError(false);
    setScreen("play");
  }

  function replay() {
    if (!game) return;
    const next = replayMission(game);
    setGame(next);
    gameRef.current = next;
    setWorldEpoch((value) => value + 1);
    setPanel(null);
    setNotice(
      game.missionId === "CONST-I02"
        ? "Day 2 practice started from your actual Day 1 outcome. Day 2 rewards are replaced, so replay does not accumulate XP."
        : "Practice run started. Career evidence is assessed fresh; replay does not grant a promotion.",
    );
    setNoticeError(false);
    setScreen("play");
  }

  function travel(route: (typeof ROUTES)[number]) {
    if (!game) return;
    const position = { x: route.x, z: route.z, yaw: Math.PI };
    setGame({ ...game, position });
    setWorldEpoch((value) => value + 1);
    setPanel(null);
    setNotice(
      `Accessible route: ${route.room}. Approach ${route.name} or press E.`,
    );
    setNoticeError(false);
  }

  const objectives = game ? getObjectives(game) : [];
  const completed = objectives.filter((objective) => objective.complete).length;
  const nextObjective = objectives.find((objective) => !objective.complete);
  const clock = game
    ? `${String(Math.floor(game.minutes / 60)).padStart(2, "0")}:${String(game.minutes % 60).padStart(2, "0")}`
    : "09:00";

  return (
    <main
      className={`game-root ${settings.highContrast ? "high-contrast" : ""} ${settings.largeText ? "large-text" : ""}`}
      data-screen={screen}
      data-audio-supported={audioStatus.supported}
      data-audio-state={audioStatus.contextState}
      data-audio-loaded={audioStatus.trackLoaded}
      data-audio-playing={audioStatus.musicPlaying}
      data-audio-level={audioStatus.outputLevel.toFixed(6)}
    >
      <Suspense
        fallback={
          <div className="loading-scene" role="status">
            Preparing your workplace…
          </div>
        }
      >
        <WorldCanvas
          checkpoint={worldEpoch}
          missionDay={game?.day ?? 1}
          missionResolved={game?.phase === "debrief"}
          active={active}
          blocked={Boolean(panel)}
          appearance={active && game ? game.profile.appearance : appearance}
          initialPosition={game?.position}
          reducedMotion={settings.reducedMotion}
          lowSpec={settings.lowSpec}
          onInteract={interact}
          onFocus={setFocus}
          onPosition={positionChanged}
          onReady={setReady}
          outcome={
            game?.phase === "debrief"
              ? (game.proposal?.option ?? "pending")
              : "pending"
          }
        />
      </Suspense>

      {screen === "menu" && (
        <section className="launch-panel">
          <div className="brand">
            <span className="brand-monogram">PQ</span>
            <span>PROJECTQUEST</span>
          </div>
          <div className="launch-copy">
            <p className="eyebrow">YOUR FIRST DAY. YOUR NEXT CHAPTER.</p>
            <h1>
              A career
              <br />
              worth <em>playing.</em>
            </h1>
            <p className="launch-description">
              Step into a project team. Find the facts, make the call, and see
              what happens next.
            </p>
            {game && (
              <button
                className="primary"
                onClick={() => {
                  setScreen("play");
                  setPanel(game.phase === "debrief" ? "debrief" : null);
                  setConfirmNew(false);
                }}
              >
                Continue as {game.profile.name}
                <span aria-hidden="true">↗</span>
              </button>
            )}
            <button
              className={game ? "secondary launch-new" : "primary"}
              onClick={startNew}
            >
              {game ? "Start a new career" : "Start your career"}
              {!game && <span aria-hidden="true">↗</span>}
            </button>
            {confirmNew && (
              <div className="confirm-inline" role="alert">
                <p>
                  A new career will replace your current local save after you
                  enter the workplace.
                </p>
                <button className="danger-button" onClick={startNew}>
                  Continue to character creation
                </button>
                <button
                  className="text-button"
                  onClick={() => setConfirmNew(false)}
                >
                  Keep current career
                </button>
              </div>
            )}
            <div className="launch-facts">
              <span>
                <b>01</b> Playable industry
              </span>
              <span>
                <b>3D</b> A real workplace
              </span>
              <span>
                <b>YOU</b> The decisions
              </span>
            </div>
            <p className="quiet">
              Two construction chapters · Single player · No account needed
            </p>
          </div>
          <button
            className="text-button launch-settings"
            onClick={() => setPanel("settings")}
          >
            Accessibility & settings
          </button>
          <button
            className="menu-audio-button"
            onClick={() => {
              enableAudio();
              setSettings((current) => ({ ...current, muted: !current.muted }));
            }}
            aria-label={
              settings.muted ? "Unmute game audio" : "Mute game audio"
            }
            aria-pressed={settings.muted}
          >
            <SoundIcon muted={settings.muted} />
            {settings.muted ? "Sound off" : "Sound on"}
          </button>
        </section>
      )}

      {screen === "character" && (
        <div className="creation-backdrop">
          <section className="creation-panel">
            <div className="step-heading">
              <button className="text-button" onClick={() => setScreen("menu")}>
                ← Main menu
              </button>
              <span>01 / 02 · YOUR CHARACTER</span>
            </div>
            <div className="creation-grid">
              <div>
                <p className="eyebrow">EVERY CAREER STARTS SOMEWHERE</p>
                <h1>
                  Meet your
                  <br />
                  <em>future self.</em>
                </h1>
                <p className="muted">
                  You bring the judgement. We’ll bring the first challenge.
                </p>
                <AvatarPortrait appearance={appearance} />
                <p className="avatar-caption">
                  Junior PM Intern · Your first placement
                </p>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (name.trim().length >= 2) setScreen("industry");
                }}
              >
                <label className="form-label" htmlFor="player-name">
                  What should your team call you?
                </label>
                <input
                  id="player-name"
                  autoFocus
                  required
                  minLength={2}
                  maxLength={32}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="given-name"
                />
                {(
                  [
                    ["skin", "Skin tone", SKINS],
                    ["shirt", "Workwear", SHIRTS],
                    ["hair", "Hair colour", HAIR],
                  ] as const
                ).map(([key, label, colours]) => (
                  <fieldset className="swatch-group" key={key}>
                    <legend>{label}</legend>
                    <div>
                      {colours.map((colour, index) => (
                        <button
                          type="button"
                          key={colour}
                          className={`swatch ${appearance[key] === colour ? "selected" : ""}`}
                          style={{ background: colour }}
                          aria-label={`${label} ${index + 1}`}
                          aria-pressed={appearance[key] === colour}
                          onClick={() =>
                            setAppearance((current) => ({
                              ...current,
                              [key]: colour,
                            }))
                          }
                        >
                          {appearance[key] === colour ? "✓" : ""}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <label className="form-label" htmlFor="assistance">
                  Mentor guidance
                </label>
                <select
                  id="assistance"
                  value={assistance}
                  onChange={(event) =>
                    setAssistance(event.target.value as "guided" | "standard")
                  }
                >
                  <option value="guided">
                    Guided · Contextual next-step hints
                  </option>
                  <option value="standard">
                    Standard · Find your own next step
                  </option>
                </select>
                <button
                  className="primary"
                  type="submit"
                  disabled={name.trim().length < 2}
                >
                  Choose your industry <span aria-hidden="true">→</span>
                </button>
              </form>
            </div>
          </section>
        </div>
      )}

      {screen === "industry" && (
        <div className="creation-backdrop">
          <section className="industry-panel">
            <div className="step-heading">
              <button
                className="text-button"
                onClick={() => setScreen("character")}
              >
                ← Character
              </button>
              <span>02 / 02 · YOUR PLACEMENT</span>
            </div>
            <p className="eyebrow">DIFFERENT WORLDS. TRANSFERABLE SKILLS.</p>
            <h1>
              Where will you
              <br />
              <em>make your mark?</em>
            </h1>
            <p className="muted">
              One deep first-day experience is available now. Every future
              industry builds on the same career systems.
            </p>
            <div className="industry-grid">
              <article className="industry-card selected-industry">
                <div className="industry-illustration">
                  <div className="crane-art" />
                  <div className="building-art" />
                  <span className="industry-badge">PLAYABLE CHAPTER</span>
                </div>
                <div className="industry-card-copy">
                  <span className="industry-number">01 / FIELD PLACEMENT</span>
                  <h2>Construction & Infrastructure</h2>
                  <p>
                    A community building, a missing concrete delivery, and a
                    team counting on you.
                  </p>
                  <div className="skill-tags">
                    <span>Dependencies</span>
                    <span>Issue management</span>
                    <span>Communication</span>
                  </div>
                </div>
              </article>
              <article className="industry-card planned-industry">
                <div className="software-illustration">
                  <span>⌘</span>
                  <span className="industry-badge">
                    NEXT INDUSTRY · IN DEVELOPMENT ROADMAP
                  </span>
                </div>
                <div className="industry-card-copy">
                  <span className="industry-number">02 / FUTURE PLACEMENT</span>
                  <h2>Software & Technology</h2>
                  <p>
                    Investigate defects, coordinate QA, and manage the pressure
                    of a product release.
                  </p>
                  <p className="quiet">
                    This placement is not playable in the current slice.
                  </p>
                </div>
              </article>
            </div>
            <details className="future-sectors">
              <summary>Four more industries in the full-game roadmap</summary>
              <div>
                {FUTURE_INDUSTRIES.slice(1).map(
                  ([icon, label, description]) => (
                    <article key={label}>
                      <span aria-hidden="true">{icon}</span>
                      <strong>{label}</strong>
                      <p>{description} Planned content.</p>
                    </article>
                  ),
                )}
              </div>
            </details>
            <div className="industry-footer">
              <div>
                <strong>{name.trim()}</strong>
                <span>Junior PM Intern · Riverside community building</span>
              </div>
              <button className="primary" onClick={begin}>
                Enter the workplace <span aria-hidden="true">↗</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {active && game && (
        <>
          <header className="hud-header">
            <div className="brand">
              <span className="brand-monogram">PQ</span>
              <span>PROJECTQUEST</span>
            </div>
            <div className="hud-top-right">
              <button
                className="icon-button audio-quick-toggle"
                onClick={() => {
                  enableAudio();
                  setSettings((current) => ({
                    ...current,
                    muted: !current.muted,
                  }));
                }}
                aria-label={
                  settings.muted ? "Unmute game audio" : "Mute game audio"
                }
                aria-pressed={settings.muted}
              >
                <SoundIcon muted={settings.muted} />
              </button>
              <div className="clock-block">
                <b>
                  DAY {game.day} <span>· {clock}</span>
                </b>
                <small>
                  {game.phase === "debrief"
                    ? "Checkpoint resolved"
                    : "Time advances when you choose"}
                </small>
              </div>
              <button
                className="icon-button"
                aria-label="Open settings"
                onClick={() => setPanel("settings")}
              >
                ☷
              </button>
              <button
                className="secondary"
                onClick={() => {
                  saveGame(game);
                  setScreen("menu");
                  setPanel(null);
                }}
              >
                Main menu
              </button>
            </div>
          </header>
          <aside className="mission-hud">
            <p className="eyebrow">
              CONSTRUCTION · CHAPTER {String(game.day).padStart(2, "0")}
            </p>
            <h2>
              {game.missionId === "CONST-I02" ? (
                <>
                  The Slipping
                  <br />
                  Milestone
                </>
              ) : (
                <>
                  The Missing
                  <br />
                  Materials
                </>
              )}
            </h2>
            <div className="mission-progress">
              <span
                style={{
                  width: `${(completed / Math.max(objectives.length, 1)) * 100}%`,
                }}
              />
            </div>
            <p className="progress-label">
              {completed} / {objectives.length} objectives complete
            </p>
            <p className="next-action">
              {nextObjective?.label ??
                "Assignment reviewed. Your case study is saved."}
            </p>
            {game.profile.assistance === "guided" && (
              <p className="hint">
                {game.phase === "arrival"
                  ? "Find Alex in the field office. Walk around the planning table to meet your mentor."
                  : game.evidence.length < 3
                    ? game.missionId === "CONST-I02"
                      ? "Inspect the dependency schedule. Ask Sam about the survey and Taylor about the two acceptance gates."
                      : "Compare the schedule with Sam’s crew constraints and Morgan’s delivery estimate."
                    : game.phase === "debrief"
                      ? "Review how your decisions changed the project. Try another approach to compare outcomes."
                      : game.missionId === "CONST-I02"
                        ? "Record both successor links and both pour predecessors, then assign Sam to the 11:00 check."
                        : "Keep estimates conditional. Record an owner, a due day, and a next check before reporting."}
              </p>
            )}
            <button className="text-button" onClick={() => setPanel("journal")}>
              Open mission journal <span aria-hidden="true">↗</span>
            </button>
          </aside>
          <div className="project-health">
            <span>FOUNDATION MILESTONE</span>
            <b>
              Day {game.project.forecastFinishDay}
              <small> / baseline Day {game.project.baselineFinishDay}</small>
            </b>
            <p>
              Trust {game.project.stakeholderTrust}% · Quality{" "}
              {game.project.quality}%
            </p>
          </div>
          <div className="world-status">
            <span className="status-dot" />
            {ready ? "RIVERSIDE · FIELD OFFICE" : "Preparing workplace…"}
            <small data-testid="save-status">{saved}</small>
          </div>
          <nav className="game-toolbar" aria-label="Game tools">
            <button onClick={() => setPanel("board")}>
              <kbd>T</kbd> Project tablet
            </button>
            <button onClick={() => setPanel("journal")}>
              <kbd>J</kbd> Journal
            </button>
            <button onClick={() => setPanel("career")}>Career</button>
            <button onClick={() => setPanel("routes")}>
              Accessible navigation
            </button>
            {game.phase === "debrief" && (
              <button onClick={() => setPanel("debrief")}>
                Review debrief
              </button>
            )}
          </nav>
          {focus && !panel && (
            <button
              className="interaction-prompt"
              onClick={() => interact(focus.id)}
            >
              <kbd>E</kbd>
              <span>
                {focus.name}
                <small>{focus.role}</small>
              </span>
              <span>Interact ↗</span>
            </button>
          )}
          <div className="control-hint">
            WASD / arrows · Move &nbsp; Drag · Camera &nbsp; E · Interact &nbsp;
            Click ground · Walk
          </div>
        </>
      )}

      {notice && (
        <div
          className={`toast ${noticeError ? "error" : ""}`}
          role={noticeError ? "alert" : "status"}
        >
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}

      {game && panel && !["settings", "routes"].includes(panel) && (
        <GamePanel
          kind={panel as Exclude<Panel, "settings" | "routes" | null>}
          state={game}
          dispatch={dispatch}
          onClose={close}
          onReplay={replay}
          onMenu={() => {
            setPanel(null);
            setScreen("menu");
          }}
        />
      )}
      {panel === "settings" && (
        <Dialog
          title="Make it your workplace"
          eyebrow="SETTINGS & ACCESSIBILITY"
          onClose={close}
        >
          <p className="muted">
            Take your time. Project time only advances at the deliberate mission
            checkpoint.
          </p>
          <div className="settings-list">
            {(
              [
                [
                  "reducedMotion",
                  "Reduced motion",
                  "Remove camera smoothing and ambient animation.",
                ],
                [
                  "highContrast",
                  "High contrast",
                  "Stronger text and interface boundaries.",
                ],
                [
                  "largeText",
                  "Larger text",
                  "Increase panel and tool readability.",
                ],
                [
                  "lowSpec",
                  "Lower graphics cost",
                  "Reduce resolution and shadows for less powerful devices.",
                ],
              ] as const
            ).map(([key, label, description]) => (
              <label key={key}>
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <AudioSettings
            preferences={settings}
            onChange={(preferences) =>
              setSettings((current) => ({ ...current, ...preferences }))
            }
            onEnable={enableAudio}
            supported={audioStatus.supported}
            started={audioStatus.started}
            playing={audioStatus.musicPlaying}
            error={audioStatus.error}
          />
          <div className="controls-explained">
            <h3>Workplace controls</h3>
            <p>
              WASD or arrows to walk. Hold and drag the world to orbit the
              camera. Click ground to walk. E to interact nearby. T opens your
              portable tablet. J opens the journal. Escape pauses into settings.
              Tab navigates interface controls.
            </p>
            <p>
              Accessible navigation offers a labelled route to every source. The
              same evidence and decisions are required. No objective depends on
              audio or reaction speed.
            </p>
          </div>
          <button className="primary" onClick={close}>
            Return to {active ? "workplace" : "menu"}
          </button>
        </Dialog>
      )}
      {game && panel === "routes" && (
        <Dialog
          title="Your workplace, within reach"
          eyebrow="ACCESSIBLE NAVIGATION"
          onClose={close}
        >
          <p className="muted">
            Use a labelled route to reach a colleague or project station. This
            moves your character beside the same 3D interaction; investigation
            and decisions stay in your hands.
          </p>
          <div className="route-grid">
            {ROUTES.map((route) => (
              <button
                className="route-card"
                key={route.id}
                onClick={() => travel(route)}
              >
                <small>{route.room}</small>
                <strong>Go to {route.name}</strong>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </Dialog>
      )}
    </main>
  );
}
