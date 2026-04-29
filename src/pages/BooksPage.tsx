import { useEffect, useMemo, useState } from "react";
import { useCharacters } from "../hooks/useCharacters";
import { groupByBooks } from "../lib/data";

export function BooksPage() {
  const { records, loading, error } = useCharacters();
  const books = useMemo(() => groupByBooks(records), [records]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDescriptions, setShowDescriptions] = useState(false);

  const hasBooks = books.length > 0;
  const safeIndex = hasBooks ? Math.min(currentIndex, books.length - 1) : 0;
  const currentBook = books[safeIndex];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        setCurrentIndex((index) => Math.max(0, index - 1));
      }
      if (event.key === "ArrowRight") {
        setCurrentIndex((index) => Math.min(books.length - 1, index + 1));
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [books.length]);

  return (
    <section className="reader">
      <header className="header">
        <h1>Irodalom Érettségi Művek</h1>
        <p>{hasBooks ? `${books.length} mű` : ""}</p>
      </header>

      <div className="toolbar">
        <label className="toggle">
          <input
            type="checkbox"
            checked={showDescriptions}
            onChange={(event) => setShowDescriptions(event.target.checked)}
          />
          <span className="toggle-track" />
          <span className="toggle-label">Leírások mutatása</span>
        </label>
      </div>

      <section className="card book-card" aria-live="polite">
        {!loading && !error && currentBook ? (
          <>
            <h2>{currentBook.title}</h2>
            <p className="meta">Szerző: {currentBook.writer}</p>
            <ol className="character-list">
              {currentBook.characters.map((character, index) => (
                <li key={`${character.name}-${index}`} className="character-item">
                  <span className="character-name">
                    {index + 1}. {character.name}
                  </span>
                  {showDescriptions && character.description ? (
                    <p className="character-description">{character.description}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="status">
            {loading
              ? "Betöltés..."
              : error ?? "Nincs megjeleníthető mű."}
          </p>
        )}
      </section>

      <nav className="controls" aria-label="Navigáció">
        <button
          type="button"
          onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          disabled={!hasBooks || safeIndex === 0}
        >
          Prev
        </button>
        <p className="progress">{hasBooks ? `${safeIndex + 1} / ${books.length}` : "0 / 0"}</p>
        <button
          type="button"
          onClick={() => setCurrentIndex((index) => Math.min(books.length - 1, index + 1))}
          disabled={!hasBooks || safeIndex === books.length - 1}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
