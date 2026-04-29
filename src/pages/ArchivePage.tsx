import { useMemo, useState } from "react";
import { useCharacters } from "../hooks/useCharacters";
import { groupByWriters } from "../lib/data";

export function ArchivePage() {
  const { records, loading, error } = useCharacters();
  const writers = useMemo(() => groupByWriters(records), [records]);
  const [query, setQuery] = useState("");
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

  return (
    <section className="adattar">
      <header className="header">
        <h1>Adattár</h1>
        <p>{writers.length ? `${writers.length} szerző` : ""}</p>
      </header>

      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Keresés szerzők és művek között..."
        />
        <span className="search-count">
          {query.trim()
            ? `${filteredWriters.length} szerző, ${filteredBookCount} mű`
            : `${writers.length} szerző`}
        </span>
      </div>

      <section className="card adattar-card" aria-live="polite">
        {loading ? <p className="status">Betöltés...</p> : null}
        {error ? <p className="status">{error}</p> : null}
        {!loading && !error && filteredWriters.length === 0 ? <p className="status">Nincs találat.</p> : null}
        {!loading && !error && filteredWriters.length > 0 ? (
          <div>
            {filteredWriters.map((writer) => (
              <section key={writer.writer} className="writer-section">
                <div className="writer-header">
                  <span className="writer-name">{writer.writer}</span>
                  <span className="writer-book-count">{writer.books.length} mű</span>
                </div>

                <div className="book-list open">
                  {writer.books.map((book) => {
                    const bookKey = `${writer.writer}-${book.title}`;
                    const isOpen = openBooks[bookKey] ?? false;
                    return (
                      <div key={bookKey}>
                        <button
                          type="button"
                          className="book-item"
                          onClick={() =>
                            setOpenBooks((current) => ({
                              ...current,
                              [bookKey]: !isOpen,
                            }))
                          }
                        >
                          <span className="book-title">{book.title}</span>
                          <span className="book-char-count">({book.characters.length} karakter)</span>
                        </button>
                        <ul className={`character-list ${isOpen ? "open" : ""}`}>
                          {book.characters.map((character, index) => (
                            <li key={`${character.name}-${index}`} className="character-item">
                              <span className="character-name">{character.name}</span>
                              {character.description ? (
                                <p className="character-description">{character.description}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
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
