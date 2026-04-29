import { useEffect, useMemo, useState } from "react";
import { useCharacters } from "../hooks/useCharacters";

export function ReaderPage() {
  const { records, loading, error } = useCharacters();
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasRecords = records.length > 0;
  const safeIndex = hasRecords ? Math.min(currentIndex, records.length - 1) : 0;
  const record = records[safeIndex];

  const progress = useMemo(
    () => (hasRecords ? `${safeIndex + 1} / ${records.length}` : "0 / 0"),
    [hasRecords, records.length, safeIndex],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        setCurrentIndex((index) => Math.max(0, index - 1));
      }
      if (event.key === "ArrowRight") {
        setCurrentIndex((index) => Math.min(records.length - 1, index + 1));
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [records.length]);

  return (
    <section className="reader">
      <header className="header">
        <h1>Irodalom Érettségi Karakterek</h1>
        <p>Egyesével lapozható összefoglaló</p>
      </header>

      <section className="card" aria-live="polite">
        {!loading && !error && record ? (
          <>
            <h2>{record.name}</h2>
            <div className="meta">
              <span>Mű: {record.title}</span>
              <span>Szerző: {record.writer}</span>
            </div>
            <p className="description">{record.description}</p>
          </>
        ) : (
          <p className="status">
            {loading
              ? "Betöltés..."
              : error ?? "Nincs megjeleníthető rekord."}
          </p>
        )}
      </section>

      <nav className="controls" aria-label="Navigáció">
        <button
          type="button"
          onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          disabled={!hasRecords || safeIndex === 0}
        >
          Prev
        </button>
        <p className="progress">{progress}</p>
        <button
          type="button"
          onClick={() => setCurrentIndex((index) => Math.min(records.length - 1, index + 1))}
          disabled={!hasRecords || safeIndex === records.length - 1}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
