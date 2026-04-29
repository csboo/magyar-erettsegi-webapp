import { useMemo, useRef, useState, useEffect } from "react";
import { useGonoszRecords } from "../hooks/useGonoszRecords";
import { usePersistentState, usePersistentSet } from "../hooks/usePersistentState";
import type { GonoszRecord } from "../types";

type SortField = keyof GonoszRecord;
type SortDirection = "asc" | "desc";

const DISPLAY_FIELDS: Array<{ key: SortField; label: string }> = [
  { key: "era", label: "Korszak" },
  { key: "szerzo", label: "Szerző" },
  { key: "cim", label: "Cím" },
  { key: "mufaj", label: "Műfaj" },
  { key: "szazad", label: "Század" },
  { key: "stilus", label: "Stílus" },
  { key: "category", label: "Kategória" },
];

const FILTER_FIELDS: Array<{ key: SortField; label: string }> = [
  { key: "era", label: "Korszak" },
  { key: "szerzo", label: "Szerző" },
  { key: "mufaj", label: "Műfaj" },
  { key: "szazad", label: "Század" },
  { key: "stilus", label: "Stílus" },
  { key: "category", label: "Kategória" },
];

export function GonoszAdatokPage() {
  const { records, loading, error } = useGonoszRecords();
  const [sortField, setSortField] = usePersistentState<SortField>("gonoszadatok-sortField", "era");
  const [sortDirection, setSortDirection] = usePersistentState<SortDirection>("gonoszadatok-sortDirection", "asc");

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterEras, setFilterEras] = usePersistentSet<string>("gonoszadatok-filterEras", new Set());
  const [filterWriters, setFilterWriters] = usePersistentSet<string>("gonoszadatok-filterWriters", new Set());
  const [filterMufaj, setFilterMufaj] = usePersistentSet<string>("gonoszadatok-filterMufaj", new Set());
  const [filterSzazad, setFilterSzazad] = usePersistentSet<string>("gonoszadatok-filterSzazad", new Set());
  const [filterStilus, setFilterStilus] = usePersistentSet<string>("gonoszadatok-filterStilus", new Set());
  const [filterCategory, setFilterCategory] = usePersistentSet<string>("gonoszadatok-filterCategory", new Set());

  const filterRef = useRef<HTMLDivElement>(null);

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

  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    for (const field of FILTER_FIELDS) {
      options[field.key] = Array.from(new Set(records.map((r) => r[field.key]).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "hu")
      );
    }
    return options;
  }, [records]);

  const filteredAndSorted = useMemo(() => {
    const result = records.filter((r) => {
      if (filterEras.size > 0 && !filterEras.has(r.era)) return false;
      if (filterWriters.size > 0 && !filterWriters.has(r.szerzo)) return false;
      if (filterMufaj.size > 0 && !filterMufaj.has(r.mufaj)) return false;
      if (filterSzazad.size > 0 && !filterSzazad.has(r.szazad)) return false;
      if (filterStilus.size > 0 && !filterStilus.has(r.stilus)) return false;
      if (filterCategory.size > 0 && !filterCategory.has(r.category)) return false;
      return true;
    });

    result.sort((a, b) => {
      const aVal = String(a[sortField]);
      const bVal = String(b[sortField]);
      const cmp = aVal.localeCompare(bVal, "hu");
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [records, filterEras, filterWriters, filterMufaj, filterSzazad, filterStilus, filterCategory, sortField, sortDirection]);

  const activeFilterCount = filterEras.size + filterWriters.size + filterMufaj.size + filterSzazad.size + filterStilus.size + filterCategory.size;

  function toggleFilter(field: SortField, value: string) {
    const setters: Record<string, (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void> = {
      era: setFilterEras,
      szerzo: setFilterWriters,
      mufaj: setFilterMufaj,
      szazad: setFilterSzazad,
      stilus: setFilterStilus,
      category: setFilterCategory,
    };
    const setter = setters[field as string];
    if (!setter) return;
    setter((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function clearFieldFilter(field: SortField) {
    const setters: Record<string, (value: Set<string>) => void> = {
      era: setFilterEras,
      szerzo: setFilterWriters,
      mufaj: setFilterMufaj,
      szazad: setFilterSzazad,
      stilus: setFilterStilus,
      category: setFilterCategory,
    };
    const setter = setters[field as string];
    if (setter) setter(new Set());
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  if (loading) {
    return (
      <section className="gonosz-page">
        <header className="header">
          <h1>Gonosz adatok</h1>
        </header>
        <section className="card">
          <p className="status">Betöltés...</p>
        </section>
      </section>
    );
  }

  if (error) {
    return (
      <section className="gonosz-page">
        <header className="header">
          <h1>Gonosz adatok</h1>
        </header>
        <section className="card">
          <p className="status">{error}</p>
        </section>
      </section>
    );
  }

  return (
    <section className="gonosz-page">
      <header className="header">
        <h1>Gonosz adatok</h1>
        <p>{filteredAndSorted.length} / {records.length} rekord</p>
      </header>

      <section className="card">
        <div className="toolbar">
          <div className="archive-controls">
            <div className="gonosz-filter-wrap" ref={filterRef}>
              <button
                className={`gonosz-filter-btn${filterOpen ? " open" : ""}`}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                Szűrés
                {activeFilterCount > 0 ? (
                  <span className="gonosz-filter-badge">{activeFilterCount}</span>
                ) : null}
              </button>
              {filterOpen ? (
                <div className="gonosz-filter-panel">
                  <FilterSection
                    title="Korszak"
                    items={filterOptions.era || []}
                    selected={filterEras}
                    onToggle={(value) => toggleFilter("era", value)}
                    onClear={() => clearFieldFilter("era")}
                  />
                  <FilterSection
                    title="Szerző"
                    items={filterOptions.szerzo || []}
                    selected={filterWriters}
                    onToggle={(value) => toggleFilter("szerzo", value)}
                    onClear={() => clearFieldFilter("szerzo")}
                  />
                  <FilterSection
                    title="Műfaj"
                    items={filterOptions.mufaj || []}
                    selected={filterMufaj}
                    onToggle={(value) => toggleFilter("mufaj", value)}
                    onClear={() => clearFieldFilter("mufaj")}
                  />
                  <FilterSection
                    title="Század"
                    items={filterOptions.szazad || []}
                    selected={filterSzazad}
                    onToggle={(value) => toggleFilter("szazad", value)}
                    onClear={() => clearFieldFilter("szazad")}
                  />
                  <FilterSection
                    title="Stílus"
                    items={filterOptions.stilus || []}
                    selected={filterStilus}
                    onToggle={(value) => toggleFilter("stilus", value)}
                    onClear={() => clearFieldFilter("stilus")}
                  />
                  <FilterSection
                    title="Kategória"
                    items={filterOptions.category || []}
                    selected={filterCategory}
                    onToggle={(value) => toggleFilter("category", value)}
                    onClear={() => clearFieldFilter("category")}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="gonosz-table-wrap">
          <table className="gonosz-table">
            <thead>
              <tr>
                {DISPLAY_FIELDS.map((field) => (
                  <th
                    key={field.key}
                    className="sortable"
                    onClick={() => handleSort(field.key)}
                  >
                    {field.label}
                    {sortField === field.key ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((record, index) => (
                <tr key={index}>
                  {DISPLAY_FIELDS.map((field) => (
                    <td key={field.key}>{record[field.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSorted.length === 0 && (
          <p className="status">Nincs találat.</p>
        )}
      </section>
    </section>
  );
}

type FilterSectionProps = {
  title: string;
  items: string[];
  selected: Set<string>;
  onToggle: (item: string) => void;
  onClear: () => void;
};

function FilterSection({ title, items, selected, onToggle, onClear }: FilterSectionProps) {
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
              onClear();
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
