import { useEffect, useRef, type ReactNode } from "react";
import "./devices.css";

interface DialogProps {
  title: string;
  eyebrow: string;
  wide?: boolean;
  variant?: "panel" | "tablet" | "journal";
  status?: string;
  children: ReactNode;
  onClose: () => void;
}

/** A single keyboard boundary for every world interaction and project tool. */
export default function Dialog({
  title,
  eyebrow,
  wide = false,
  variant = "panel",
  status,
  children,
  onClose,
}: DialogProps) {
  const panel = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    heading.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      }
      if (event.key !== "Tab" || !panel.current) return;
      const elements = Array.from(
        panel.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) {
        event.preventDefault();
        heading.current?.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          !elements.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !elements.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("keydown", handleKey, true);
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);

  return (
    <div className={`modal-backdrop pq-backdrop pq-backdrop-${variant}`}>
      <section
        ref={panel}
        className={`panel pq-panel${wide ? " pq-panel-wide" : ""} pq-dialog-${variant}`}
        data-presentation={variant}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pq-panel-title"
      >
        {variant === "tablet" && (
          <div className="pq-tablet-hardware" aria-hidden="true">
            <span className="pq-tablet-camera" />
          </div>
        )}
        <div className="pq-dialog-surface">
          {variant === "tablet" && (
            <div className="pq-tablet-status">
              <span>
                <span className="pq-tablet-mark" aria-hidden="true">PQ</span>
                PROJECT WORKSPACE
              </span>
              <span>{status}</span>
            </div>
          )}
          <header className="pq-panel-heading">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2 ref={heading} tabIndex={-1} id="pq-panel-title">
                {title}
              </h2>
            </div>
            <button
              className="pq-close"
              aria-label="Close panel"
              onClick={onClose}
            >
              ×
            </button>
          </header>
          <div className="pq-dialog-content">{children}</div>
        </div>
        {variant === "tablet" && (
          <footer className="pq-tablet-bezel">
            <span aria-hidden="true">PROJECTQUEST</span>
            <button
              className="pq-tablet-home"
              type="button"
              aria-label="Put tablet away"
              title="Put tablet away"
              onClick={onClose}
            >
              <span aria-hidden="true" />
            </button>
            <span aria-hidden="true">FIELD EDITION</span>
          </footer>
        )}
      </section>
    </div>
  );
}
