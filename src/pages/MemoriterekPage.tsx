import { useEffect, useMemo, useRef, useState } from "react";
import type { Memoriter } from "../types";

type GroupBy = "none" | "era" | "writer" | "genre";

export function MemoriterekPage() {
  const [memoriterek, setMemoriterek] = useState<Memoriter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterEras, setFilterEras] = useState<Set<string>>(new Set());
  const [filterWriters, setFilterWriters] = useState<Set<string>>(new Set());
  const [filterPoems, setFilterPoems] = useState<Set<string>>(new Set());

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/memoriterek.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Nem sikerült betölteni a memoriterek.json fájlt.");
        }
        return res.json();
      })
      .then((data: Memoriter[]) => {
        setMemoriterek(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Ismeretlen hiba történt.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    function handler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  const eras = useMemo(() => {
    const set = new Set(memoriterek.map((m) => m["keletkezési dátum"]));
    return [...set].sort((a, b) => a.localeCompare(b, "hu"));
  }, [memoriterek]);

  const writers = useMemo(() => {
    const set = new Set(memoriterek.map((m) => m["Szerző"]));
    return [...set].sort((a, b) => a.localeCompare(b, "hu"));
  }, [memoriterek]);

  const allOpen = memoriterek.length > 0 && openItems.size === memoriterek.length;

  const visibleIndexes = useMemo(() => {
    const hasFilters = filterEras.size > 0 || filterWriters.size > 0 || filterPoems.size > 0;
    if (!hasFilters) return new Set(memoriterek.map((_, i) => i));
    const visible = new Set<number>();
    memoriterek.forEach((m, i) => {
      const eraMatch = filterEras.has(m["keletkezési dátum"]);
      const writerMatch = filterWriters.has(m["Szerző"]);
      const poemMatch = filterPoems.has(`${m["Szerző"]} – ${m["cím"]}`);
      if (eraMatch || writerMatch || poemMatch) {
        visible.add(i);
      }
    });
    return visible;
  }, [memoriterek, filterEras, filterWriters, filterPoems]);

  const activeFilterCount = filterEras.size + filterWriters.size + filterPoems.size;

  const groupedData = useMemo(() => {
    const items = memoriterek
      .map((m, i) => ({ memo: m, index: i }))
      .filter(({ index }) => visibleIndexes.has(index));

    if (groupBy === "none") return { type: "none" as const, items };

    const keyFn = groupBy === "era"
      ? (m: Memoriter) => m["keletkezési dátum"]
      : groupBy === "writer"
        ? (m: Memoriter) => m["Szerző"]
        : (m: Memoriter) => m["műfaj"];

    const labelFn = groupBy === "era"
      ? (k: string) => `Korszak: ${k}`
      : groupBy === "writer"
        ? (k: string) => `Szerző: ${k}`
        : (k: string) => `Műfaj: ${k}`;

    const map = new Map<string, typeof items>();
    for (const entry of items) {
      const key = keyFn(entry.memo);
      const arr = map.get(key);
      if (arr) arr.push(entry);
      else map.set(key, [entry]);
    }

    const groups = [...map.entries()]
      .map(([key, items]) => ({ key, label: labelFn(key), items }))
      .sort((a, b) => a.label.localeCompare(b.label, "hu"));

    return { type: "grouped" as const, groups };
  }, [memoriterek, visibleIndexes, groupBy]);

  const togglePoemOpen = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleFilterEra = (era: string) => {
    setFilterEras((prev) => {
      const next = new Set(prev);
      if (next.has(era)) next.delete(era);
      else next.add(era);
      return next;
    });
  };

  const toggleFilterWriter = (writer: string) => {
    setFilterWriters((prev) => {
      const next = new Set(prev);
      if (next.has(writer)) next.delete(writer);
      else next.add(writer);
      return next;
    });
  };

  const toggleFilterPoem = (label: string) => {
    setFilterPoems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const visibleCount = visibleIndexes.size;

  return (
    <section className="memoriterek">
      <header className="header">
        <h1>Memoriterek</h1>
        <p>{visibleCount !== memoriterek.length ? `${visibleCount} / ${memoriterek.length} mű` : memoriterek.length ? `${memoriterek.length} mű` : ""}</p>
      </header>

      {memoriterek.length > 0 ? (
        <div className="memoriterek-controls">
          <div className="memoriterek-groupby">
            <span className="memoriterek-groupby-label">Csoportosítás:</span>
            <button
              className={`memoriterek-groupby-btn${groupBy === "none" ? " active" : ""}`}
              onClick={() => setGroupBy("none")}
            >
              Nincs
            </button>
            <button
              className={`memoriterek-groupby-btn${groupBy === "era" ? " active" : ""}`}
              onClick={() => setGroupBy("era")}
            >
              Korszak
            </button>
            <button
              className={`memoriterek-groupby-btn${groupBy === "writer" ? " active" : ""}`}
              onClick={() => setGroupBy("writer")}
            >
              Szerző
            </button>
            <button
              className={`memoriterek-groupby-btn${groupBy === "genre" ? " active" : ""}`}
              onClick={() => setGroupBy("genre")}
            >
              Műfaj
            </button>
          </div>

          <div className="memoriterek-actions">
            <div className="memoriterek-filter-wrap" ref={filterRef}>
              <button
                className={`memoriterek-filter-btn${filterOpen ? " open" : ""}`}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                Szűrés
                {activeFilterCount > 0 ? (
                  <span className="memoriterek-filter-badge">{activeFilterCount}</span>
                ) : null}
              </button>
              {filterOpen ? (
                <div className="memoriterek-filter-panel">
                  <FilterSection
                    title="Korszak"
                    items={eras}
                    selected={filterEras}
                    onToggle={toggleFilterEra}
                  />
                  <FilterSection
                    title="Szerző"
                    items={writers}
                    selected={filterWriters}
                    onToggle={toggleFilterWriter}
                  />
                  <FilterSection
                    title="Művek"
                    items={memoriterek.map((m) => `${m["Szerző"]} – ${m["cím"]}`)}
                    selected={filterPoems}
                    onToggle={toggleFilterPoem}
                  />
                </div>
              ) : null}
            </div>

            <div className="archive-controls">
              <button
                type="button"
                className="archive-control-btn"
                onClick={() => {
                  const next = new Set<number>();
                  for (const i of memoriterek.keys()) {
                    if (visibleIndexes.has(i)) next.add(i);
                  }
                  setOpenItems(next);
                }}
                disabled={allOpen}
              >
                Összes lenyitása
              </button>
              <button
                type="button"
                className="archive-control-btn"
                onClick={() => setOpenItems(new Set())}
              >
                Összes bezárása
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="card memoriterek-card" aria-live="polite">
        {loading ? <p className="status">Betöltés...</p> : null}
        {error ? <p className="status">{error}</p> : null}
        {!loading && !error && memoriterek.length === 0 ? <p className="status">Nincs találat.</p> : null}
        {!loading && !error && memoriterek.length > 0 ? (
          groupedData.type === "none" ? (
            <div className="memoriter-list">
              {groupedData.items.map(({ memo, index }) => (
                <MemoriterCard key={index} memo={memo} index={index} isOpen={openItems.has(index)} onToggle={togglePoemOpen} />
              ))}
            </div>
          ) : (
            <div className="memoriter-grouped-list">
              {groupedData.groups.map((group) => (
                <section key={group.key} className="memoriter-group">
                  <h3 className="memoriter-group-header">{group.label}</h3>
                  <div className="memoriter-list">
                    {group.items.map(({ memo, index }) => (
                      <MemoriterCard key={index} memo={memo} index={index} isOpen={openItems.has(index)} onToggle={togglePoemOpen} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : null}
      </section>
    </section>
  );
}

type FilterSectionProps = {
  title: string;
  items: string[];
  selected: Set<string>;
  onToggle: (item: string) => void;
};

function FilterSection({ title, items, selected, onToggle }: FilterSectionProps) {
  const [open, setOpen] = useState(false);
  const allSelected = items.length > 0 && items.every((i) => selected.has(i));

  return (
    <details className="filter-section" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="filter-section-summary">
        <span className="filter-section-title">{title}</span>
        <span className="filter-section-count">{selected.size}/{items.length}</span>
      </summary>
      <div className="filter-section-options">
        <button
          className="filter-select-all-btn"
          onClick={() => {
            if (allSelected) {
              items.forEach((i) => onToggle(i));
            } else {
              items.forEach((i) => {
                if (!selected.has(i)) onToggle(i);
              });
            }
          }}
        >
          {allSelected ? "Egyik sem" : "Összes kijelölése"}
        </button>
        {items.map((item) => (
          <label key={item} className="filter-option">
            <input
              type="checkbox"
              checked={selected.has(item)}
              onChange={() => onToggle(item)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

type MemoriterCardProps = {
  memo: Memoriter;
  index: number;
  isOpen: boolean;
  onToggle: (index: number) => void;
};

function MemoriterCard({ memo, index, isOpen, onToggle }: MemoriterCardProps) {
  return (
    <article className="memoriter-item">
      <div className="memoriter-meta">
        <h2 className="memoriter-title">{memo["cím"]}</h2>
        <p className="memoriter-author">{memo["Szerző"]}</p>
        {memo["keletkezési dátum"] !== "N/A" ? (
          <p className="memoriter-date">{memo["keletkezési dátum"]}</p>
        ) : null}
        <p className="memoriter-form">
          {memo["verseles"]} · {memo["műfaj"]}
        </p>
      </div>
      <details
        className="memoriter-dropdown"
        open={isOpen}
      >
        <summary
          className="memoriter-dropdown-summary"
          onClick={(e) => {
            e.preventDefault();
            onToggle(index);
          }}
        >
          Szöveg megtekintése
        </summary>
        <pre className="memoriter-text">{memo["mű szövege"]}</pre>
      </details>
    </article>
  );
}
