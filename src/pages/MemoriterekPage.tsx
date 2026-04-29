import { useEffect, useState } from "react";
import type { Memoriter } from "../types";

export function MemoriterekPage() {
  const [memoriterek, setMemoriterek] = useState<Memoriter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

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

  const allOpen = memoriterek.length > 0 && memoriterek.every((_, i) => openItems[i]);

  return (
    <section className="memoriterek">
      <header className="header">
        <h1>Memoriterek</h1>
        <p>{memoriterek.length ? `${memoriterek.length} mű` : ""}</p>
      </header>

      {memoriterek.length > 0 ? (
        <div className="toolbar">
          <div className="archive-controls">
            <button
              type="button"
              className="archive-control-btn"
              onClick={() => {
                const next: Record<number, boolean> = {};
                for (const i of memoriterek.keys()) {
                  next[i] = true;
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
              onClick={() => setOpenItems({})}
            >
              Összes bezárása
            </button>
          </div>
        </div>
      ) : null}

      <section className="card memoriterek-card" aria-live="polite">
        {loading ? <p className="status">Betöltés...</p> : null}
        {error ? <p className="status">{error}</p> : null}
        {!loading && !error && memoriterek.length === 0 ? <p className="status">Nincs találat.</p> : null}
        {!loading && !error && memoriterek.length > 0 ? (
          <div className="memoriter-list">
            {memoriterek.map((memo, index) => (
              <article key={index} className="memoriter-item">
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
                  open={Boolean(openItems[index])}
                  onToggle={(event) => {
                    const isOpen = event.currentTarget.open;
                    setOpenItems((current) => ({ ...current, [index]: isOpen }));
                  }}
                >
                  <summary className="memoriter-dropdown-summary">Szöveg megtekintése</summary>
                  <pre className="memoriter-text">{memo["mű szövege"]}</pre>
                </details>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
