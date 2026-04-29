import { useEffect, useState } from "react";
import type { GonoszRecord } from "../types";

type GonoszRecordsState = {
  records: GonoszRecord[];
  loading: boolean;
  error: string | null;
};

let recordsCache: GonoszRecord[] | null = null;
let recordsPromise: Promise<GonoszRecord[]> | null = null;

function sanitizeRecord(input: unknown): GonoszRecord {
  if (typeof input !== "object" || input === null) {
    return {
      era: "",
      category: "",
      szerzo: "",
      cim: "",
      mufaj: "",
      szazad: "",
      stilus: "",
    };
  }

  const record = input as Record<string, unknown>;
  return {
    era: typeof record.era === "string" ? record.era : "",
    category: typeof record.category === "string" ? record.category : "",
    szerzo: typeof record.szerzo === "string" ? record.szerzo : "",
    cim: typeof record.cim === "string" ? record.cim : "",
    mufaj: typeof record.mufaj === "string" ? record.mufaj : "",
    szazad: typeof record.szazad === "string" ? record.szazad : "",
    stilus: typeof record.stilus === "string" ? record.stilus : "",
  };
}

async function loadGonoszRecords(): Promise<GonoszRecord[]> {
  if (recordsCache) {
    return recordsCache;
  }

  if (!recordsPromise) {
    recordsPromise = fetch("/gonosztext_grouped.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data: unknown) => {
        if (typeof data !== "object" || data === null) {
          throw new Error("Invalid data shape");
        }
        const obj = data as { records?: unknown };
        if (!Array.isArray(obj.records)) {
          throw new Error("Invalid records");
        }
        const parsed = obj.records.map(sanitizeRecord);
        recordsCache = parsed;
        return parsed;
      });
  }

  return recordsPromise;
}

export function useGonoszRecords(): GonoszRecordsState {
  const [state, setState] = useState<GonoszRecordsState>({
    records: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    loadGonoszRecords()
      .then((records) => {
        if (!isMounted) {
          return;
        }
        setState({
          records,
          loading: false,
          error: null,
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setState({
          records: [],
          loading: false,
          error:
            "Nem sikerült betölteni a gonosztext_grouped.json fájlt. Indíts helyi webszervert, és onnan nyisd meg az oldalt.",
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
