import { useMemo, useState } from "react";
import { useGonoszRecords } from "../hooks/useGonoszRecords";
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

export function GonoszAdatokPage() {
  const { records, loading, error } = useGonoszRecords();
  const [sortField, setSortField] = useState<SortField>("era");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterEra, setFilterEra] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const eras = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.era).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "hu"),
    );
  }, [records]);

  const filteredAndSorted = useMemo(() => {
    let result = filterEra ? records.filter((r) => r.era === filterEra) : [...records];

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = aVal.localeCompare(bVal, "hu");
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [records, filterEra, sortField, sortDirection]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function toggleRow(index: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function expandAll() {
    const all = new Set<number>();
    filteredAndSorted.forEach((_, i) => all.add(i));
    setExpandedRows(all);
  }

  function collapseAll() {
    setExpandedRows(new Set());
  }

  if (loading) {
    return (
      <section className="reader">
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
      <section className="reader">
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
    <section className="reader">
      <header className="header">
        <h1>Gonosz adatok</h1>
        <p>{filteredAndSorted.length} / {records.length} rekord</p>
      </header>

      <section className="card">
        <div className="toolbar">
          <div className="archive-controls">
            <select
              value={filterEra}
              onChange={(e) => setFilterEra(e.target.value)}
              className="archive-control-btn"
            >
              <option value="">Összes korszak</option>
              {eras.map((era) => (
                <option key={era} value={era}>
                  {era}
                </option>
              ))}
            </select>
            <button type="button" className="archive-control-btn" onClick={expandAll}>
              Összes lenyitása
            </button>
            <button type="button" className="archive-control-btn" onClick={collapseAll}>
              Összes bezárása
            </button>
          </div>
        </div>

        <div className="gonosz-table-wrap">
          <table className="gonosz-table">
            <thead>
              <tr>
                <th className="expand-col" />
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
                <>
                  <tr key={index}>
                    <td className="expand-col">
                      <button
                        type="button"
                        className="expand-btn"
                        onClick={() => toggleRow(index)}
                      >
                        {expandedRows.has(index) ? "▼" : "▶"}
                      </button>
                    </td>
                    {DISPLAY_FIELDS.map((field) => (
                      <td key={field.key}>{record[field.key]}</td>
                    ))}
                  </tr>
                  {expandedRows.has(index) && (
                    <tr key={`detail-${index}`} className="detail-row">
                      <td />
                      <td colSpan={DISPLAY_FIELDS.length}>
                        <div className="gonosz-detail">
                          {DISPLAY_FIELDS.map((field) => (
                            <p key={field.key}>
                              <strong>{field.label}:</strong> {record[field.key]}
                            </p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
