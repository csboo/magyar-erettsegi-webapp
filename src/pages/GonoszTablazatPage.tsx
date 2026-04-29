import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useGonoszRecords } from "../hooks/useGonoszRecords";
import { shuffle } from "../lib/random";
import type { GonoszRecord } from "../types";

type FieldKey = keyof GonoszRecord;
type IndexedRecord = GonoszRecord & { id: number };

type RoundRow = {
  record: IndexedRecord;
  revealedField: FieldKey;
};

type RoundState = {
  rows: RoundRow[];
  optionCounts: Record<FieldKey, Record<string, number>>;
  pickedIds: number[];
};

const CONFIG_FIELDS: Array<{ key: FieldKey; label: string }> = [
  { key: "era", label: "Korszak" },
  { key: "category", label: "Kategória" },
  { key: "szerzo", label: "Szerző" },
  { key: "cim", label: "Cím" },
  { key: "mufaj", label: "Műfaj" },
  { key: "szazad", label: "Század" },
  { key: "stilus", label: "Stílus" },
];
const GAME_FIELDS = CONFIG_FIELDS.filter((field) => field.key !== "category");

const UNIQUENESS_FIELDS: FieldKey[] = ["szerzo", "stilus", "szazad", "mufaj", "cim"];
const REVEALABLE_FIELDS: FieldKey[] = GAME_FIELDS.map((field) => field.key);
const ROWS_PER_ROUND = 5;

type Filters = Record<FieldKey, string[]>;

function createEmptyFilters(): Filters {
  return {
    era: [],
    category: [],
    szerzo: [],
    cim: [],
    mufaj: [],
    szazad: [],
    stilus: [],
  };
}

function createEmptyOptionCounts(): Record<FieldKey, Record<string, number>> {
  return {
    era: {},
    category: {},
    szerzo: {},
    cim: {},
    mufaj: {},
    szazad: {},
    stilus: {},
  };
}

function extractFieldOptions(records: IndexedRecord[]): Record<FieldKey, string[]> {
  const options = createEmptyFilters();
  for (const field of CONFIG_FIELDS) {
    options[field.key] = Array.from(new Set(records.map((record) => record[field.key]).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, "hu"),
    );
  }
  return options;
}

function makeOptionCounts(rows: RoundRow[]): Record<FieldKey, Record<string, number>> {
  const counts = createEmptyOptionCounts();

  for (const row of rows) {
    for (const field of GAME_FIELDS) {
      if (field.key === row.revealedField) {
        continue;
      }
      const value = row.record[field.key];
      counts[field.key][value] = (counts[field.key][value] ?? 0) + 1;
    }
  }

  return counts;
}

function isRecordCompatible(record: IndexedRecord, chosen: IndexedRecord[]): boolean {
  return UNIQUENESS_FIELDS.every((field) => chosen.every((selected) => selected[field] !== record[field]));
}

function selectUniqueRound(records: IndexedRecord[]): IndexedRecord[] | null {
  const shuffled = shuffle(records);

  function backtrack(startIndex: number, chosen: IndexedRecord[]): IndexedRecord[] | null {
    if (chosen.length === ROWS_PER_ROUND) {
      return chosen;
    }

    for (let index = startIndex; index < shuffled.length; index += 1) {
      const candidate = shuffled[index];
      if (!isRecordCompatible(candidate, chosen)) {
        continue;
      }
      const result = backtrack(index + 1, [...chosen, candidate]);
      if (result) {
        return result;
      }
    }

    return null;
  }

  return backtrack(0, []);
}

function buildRound(records: IndexedRecord[], usedIds: number[]): RoundState | null {
  const usedSet = new Set(usedIds);
  const remaining = records.filter((record) => !usedSet.has(record.id));
  if (remaining.length < ROWS_PER_ROUND) {
    return null;
  }

  const picked = selectUniqueRound(remaining);
  if (!picked) {
    return null;
  }

  const rows = picked.map((record) => ({
    record,
    revealedField: shuffle(REVEALABLE_FIELDS)[0],
  }));

  return {
    rows,
    optionCounts: makeOptionCounts(rows),
    pickedIds: picked.map((record) => record.id),
  };
}

function scoreRound(round: RoundState, answers: Record<string, string>) {
  let total = 0;
  let correct = 0;

  round.rows.forEach((row, rowIndex) => {
    GAME_FIELDS.forEach((field) => {
      if (field.key === row.revealedField) {
        return;
      }
      total += 1;
      if (answers[`${rowIndex}:${field.key}`] === row.record[field.key]) {
        correct += 1;
      }
    });
  });

  return { correct, total };
}

export function GonoszTablazatPage() {
  const { records, loading, error } = useGonoszRecords();
  const indexedRecords = useMemo(
    () => records.map((record, id) => ({ ...record, id })),
    [records],
  );
  const [filters, setFilters] = useState<Filters>(() => createEmptyFilters());
  const [sessionRecords, setSessionRecords] = useState<IndexedRecord[] | null>(null);
  const [usedIds, setUsedIds] = useState<number[]>([]);
  const [round, setRound] = useState<RoundState | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluated, setEvaluated] = useState(false);
  const [finished, setFinished] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalCells, setTotalCells] = useState(0);
  const [configError, setConfigError] = useState<string | null>(null);

  const optionsByField = useMemo(() => extractFieldOptions(indexedRecords), [indexedRecords]);

  const filteredRecords = useMemo(
    () =>
      indexedRecords.filter((record) =>
        CONFIG_FIELDS.every((field) => {
          const selected = filters[field.key];
          if (selected.length === 0) {
            return true;
          }
          return selected.includes(record[field.key]);
        }),
      ),
    [filters, indexedRecords],
  );

  const currentRoundScore = useMemo(() => {
    if (!round || !evaluated) {
      return null;
    }
    return scoreRound(round, answers);
  }, [answers, evaluated, round]);
  const remainingOptionCounts = useMemo(() => {
    if (!round) {
      return createEmptyOptionCounts();
    }

    const remaining = createEmptyOptionCounts();
    for (const field of GAME_FIELDS) {
      remaining[field.key] = { ...round.optionCounts[field.key] };
    }

    Object.entries(answers).forEach(([cellKey, value]) => {
      if (!value) {
        return;
      }
      const split = cellKey.split(":");
      if (split.length !== 2) {
        return;
      }
      const field = split[1] as FieldKey;
      const count = remaining[field][value] ?? 0;
      if (count > 0) {
        remaining[field][value] = count - 1;
      }
    });

    return remaining;
  }, [answers, round]);

  function toggleFilter(field: FieldKey, value: string) {
    setFilters((current) => {
      const selected = current[field];
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      return {
        ...current,
        [field]: next,
      };
    });
  }

  function clearFieldFilter(field: FieldKey) {
    setFilters((current) => ({
      ...current,
      [field]: [],
    }));
  }

  function startGame() {
    const firstRound = buildRound(filteredRecords, []);
    if (!firstRound) {
      setConfigError(
        "A kiválasztott szűrőkkel nem lehet 5 olyan rekordot választani, ahol szerző/cím/műfaj/század/stílus mind egyedi.",
      );
      return;
    }

    setConfigError(null);
    setSessionRecords(filteredRecords);
    setUsedIds(firstRound.pickedIds);
    setRound(firstRound);
    setAnswers({});
    setEvaluated(false);
    setFinished(false);
    setRoundIndex(1);
    setTotalCorrect(0);
    setTotalCells(0);
  }

  function evaluateRound() {
    if (!round) {
      return;
    }
    setEvaluated(true);
  }

  function goToNextRound() {
    if (!round || !sessionRecords) {
      return;
    }

    const result = scoreRound(round, answers);
    const nextUsedIds = [...usedIds];
    const roundPickedSet = new Set(round.pickedIds);
    for (const pickedId of round.pickedIds) {
      if (!nextUsedIds.includes(pickedId)) {
        nextUsedIds.push(pickedId);
      }
    }

    const nextRound = buildRound(sessionRecords, nextUsedIds);
    setTotalCorrect((value) => value + result.correct);
    setTotalCells((value) => value + result.total);

    if (!nextRound) {
      setFinished(true);
      setUsedIds(nextUsedIds);
      setRound(null);
      setAnswers({});
      setEvaluated(false);
      return;
    }

    const mergedUsed = [...nextUsedIds];
    for (const pickedId of nextRound.pickedIds) {
      if (!mergedUsed.includes(pickedId) && !roundPickedSet.has(pickedId)) {
        mergedUsed.push(pickedId);
      }
    }

    setUsedIds(mergedUsed);
    setRound(nextRound);
    setAnswers({});
    setEvaluated(false);
    setRoundIndex((value) => value + 1);
  }

  function resetToConfigurator() {
    setSessionRecords(null);
    setRound(null);
    setUsedIds([]);
    setAnswers({});
    setEvaluated(false);
    setFinished(false);
    setRoundIndex(0);
    setTotalCorrect(0);
    setTotalCells(0);
    setConfigError(null);
  }

  if (loading) {
    return (
      <section className="reader">
        <header className="header">
          <h1>Gonosztáblázat</h1>
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
          <h1>Gonosztáblázat</h1>
        </header>
        <section className="card">
          <p className="status">{error}</p>
        </section>
      </section>
    );
  }

  if (!sessionRecords) {
    return (
      <section className="reader gonosz-page">
        <header className="header">
          <h1>Gonosztáblázat</h1>
          <p>Állítsd be a szűrőket, majd töltsd ki a táblázatot körönként.</p>
        </header>

        <section className="card gonosz-config">
          <p className="status gonosz-config-summary">
            Szűrés után: <strong>{filteredRecords.length}</strong> rekord
          </p>

          <div className="gonosz-filter-grid">
            {CONFIG_FIELDS.map((field) => {
              const selected = filters[field.key];
              const options = optionsByField[field.key];
              return (
                <details key={field.key} className="gonosz-filter" open={field.key === "era" || field.key === "category"}>
                  <summary>
                    {field.label}{" "}
                    <span className="gonosz-filter-count">
                      {selected.length ? `${selected.length} kiválasztva` : "összes"}
                    </span>
                  </summary>
                  <div className="gonosz-filter-actions">
                    <button
                      type="button"
                      className="archive-control-btn"
                      onClick={() => clearFieldFilter(field.key)}
                      disabled={selected.length === 0}
                    >
                      Összes
                    </button>
                  </div>
                  <div className="gonosz-filter-options">
                    {options.map((option) => (
                      <label key={option} className="gonosz-filter-option">
                        <input
                          type="checkbox"
                          checked={selected.includes(option)}
                          onChange={() => toggleFilter(field.key, option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>

          {configError ? <p className="status gonosz-config-error">{configError}</p> : null}

          <div className="game-controls">
            <button type="button" onClick={startGame}>
              Játék indítása
            </button>
            <Link to="/tasks" className="button-link">
              Vissza a feladatokhoz
            </Link>
          </div>
        </section>
      </section>
    );
  }

  if (finished) {
    const usedCount = usedIds.length;
    const totalPool = sessionRecords.length;
    return (
      <section className="reader">
        <header className="header">
          <h1>Gonosztáblázat</h1>
          <p>Vége a játéknak.</p>
        </header>

        <section className="card done-card">
          <h2>Összesítés</h2>
          <p className="score">
            {totalCorrect} / {totalCells}
          </p>
          <p className="score-detail">
            Felhasznált rekordok: {usedCount} / {totalPool}
          </p>
          <div className="game-controls">
            <button type="button" onClick={resetToConfigurator}>
              Új játék (szűrőkkel)
            </button>
            <Link to="/tasks" className="button-link">
              Vissza a feladatokhoz
            </Link>
          </div>
        </section>
      </section>
    );
  }

  if (!round) {
    return null;
  }

  return (
    <section className="reader gonosz-page">
      <header className="header">
        <h1>Gonosztáblázat</h1>
        <p>
          Kör: {roundIndex} • Felhasznált rekordok: {usedIds.length} / {sessionRecords.length}
        </p>
      </header>

      <section className="card">
        <div className="gonosz-table-wrap">
          <table className="gonosz-table">
            <thead>
              <tr>
                {GAME_FIELDS.map((field) => (
                  <th key={field.key}>{field.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {round.rows.map((row, rowIndex) => (
                <tr key={row.record.id}>
                  {GAME_FIELDS.map((field) => {
                    const key = `${rowIndex}:${field.key}`;
                    const expected = row.record[field.key];
                    const isRevealed = field.key === row.revealedField;
                    const value = answers[key] ?? "";
                    const isCorrect = evaluated && value === expected;
                    const isWrong = evaluated && !isRevealed && value !== expected;

                    return (
                      <td
                        key={field.key}
                        className={[
                          isRevealed ? "revealed" : "",
                          isCorrect ? "cell-correct" : "",
                          isWrong ? "cell-wrong" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {isRevealed ? (
                          <span>{expected}</span>
                        ) : evaluated ? (
                          <div>
                            <div>{value || "—"}</div>
                            {isWrong ? <small>Helyes: {expected}</small> : null}
                          </div>
                        ) : (
                          <select
                            value={value}
                            onChange={(event) =>
                              setAnswers((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))
                            }
                          >
                            <option value="">Válassz...</option>
                            {Object.keys(round.optionCounts[field.key])
                              .sort((a, b) => a.localeCompare(b, "hu"))
                              .filter((option) => (remainingOptionCounts[field.key][option] ?? 0) > 0 || option === value)
                              .map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                          </select>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="gonosz-options">
          <h3>Elérhető opciók</h3>
          <div className="gonosz-options-grid">
            {GAME_FIELDS.map((field) => (
              <div key={field.key} className="gonosz-option-group">
                <h4>{field.label}</h4>
                <div className="gonosz-option-chips">
                  {Object.entries(remainingOptionCounts[field.key])
                    .filter(([, count]) => count > 0)
                    .sort(([a], [b]) => a.localeCompare(b, "hu"))
                    .map(([option, count]) => (
                      <span key={`${field.key}-${option}`} className="gonosz-chip">
                        {option}
                        {count > 1 ? ` (${count})` : ""}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {evaluated && currentRoundScore ? (
          <p className="status gonosz-round-score">
            Kör eredménye: {currentRoundScore.correct} / {currentRoundScore.total}
          </p>
        ) : null}

        <div className="game-controls">
          {!evaluated ? (
            <button type="button" onClick={evaluateRound}>
              Kiértékelés
            </button>
          ) : (
            <button type="button" onClick={goToNextRound}>
              Következő kör
            </button>
          )}
          <button type="button" onClick={resetToConfigurator}>
            Vissza a konfigurátorhoz
          </button>
        </div>
      </section>
    </section>
  );
}
