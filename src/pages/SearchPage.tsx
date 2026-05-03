import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { ClearableSearchInput } from "../components/ClearableSearchInput";
import { FontSizeControls } from "../components/FontSizeControls";
import { useCharacters } from "../hooks/useCharacters";
import { useGonoszRecords } from "../hooks/useGonoszRecords";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { usePersistentState } from "../hooks/usePersistentState";
import { groupForSearch } from "../lib/data";
import { fuzzyScore } from "../lib/text";
import type { Memoriter, GonoszRecord } from "../types";

type DataSource = "characters" | "memoriterek" | "gonosz";

type MatchInfo = {
  type: string;
  field?: string;
};

type SearchResult = {
  source: DataSource;
  score: number;
  title: string;
  subtitle?: string;
  description?: string;
  matchInfo: MatchInfo[];
};

export function SearchPage() {
  const { records: characterRecords, loading: charLoading, error: charError } = useCharacters();
  const { records: gonoszRecords, loading: gonoszLoading, error: gonoszError } = useGonoszRecords();
  const [memoriterek, setMemoriterek] = useState<Memoriter[]>([]);
  const [memoLoading, setMemoLoading] = useState(true);
  const [memoError, setMemoError] = useState<string | null>(null);

  const books = useMemo(() => groupForSearch(characterRecords), [characterRecords]);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [activeFilter, setActiveFilter] = useState<DataSource | "all">("all");
  const [fontScale, setFontScale] = usePersistentState<number>("search-fontScale", 1);

  useEffect(() => {
    fetch("/memoriterek.json")
      .then((res) => {
        if (!res.ok) throw new Error("Nem sikerült betölteni a memoriterek.json fájlt.");
        return res.json();
      })
      .then((data: Memoriter[]) => {
        setMemoriterek(data);
        setMemoLoading(false);
      })
      .catch((err) => {
        setMemoError(err instanceof Error ? err.message : "Ismeretlen hiba.");
        setMemoLoading(false);
      });
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const allResults: SearchResult[] = [];

    if (activeFilter === "all" || activeFilter === "characters") {
      searchCharacters(debouncedQuery, books, allResults);
    }
    if (activeFilter === "all" || activeFilter === "memoriterek") {
      searchMemoriterek(debouncedQuery, memoriterek, allResults);
    }
    if (activeFilter === "all" || activeFilter === "gonosz") {
      searchGonosz(debouncedQuery, gonoszRecords, allResults);
    }

    return allResults.sort((a, b) => b.score - a.score);
  }, [debouncedQuery, books, memoriterek, gonoszRecords, activeFilter]);

  const loading = charLoading || gonoszLoading || memoLoading;
  const error = charError || gonoszError || memoError;

  return (
    <section
      className="search-page font-scale-target"
      style={{ "--content-font-scale": fontScale } as CSSProperties}
    >
      <header className="header">
        <h1>Keresés</h1>
      </header>

      <div className="search-bar">
        <ClearableSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Keress karakterre, műre, szerzőre, memoriterre..."
        />
      </div>

      <div className="search-filters">
        <button
          className={`search-filter-btn${activeFilter === "all" ? " active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          Összes
        </button>
        <button
          className={`search-filter-btn${activeFilter === "characters" ? " active" : ""}`}
          onClick={() => setActiveFilter("characters")}
        >
          Karakterek
        </button>
        <button
          className={`search-filter-btn${activeFilter === "memoriterek" ? " active" : ""}`}
          onClick={() => setActiveFilter("memoriterek")}
        >
          Memoritérek
        </button>
        <button
          className={`search-filter-btn${activeFilter === "gonosz" ? " active" : ""}`}
          onClick={() => setActiveFilter("gonosz")}
        >
          Gonosz adatok
        </button>
      </div>

      <div className="search-extra-controls">
        <FontSizeControls value={fontScale} onChange={setFontScale} />
      </div>

      <span className="search-count">
        {query.trim()
          ? results.length
            ? `${results.length} találat`
            : "Nincs találat"
          : ""}
      </span>

      {loading ? <p className="status">Betöltés...</p> : null}
      {error ? <p className="status">{error}</p> : null}
      {!loading && !error && query.trim() ? (
        <div aria-live="polite" className="search-results">
          {results.map((result, idx) => (
            <article key={`${result.source}-${idx}`} className={`result-item result-${result.source}`}>
              <h2 className="result-title">{result.title}</h2>
              {result.subtitle ? <p className="result-subtitle">{result.subtitle}</p> : null}
              <div className="result-badges">
                <span
                  className={`result-source-badge ${
                    result.source === "memoriterek" ? "memoriter-source" : result.source
                  }`}
                >
                  {result.source === "characters" ? "Karakter" : result.source === "memoriterek" ? "Memoriter" : "Gonosz"}
                </span>
                {result.matchInfo.map((info, i) => (
                  <span key={i} className={`match-badge ${info.type}`}>
                    {info.field ? `${info.type}: ${info.field}` : info.type}
                  </span>
                ))}
              </div>
              {result.description ? <p className="result-desc">{result.description}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function searchCharacters(query: string, books: ReturnType<typeof groupForSearch>, results: SearchResult[]) {
  for (const book of books) {
    const titleScore = fuzzyScore(query, book.title);
    const writerScore = fuzzyScore(query, book.writer);
    const titleMatch = titleScore > 0;
    const writerMatch = writerScore > 0;

    for (const record of book.records) {
      const nameScore = fuzzyScore(query, record.name);
      const descScore = fuzzyScore(query, record.description);
      const nameMatch = nameScore > 0;
      const descMatch = descScore > 0;

      if (!nameMatch && !descMatch && !titleMatch && !writerMatch) continue;

      const matchInfo: MatchInfo[] = [];
      let score = 0;

      if (nameMatch) { matchInfo.push({ type: "karakter", field: "név" }); score = Math.max(score, nameScore); }
      if (descMatch) { matchInfo.push({ type: "leírás" }); score = Math.max(score, descScore); }
      if (titleMatch) { matchInfo.push({ type: "mű", field: book.title }); score = Math.max(score, titleScore); }
      if (writerMatch) { matchInfo.push({ type: "szerző", field: book.writer }); score = Math.max(score, writerScore); }

      results.push({
        source: "characters",
        score,
        title: record.name,
        subtitle: `${book.writer} – ${book.title}`,
        description: record.description,
        matchInfo,
      });
    }
  }
}

function searchMemoriterek(query: string, memoriterek: Memoriter[], results: SearchResult[]) {
  for (const memo of memoriterek) {
    const szerzoScore = fuzzyScore(query, memo["Szerző"]);
    const cimScore = fuzzyScore(query, memo["cím"]);
    const datumScore = fuzzyScore(query, memo["keletkezési dátum"]);
    const verselesScore = fuzzyScore(query, memo["verseles"]);
    const mufajScore = fuzzyScore(query, memo["műfaj"]);
    const szovegScore = fuzzyScore(query, memo["mű szövege"]);

    const matchInfo: MatchInfo[] = [];
    let score = 0;

    if (szerzoScore > 0) { matchInfo.push({ type: "szerző", field: memo["Szerző"] }); score = Math.max(score, szerzoScore); }
    if (cimScore > 0) { matchInfo.push({ type: "cím", field: memo["cím"] }); score = Math.max(score, cimScore); }
    if (datumScore > 0) { matchInfo.push({ type: "dátum", field: memo["keletkezési dátum"] }); score = Math.max(score, datumScore); }
    if (verselesScore > 0) { matchInfo.push({ type: "verselés", field: memo["verseles"] }); score = Math.max(score, verselesScore); }
    if (mufajScore > 0) { matchInfo.push({ type: "műfaj", field: memo["műfaj"] }); score = Math.max(score, mufajScore); }
    if (szovegScore > 0) { matchInfo.push({ type: "szöveg" }); score = Math.max(score, szovegScore); }

    if (matchInfo.length > 0) {
      results.push({
        source: "memoriterek",
        score,
        title: `${memo["Szerző"]} – ${memo["cím"]}`,
        subtitle: memo["keletkezési dátum"],
        description: memo["mű szövege"].substring(0, 200) + "...",
        matchInfo,
      });
    }
  }
}

function searchGonosz(query: string, records: GonoszRecord[], results: SearchResult[]) {
  for (const record of records) {
    const eraScore = fuzzyScore(query, record.era);
    const categoryScore = fuzzyScore(query, record.category);
    const szerzoScore = fuzzyScore(query, record.szerzo);
    const cimScore = fuzzyScore(query, record.cim);
    const mufajScore = fuzzyScore(query, record.mufaj);
    const szazadScore = fuzzyScore(query, record.szazad);
    const stilusScore = fuzzyScore(query, record.stilus);

    const matchInfo: MatchInfo[] = [];
    let score = 0;

    if (eraScore > 0) { matchInfo.push({ type: "korszak", field: record.era }); score = Math.max(score, eraScore); }
    if (categoryScore > 0) { matchInfo.push({ type: "kategória", field: record.category }); score = Math.max(score, categoryScore); }
    if (szerzoScore > 0) { matchInfo.push({ type: "szerző", field: record.szerzo }); score = Math.max(score, szerzoScore); }
    if (cimScore > 0) { matchInfo.push({ type: "cím", field: record.cim }); score = Math.max(score, cimScore); }
    if (mufajScore > 0) { matchInfo.push({ type: "műfaj", field: record.mufaj }); score = Math.max(score, mufajScore); }
    if (szazadScore > 0) { matchInfo.push({ type: "század", field: record.szazad }); score = Math.max(score, szazadScore); }
    if (stilusScore > 0) { matchInfo.push({ type: "stílus", field: record.stilus }); score = Math.max(score, stilusScore); }

    if (matchInfo.length > 0) {
      results.push({
        source: "gonosz",
        score,
        title: `${record.szerzo} – ${record.cim}`,
        subtitle: `${record.era} • ${record.category}`,
        matchInfo,
      });
    }
  }
}
