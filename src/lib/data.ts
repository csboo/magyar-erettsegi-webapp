import type {
  BookCharacter,
  BookGroup,
  CharacterRecord,
  SearchBookGroup,
  WriterGroup,
} from "../types";

function byHungarian(a: string, b: string): number {
  return a.localeCompare(b, "hu");
}

export function groupByBooks(records: CharacterRecord[]): BookGroup[] {
  const grouped = new Map<string, { writer: string; characters: BookCharacter[] }>();

  for (const record of records) {
    const title = record.title || "Ismeretlen mű";
    if (!grouped.has(title)) {
      grouped.set(title, { writer: record.writer || "Ismeretlen szerző", characters: [] });
    }
    grouped.get(title)?.characters.push({
      name: record.name || "Ismeretlen karakter",
      description: record.description || "",
    });
  }

  return Array.from(grouped.entries())
    .map(([title, value]) => ({
      title,
      writer: value.writer,
      characters: value.characters,
    }))
    .sort((a, b) => byHungarian(a.title, b.title));
}

export function groupForSearch(records: CharacterRecord[]): SearchBookGroup[] {
  const grouped = new Map<string, SearchBookGroup>();
  for (const record of records) {
    const title = record.title || "Ismeretlen mű";
    if (!grouped.has(title)) {
      grouped.set(title, {
        title,
        writer: record.writer || "Ismeretlen szerző",
        records: [],
      });
    }
    grouped.get(title)?.records.push(record);
  }

  return Array.from(grouped.values()).sort((a, b) => byHungarian(a.title, b.title));
}

export function groupByWriters(records: CharacterRecord[]): WriterGroup[] {
  const grouped = new Map<string, Map<string, BookCharacter[]>>();

  for (const record of records) {
    const writer = record.writer || "Ismeretlen szerző";
    const title = record.title || "Ismeretlen mű";

    if (!grouped.has(writer)) {
      grouped.set(writer, new Map());
    }

    const books = grouped.get(writer);
    if (books && !books.has(title)) {
      books.set(title, []);
    }
    books?.get(title)?.push({
      name: record.name || "Ismeretlen karakter",
      description: record.description || "",
    });
  }

  return Array.from(grouped.entries())
    .map(([writer, books]) => ({
      writer,
      books: Array.from(books.entries())
        .map(([title, characters]) => ({
          title,
          writer,
          characters,
        }))
        .sort((a, b) => byHungarian(a.title, b.title)),
    }))
    .sort((a, b) => byHungarian(a.writer, b.writer));
}
