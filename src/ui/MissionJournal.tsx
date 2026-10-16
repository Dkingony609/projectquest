import { useRef, useState, type ReactNode } from "react";
import { DAY2, getObjectives, getPack, type GameState } from "../game";
import "./journal.css";

type JournalSection = "assignment" | "evidence" | "activity";
interface JournalPage {
  title: string;
  content: ReactNode;
}
interface JournalSpread {
  section: JournalSection;
  pages: [JournalPage, JournalPage];
}
const sections: { id: JournalSection; label: string }[] = [
  { id: "assignment", label: "Assignment" },
  { id: "evidence", label: "Evidence" },
  { id: "activity", label: "Activity" },
];

/** A read-only view of canonical mission evidence; turning pages changes no game state. */
export default function MissionJournal({ state }: { state: GameState }) {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const spreadRef = useRef<HTMLDivElement>(null);
  const dayTwo = state.missionId === DAY2.id;
  const pack = getPack();
  const mission = dayTwo ? DAY2 : pack.mission;
  const sources = dayTwo ? DAY2.sources : pack.sources;
  const objectives = getObjectives(state);
  const completed = objectives.filter((objective) => objective.complete).length;
  const events = dayTwo
    ? state.events.filter((event) => event.day === 2)
    : state.events;
  const spreads: JournalSpread[] = [
    {
      section: "assignment",
      pages: [
        {
          title: "Assignment notes",
          content: (
            <>
              <p className="pq-journal-mission">{mission.title}</p>
              <p className="pq-journal-handwriting" data-testid="journal-body">
                {mission.briefing}
              </p>
              <div className="pq-journal-signoff">
                <span>My placement</span>
                <strong>{state.profile.name}</strong>
                <small>{state.career.role} · Day {state.day}</small>
              </div>
            </>
          ),
        },
        {
          title: "Assignment objectives",
          content: (
            <>
              <p className="pq-journal-progress">
                {completed} of {objectives.length} complete
              </p>
              <ul className="pq-journal-objectives">
                {objectives.map((objective) => (
                  <li
                    key={objective.id}
                    className="pq-journal-objective"
                    data-complete={objective.complete}
                  >
                    <span className="pq-journal-check" aria-hidden="true">
                      {objective.complete ? "✓" : "○"}
                    </span>
                    <span>
                      {objective.label}
                      <span className="sr-only">
                        {" "}· {objective.complete ? "Complete" : "Pending"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ),
        },
      ],
    },
  ];

  const evidencePages: JournalPage[] = state.evidence.map((id) => {
    const source = sources[id];
    return {
      title: "Evidence notebook",
      content: (
        <article className="pq-journal-source" key={id}>
          <h4>Source record · {source.title}</h4>
          <ul>
            {source.detail.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <footer className="pq-journal-provenance">
            <span>Source provenance</span>
            <small>{source.provenance}</small>
          </footer>
        </article>
      ),
    };
  });
  if (!evidencePages.length) {
    evidencePages.push({
      title: "Evidence notebook",
      content: (
        <p className="pq-journal-empty">
          Your notebook is empty. Speak with Alex, then inspect the schedule and
          investigate with your colleagues.
        </p>
      ),
    });
  }
  for (let index = 0; index < evidencePages.length; index += 2) {
    spreads.push({
      section: "evidence",
      pages: [
        evidencePages[index],
        evidencePages[index + 1] ?? {
          title: "Room for more evidence",
          content: (
            <p className="pq-journal-empty">
              Source records appear here as you inspect project information and
              speak with your colleagues.
            </p>
          ),
        },
      ],
    });
  }

  const activityPages: JournalPage[] = [];
  for (let index = 0; index < Math.max(1, events.length); index += 5) {
    const pageEvents = events.slice(index, index + 5);
    activityPages.push({
      title: dayTwo ? "Day 2 activity" : "Activity log",
      content: pageEvents.length ? (
        <ol className="pq-journal-events">
          {pageEvents.map((event) => (
            <li key={event.seq}>
              <small>#{String(event.seq).padStart(2, "0")}</small>
              <p>{event.summary}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="pq-journal-empty">No activity recorded yet.</p>
      ),
    });
  }
  for (let index = 0; index < activityPages.length; index += 2) {
    spreads.push({
      section: "activity",
      pages: [
        activityPages[index],
        activityPages[index + 1] ?? {
          title: "Up to date",
          content: (
            <p className="pq-journal-empty">
              End of the current entries. Your next actions will be recorded in
              the activity log.
            </p>
          ),
        },
      ],
    });
  }

  const currentIndex = Math.min(spreadIndex, spreads.length - 1);
  const current = spreads[currentIndex];
  const firstPage = currentIndex * 2 + 1;
  const turnTo = (index: number) => {
    setSpreadIndex(index);
    spreadRef.current
      ?.closest(".pq-dialog-content")
      ?.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className="pq-journal-book" data-testid="mission-journal">
      <div className="pq-journal-inscription">
        <span>PROJECTQUEST / FIELD NOTES</span>
        <small>
          Riverside Community Build · Day {String(state.day).padStart(2, "0")}
        </small>
      </div>
      <nav className="pq-journal-tabs" aria-label="Journal sections">
        {sections.map((section) => (
          <button
            key={section.id}
            aria-current={current.section === section.id ? "page" : undefined}
            onClick={() =>
              turnTo(
                spreads.findIndex((spread) => spread.section === section.id),
              )
            }
          >
            {section.label}
            <span aria-hidden="true">
              {section.id === "assignment"
                ? "01"
                : section.id === "evidence"
                  ? "02"
                  : "03"}
            </span>
          </button>
        ))}
      </nav>
      <div
        className="pq-journal-spread"
        ref={spreadRef}
        aria-label="Journal pages"
      >
        {current.pages.map((page, side) => (
          <section className="pq-journal-page" key={`${currentIndex}-${side}`}>
            <div className="pq-journal-page-heading">
              <span aria-hidden="true">
                {current.section} / day {state.day}
              </span>
              <h3>{page.title}</h3>
            </div>
            <div className="pq-journal-page-content">{page.content}</div>
            <footer
              className="pq-journal-page-number"
              aria-label={`Page ${firstPage + side}`}
            >
              {String(firstPage + side).padStart(2, "0")}
            </footer>
          </section>
        ))}
      </div>
      <nav className="pq-journal-pagination" aria-label="Journal page controls">
        <button
          disabled={currentIndex === 0}
          onClick={() => turnTo(currentIndex - 1)}
          aria-label="Previous spread"
        >
          <span aria-hidden="true">←</span> Previous
        </button>
        <span role="status" data-testid="journal-page-indicator">
          Pages {firstPage}–{firstPage + 1} of {spreads.length * 2}
        </span>
        <button
          disabled={currentIndex === spreads.length - 1}
          onClick={() => turnTo(currentIndex + 1)}
          aria-label="Next spread"
        >
          Next <span aria-hidden="true">→</span>
        </button>
      </nav>
    </div>
  );
}
