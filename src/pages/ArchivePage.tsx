import { useMemo, useState } from "react";
import { ClearableSearchInput } from "../components/ClearableSearchInput";
import { useCharacters } from "../hooks/useCharacters";
import { groupByWriters } from "../lib/data";

export function ArchivePage() {
  const { records, loading, error } = useCharacters();
  const writers = useMemo(() => groupByWriters(records), [records]);
  const [query, setQuery] = useState("");
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [openBooks, setOpenBooks] = useState<Record<string, boolean>>({});

  const filteredWriters = useMemo(() => {
    const value = query.toLowerCase().trim();
    if (!value) {
      return writers;
    }

    return writers
      .map((writer) => {
        const writerMatches = writer.writer.toLowerCase().includes(value);
        const books = writer.books.filter(
          (book) =>
            writerMatches ||
            book.title.toLowerCase().includes(value) ||
            book.characters.some((character) => character.name.toLowerCase().includes(value)),
        );
        return books.length ? { ...writer, books } : null;
      })
      .filter((writer): writer is NonNullable<typeof writer> => writer !== null);
  }, [query, writers]);

  const filteredBookCount = useMemo(
    () => filteredWriters.reduce((sum, writer) => sum + writer.books.length, 0),
    [filteredWriters],
  );
  const visibleBookKeys = useMemo(
    () =>
      filteredWriters.flatMap((writer) =>
        writer.books.map((book) => `${writer.writer}-${book.title}`),
      ),
    [filteredWriters],
  );
  const hasVisibleBooks = visibleBookKeys.length > 0;
  const allVisibleBooksOpen =
    hasVisibleBooks && visibleBookKeys.every((key) => openBooks[key]);

  return (
    <section className="adattar">
      <header className="header">
        <h1>Adattár</h1>
        <p>{writers.length ? `${writers.length} szerző` : ""}</p>
      </header>

      <div className="search-bar">
        <ClearableSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Keresés szerzők és művek között..."
        />
        <span className="search-count">
          {query.trim()
            ? `${filteredWriters.length} szerző, ${filteredBookCount} mű`
            : `${writers.length} szerző`}
        </span>
      </div>

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
        <div className="archive-controls">
          <button
            type="button"
            className="archive-control-btn"
            onClick={() =>
              setOpenBooks((current) => {
                const next = { ...current };
                for (const key of visibleBookKeys) {
                  next[key] = true;
                }
                return next;
              })
            }
            disabled={!hasVisibleBooks || allVisibleBooksOpen}
          >
            Összes lenyitása
          </button>
          <button
            type="button"
            className="archive-control-btn"
            onClick={() =>
              setOpenBooks((current) => {
                const next = { ...current };
                for (const key of visibleBookKeys) {
                  next[key] = false;
                }
                return next;
              })
            }
            disabled={!hasVisibleBooks}
          >
            Összes bezárása
          </button>
        </div>
      </div>

      <section className="card adattar-card" aria-live="polite">
        {loading ? <p className="status">Betöltés...</p> : null}
        {error ? <p className="status">{error}</p> : null}
        {!loading && !error && filteredWriters.length === 0 ? <p className="status">Nincs találat.</p> : null}
        {!loading && !error && filteredWriters.length > 0 ? (
          <div className="archive-writer-list">
            {filteredWriters.map((writer) => (
              <section key={writer.writer} className="writer-section">
                <div className="writer-header">
                  <span className="writer-name">{writer.writer}</span>
                  <span className="writer-book-count">{writer.books.length} mű</span>
                </div>

                <div className="book-list">
                  {writer.books.map((book) => {
                    const bookKey = `${writer.writer}-${book.title}`;
                    return (
                      <details
                        key={bookKey}
                        className="archive-book-dropdown"
                        open={Boolean(openBooks[bookKey])}
                        onToggle={(event) => {
                          const isOpen = event.currentTarget.open;
                          setOpenBooks((current) => ({
                            ...current,
                            [bookKey]: isOpen,
                          }));
                        }}
                      >
                        <summary className="book-item">
                          <span className="book-title">{book.title}</span>
                          <span className="book-char-count">{book.characters.length} karakter</span>
                        </summary>
                        <ul className="archive-character-list">
                          {book.characters.map((character, index) => (
                            <li key={`${character.name}-${index}`} className="character-item">
                              <span className="character-name">{character.name}</span>
                              {showDescriptions && character.description ? (
                                <p className="character-description">{character.description}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </details>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
