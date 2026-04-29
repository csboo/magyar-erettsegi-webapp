import { useMemo, useState } from "react";
import { ClearableSearchInput } from "../components/ClearableSearchInput";
import { useCharacters } from "../hooks/useCharacters";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { groupForSearch } from "../lib/data";
import { fuzzyScore } from "../lib/text";

type MatchType = "karakter" | "mű" | "szerző";

type SearchMatch = {
  book: {
    title: string;
    writer: string;
  };
  score: number;
  characters: Array<{
    name: string;
    description: string;
    score: number;
    matchTypes: MatchType[];
  }>;
};

function searchRecords(query: string, books: ReturnType<typeof groupForSearch>): SearchMatch[] {
  if (!query.trim()) {
    return [];
  }

  const matchedBooks = new Map<string, SearchMatch>();

  for (const book of books) {
    const titleScore = fuzzyScore(query, book.title);
    const writerScore = fuzzyScore(query, book.writer);
    const titleMatch = titleScore > 0;
    const writerMatch = writerScore > 0;

    const characters = [];

    for (const record of book.records) {
      const nameScore = fuzzyScore(query, record.name);
      const nameMatch = nameScore > 0;

      if (!nameMatch && !titleMatch && !writerMatch) {
        continue;
      }

      const matchTypes: MatchType[] = [];
      let bestScore = 0;

      if (nameMatch) {
        matchTypes.push("karakter");
        bestScore = Math.max(bestScore, nameScore);
      }
      if (titleMatch) {
        matchTypes.push("mű");
        bestScore = Math.max(bestScore, titleScore);
      }
      if (writerMatch) {
        matchTypes.push("szerző");
        bestScore = Math.max(bestScore, writerScore);
      }

      characters.push({
        name: record.name,
        description: record.description,
        matchTypes,
        score: bestScore,
      });
    }

    if (characters.length === 0) {
      continue;
    }

    characters.sort((a, b) => b.score - a.score);
    const bookScore = Math.max(titleScore, writerScore, characters[0]?.score ?? 0);

    matchedBooks.set(book.title, {
      book: {
        title: book.title,
        writer: book.writer,
      },
      score: bookScore,
      characters,
    });
  }

  return Array.from(matchedBooks.values()).sort((a, b) => b.score - a.score);
}

export function SearchPage() {
  const { records, loading, error } = useCharacters();
  const books = useMemo(() => groupForSearch(records), [records]);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);

  const results = useMemo(
    () => searchRecords(debouncedQuery, books),
    [books, debouncedQuery],
  );

  const totalCharacters = useMemo(
    () => results.reduce((sum, book) => sum + book.characters.length, 0),
    [results],
  );

  return (
    <section className="search-page">
      <header className="header">
        <h1>Keresés</h1>
      </header>

      <div className="search-bar">
        <ClearableSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Keress karakterre, műre vagy szerzőre..."
        />
        <span className="search-count">
          {query.trim()
            ? results.length
              ? `${results.length} mű, ${totalCharacters} karakter`
              : "Nincs találat"
            : ""}
        </span>
      </div>

      {loading ? <p className="status">Betöltés...</p> : null}
      {error ? <p className="status">{error}</p> : null}
      {!loading && !error && query.trim() ? (
        <div aria-live="polite">
          {results.map((result) => (
            <article key={result.book.title} className="result-book">
              <h2 className="result-book-title">{result.book.title}</h2>
              <p className="result-book-writer">{result.book.writer}</p>
              <ul className="result-characters">
                {result.characters.map((character) => (
                  <li key={`${result.book.title}-${character.name}`} className="result-character">
                    <span className="result-character-name">{character.name}</span>
                    {character.matchTypes.map((type) => (
                      <span key={`${character.name}-${type}`} className={`match-badge ${type}`}>
                        {type}
                      </span>
                    ))}
                    {character.description ? (
                      <p className="result-character-desc">{character.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
