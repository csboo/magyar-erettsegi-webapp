import { useMemo, useRef, useState, useEffect, type CSSProperties } from "react";
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

const ERA_ORDER = [
  "okor",
  "kozepkor",
  "reneszansz",
  "barokkrokoko",
  "felvilagosodas",
  "romantika",
  "realizmus",
  "klasszikusesavantgardmodernitas",
] as const;

const DEFAULT_TABLE_FONT_SIZE = 0.9;
const MIN_TABLE_FONT_SIZE = 0.7;
const MAX_TABLE_FONT_SIZE = 1.5;
const TABLE_FONT_STEP = 0.05;

function normalizeSortText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function compareEra(a: string, b: string): number {
  const aNorm = normalizeSortText(a);
  const bNorm = normalizeSortText(b);
  const aIndex = ERA_ORDER.indexOf(aNorm as (typeof ERA_ORDER)[number]);
  const bIndex = ERA_ORDER.indexOf(bNorm as (typeof ERA_ORDER)[number]);

  if (aIndex !== -1 && bIndex !== -1 && aIndex !== bIndex) {
    return aIndex - bIndex;
  }
  if (aIndex !== -1 && bIndex === -1) {
    return -1;
  }
  if (aIndex === -1 && bIndex !== -1) {
    return 1;
  }
  return a.localeCompare(b, "hu");
}

function parseCentury(value: string): { isBce: boolean; num: number | null } {
  const bceMatch = value.match(/kr\.?\s*e\.?\s*(\d+)/i);
  if (bceMatch) {
    return { isBce: true, num: Number.parseInt(bceMatch[1], 10) };
  }

  const ceMatch = value.match(/(\d+)\s*\./);
  if (ceMatch) {
    return { isBce: false, num: Number.parseInt(ceMatch[1], 10) };
  }

  return { isBce: false, num: null };
}

function compareCentury(a: string, b: string): number {
  const aParsed = parseCentury(a);
  const bParsed = parseCentury(b);

  if (aParsed.isBce !== bParsed.isBce) {
    return aParsed.isBce ? -1 : 1;
  }

  if (aParsed.num !== null && bParsed.num !== null && aParsed.num !== bParsed.num) {
    return aParsed.num - bParsed.num;
  }

  if (aParsed.num !== null && bParsed.num === null) {
    return -1;
  }
  if (aParsed.num === null && bParsed.num !== null) {
    return 1;
  }

  return a.localeCompare(b, "hu");
}

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
  const [tableConfigOpen, setTableConfigOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = usePersistentSet<SortField>("gonoszadatok-hiddenColumns", new Set());
  const [dedupColumns, setDedupColumns] = usePersistentSet<SortField>("gonoszadatok-dedupColumns", new Set());
  const [tableFontSize, setTableFontSize] = usePersistentState<number>(
    "gonoszadatok-tableFontSize",
    DEFAULT_TABLE_FONT_SIZE,
  );

  const filterRef = useRef<HTMLDivElement>(null);
  const tableConfigRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen && !tableConfigOpen) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (filterRef.current && !filterRef.current.contains(target)) {
        setFilterOpen(false);
      }
      if (tableConfigRef.current && !tableConfigRef.current.contains(target)) {
        setTableConfigOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen, tableConfigOpen]);

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
      let cmp: number;

      if (sortField === "era") {
        cmp = compareEra(aVal, bVal);
      } else if (sortField === "szazad") {
        cmp = compareCentury(aVal, bVal);
      } else {
        cmp = aVal.localeCompare(bVal, "hu");
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });

    if (dedupColumns.size === 0) {
      return result;
    }

    const seenByField = new Map<SortField, Set<string>>();
    for (const field of dedupColumns) {
      seenByField.set(field, new Set());
    }

    return result.filter((row) => {
      for (const field of dedupColumns) {
        const value = String(row[field]);
        if (seenByField.get(field)?.has(value)) {
          return false;
        }
      }
      for (const field of dedupColumns) {
        seenByField.get(field)?.add(String(row[field]));
      }
      return true;
    });
  }, [
    records,
    filterEras,
    filterWriters,
    filterMufaj,
    filterSzazad,
    filterStilus,
    filterCategory,
    sortField,
    sortDirection,
    dedupColumns,
  ]);

  const visibleFields = useMemo(
    () => DISPLAY_FIELDS.filter((field) => !hiddenColumns.has(field.key)),
    [hiddenColumns],
  );

  const activeFilterCount = filterEras.size + filterWriters.size + filterMufaj.size + filterSzazad.size + filterStilus.size + filterCategory.size;
  const activeTableConfigCount = hiddenColumns.size + dedupColumns.size;

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

  function toggleHiddenColumn(field: SortField) {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        const currentlyVisible = DISPLAY_FIELDS.length - next.size;
        if (currentlyVisible <= 1) {
          return next;
        }
        next.add(field);
      }
      return next;
    });
  }

  function toggleDedupColumn(field: SortField) {
    setDedupColumns((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function adjustFontSize(delta: number) {
    setTableFontSize((current) => {
      const next = Number((current + delta).toFixed(2));
      return Math.max(MIN_TABLE_FONT_SIZE, Math.min(MAX_TABLE_FONT_SIZE, next));
    });
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

      <section
        className="card"
        style={
          {
            "--gonosz-table-font-size": `${tableFontSize}rem`,
          } as CSSProperties
        }
      >
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
            <div className="gonosz-filter-wrap" ref={tableConfigRef}>
              <button
                className={`gonosz-filter-btn${tableConfigOpen ? " open" : ""}`}
                onClick={() => setTableConfigOpen(!tableConfigOpen)}
              >
                Táblázat beállítások
                {activeTableConfigCount > 0 ? (
                  <span className="gonosz-filter-badge">{activeTableConfigCount}</span>
                ) : null}
              </button>
              {tableConfigOpen ? (
                <div className="gonosz-filter-panel gonosz-table-config-panel">
                  <div className="gonosz-table-config-group">
                    <h3>Oszlopok elrejtése</h3>
                    {DISPLAY_FIELDS.map((field) => {
                      const isHidden = hiddenColumns.has(field.key);
                      const visibleCount = DISPLAY_FIELDS.length - hiddenColumns.size;
                      const disableHide = !isHidden && visibleCount <= 1;
                      return (
                        <label key={`hide-${field.key}`} className="filter-option">
                          <input
                            type="checkbox"
                            checked={isHidden}
                            disabled={disableHide}
                            onChange={() => toggleHiddenColumn(field.key)}
                          />
                          <span>{field.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="gonosz-table-config-group">
                    <h3>Duplikáció szűrése oszlop szerint</h3>
                    {DISPLAY_FIELDS.map((field) => (
                      <label key={`dedup-${field.key}`} className="filter-option">
                        <input
                          type="checkbox"
                          checked={dedupColumns.has(field.key)}
                          onChange={() => toggleDedupColumn(field.key)}
                        />
                        <span>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="gonosz-font-controls" aria-label="Betűméret beállítás">
              <button
                type="button"
                className="archive-control-btn"
                onClick={() => adjustFontSize(-TABLE_FONT_STEP)}
                disabled={tableFontSize <= MIN_TABLE_FONT_SIZE}
              >
                A-
              </button>
              <span className="gonosz-font-size-label">{Math.round(tableFontSize * 100)}%</span>
              <button
                type="button"
                className="archive-control-btn"
                onClick={() => adjustFontSize(TABLE_FONT_STEP)}
                disabled={tableFontSize >= MAX_TABLE_FONT_SIZE}
              >
                A+
              </button>
              <button
                type="button"
                className="archive-control-btn"
                onClick={() => setTableFontSize(DEFAULT_TABLE_FONT_SIZE)}
                disabled={tableFontSize === DEFAULT_TABLE_FONT_SIZE}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="gonosz-table-wrap">
          <table className="gonosz-table">
            <thead>
              <tr>
                {visibleFields.map((field) => (
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
                  {visibleFields.map((field) => (
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
