import { useEffect, useState } from "react";
import type { CharacterRecord } from "../types";

type CharactersState = {
  records: CharacterRecord[];
  loading: boolean;
  error: string | null;
};

let recordsCache: CharacterRecord[] | null = null;
let recordsPromise: Promise<CharacterRecord[]> | null = null;

function sanitizeRecord(input: unknown): CharacterRecord {
  if (typeof input !== "object" || input === null) {
    return { title: "", writer: "", name: "", description: "" };
  }

  const record = input as Record<string, unknown>;
  return {
    title: typeof record.title === "string" ? record.title : "",
    writer: typeof record.writer === "string" ? record.writer : "",
    name: typeof record.name === "string" ? record.name : "",
    description: typeof record.description === "string" ? record.description : "",
  };
}

async function loadCharacters(): Promise<CharacterRecord[]> {
  if (recordsCache) {
    return recordsCache;
  }

  if (!recordsPromise) {
    recordsPromise = fetch("/characters.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid data shape");
        }
        const parsed = data.map(sanitizeRecord);
        recordsCache = parsed;
        return parsed;
      });
  }

  return recordsPromise;
}

export function useCharacters(): CharactersState {
  const [state, setState] = useState<CharactersState>({
    records: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    loadCharacters()
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
            "Nem sikerült betölteni a characters.json fájlt. Indíts helyi webszervert, és onnan nyisd meg az oldalt.",
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
