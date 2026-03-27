import { useEffect, useRef, useState } from "react";

type InfoHintProps = {
  text: string;
  label?: string;
};

export function InfoHint({ text, label = "Q" }: InfoHintProps) {
  const [isPinnedOpen, setPinnedOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isPinnedOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setPinnedOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPinnedOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPinnedOpen]);

  return (
    <span
      ref={rootRef}
      className={isPinnedOpen ? "info-hint info-hint-open" : "info-hint"}
    >
      <button
        type="button"
        className="info-hint-button"
        aria-label="Показать подсказку"
        aria-expanded={isPinnedOpen}
        onClick={() => setPinnedOpen((current) => !current)}
      >
        {label}
      </button>
      <span className="info-hint-tooltip" role="tooltip">
        {text}
      </span>
    </span>
  );
}
