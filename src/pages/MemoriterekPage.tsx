import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { FontSizeControls } from "../components/FontSizeControls";
import type { Memoriter } from "../types";
import { usePersistentState, usePersistentSet } from "../hooks/usePersistentState";

type GroupBy = "none" | "era" | "writer" | "genre";

function getFirstLetterText(text: string): string {
  return text.split('\n').map(line =>
    line.split(' ').map(word => word.length > 0 ? word[0] + '...' : '').join(' ')
  ).join('\n');
}

export function MemoriterekPage() {
  const [memoriterek, setMemoriterek] = useState<Memoriter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItemsArray, setOpenItemsArray] = usePersistentState<number[]>("memoriterek-openItems", []);
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set(openItemsArray));
  const [groupBy, setGroupBy] = usePersistentState<GroupBy>("memoriterek-groupBy", "none");
  const [firstLetterMode, setFirstLetterMode] = usePersistentState<boolean>("memoriterek-firstLetterMode", false);
  const [learnedItems, setLearnedItems] = usePersistentSet<number>("memoriterek-learned", new Set());
  const [hideLearned, setHideLearned] = usePersistentState<boolean>("memoriterek-hideLearned", false);
  const [fontScale, setFontScale] = usePersistentState<number>("memoriterek-fontScale", 1);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterEras, setFilterEras] = usePersistentSet<string>("memoriterek-filterEras", new Set());
  const [filterWriters, setFilterWriters] = usePersistentSet<string>("memoriterek-filterWriters", new Set());
  const [filterPoems, setFilterPoems] = usePersistentSet<string>("memoriterek-filterPoems", new Set());

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
    const visible = new Set<number>();
    memoriterek.forEach((m, i) => {
      if (hideLearned && learnedItems.has(i)) return;
      if (!hasFilters) {
        visible.add(i);
        return;
      }
      const eraMatch = filterEras.has(m["keletkezési dátum"]);
      const writerMatch = filterWriters.has(m["Szerző"]);
      const poemMatch = filterPoems.has(`${m["Szerző"]} – ${m["cím"]}`);
      if (eraMatch || writerMatch || poemMatch) {
        visible.add(i);
      }
    });
    return visible;
  }, [memoriterek, filterEras, filterWriters, filterPoems, learnedItems, hideLearned]);

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
      setOpenItemsArray(Array.from(next));
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

  const toggleLearnedItem = (index: number) => {
    setLearnedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
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
              <FontSizeControls value={fontScale} onChange={setFontScale} />
              <button
                type="button"
                className={`archive-control-btn${firstLetterMode ? " active" : ""}`}
                onClick={() => setFirstLetterMode(!firstLetterMode)}
              >
                {firstLetterMode ? "Normál mód" : "Csak első betű"}
              </button>
              <button
                type="button"
                className={`archive-control-btn${hideLearned ? " active" : ""}`}
                onClick={() => setHideLearned(!hideLearned)}
              >
                {hideLearned ? "Megtanultak mutatása" : "Megtanultak elrejtése"}
              </button>
              <button
                type="button"
                className="archive-control-btn"
                onClick={() => {
                  const next = new Set<number>();
                  for (const i of memoriterek.keys()) {
                    if (visibleIndexes.has(i)) next.add(i);
                  }
                  setOpenItems(next);
                  setOpenItemsArray(Array.from(next));
                }}
                disabled={allOpen}
              >
                Összes lenyitása
              </button>
              <button
                type="button"
                className="archive-control-btn"
                onClick={() => {
                  setOpenItems(new Set());
                  setOpenItemsArray([]);
                }}
              >
                Összes bezárása
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section
        className="card memoriterek-card font-scale-target"
        aria-live="polite"
        style={{ "--content-font-scale": fontScale } as CSSProperties}
      >
        {loading ? <p className="status">Betöltés...</p> : null}
        {error ? <p className="status">{error}</p> : null}
        {!loading && !error && memoriterek.length === 0 ? <p className="status">Nincs találat.</p> : null}
        {!loading && !error && memoriterek.length > 0 ? (
          groupedData.type === "none" ? (
            <div className="memoriter-list">
              {groupedData.items.map(({ memo, index }) => (
                <MemoriterCard key={index} memo={memo} index={index} isOpen={openItems.has(index)} onToggle={togglePoemOpen} firstLetterMode={firstLetterMode} learned={learnedItems.has(index)} onToggleLearned={toggleLearnedItem} />
              ))}
            </div>
          ) : (
            <div className="memoriter-grouped-list">
              {groupedData.groups.map((group) => (
                <section key={group.key} className="memoriter-group">
                  <h3 className="memoriter-group-header">{group.label}</h3>
                  <div className="memoriter-list">
                     {group.items.map(({ memo, index }) => (
                       <MemoriterCard key={index} memo={memo} index={index} isOpen={openItems.has(index)} onToggle={togglePoemOpen} firstLetterMode={firstLetterMode} learned={learnedItems.has(index)} onToggleLearned={toggleLearnedItem} />
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
  firstLetterMode: boolean;
  learned: boolean;
  onToggleLearned: (index: number) => void;
};

function MemoriterCard({ memo, index, isOpen, onToggle, firstLetterMode, learned, onToggleLearned }: MemoriterCardProps) {
  const displayText = firstLetterMode ? getFirstLetterText(memo["mű szövege"]) : memo["mű szövege"];
  return (
    <article className="memoriter-item">
      <div className="memoriter-meta">
        <div className="memoriter-header-row">
          <h2 className="memoriter-title">{memo["cím"]}</h2>
          <label className="memoriter-learned-toggle">
            <input
              type="checkbox"
              checked={learned}
              onChange={() => onToggleLearned(index)}
            />
            <span>Megtanultam</span>
          </label>
        </div>
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
        <pre className="memoriter-text">{displayText}</pre>
      </details>
    </article>
  );
}
