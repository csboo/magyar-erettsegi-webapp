export type Theme = "light" | "dark";

export type CharacterRecord = {
  title: string;
  writer: string;
  name: string;
  description: string;
};

export type BookCharacter = {
  name: string;
  description: string;
};

export type BookGroup = {
  title: string;
  writer: string;
  characters: BookCharacter[];
};

export type SearchBookGroup = {
  title: string;
  writer: string;
  records: CharacterRecord[];
};

export type WriterGroup = {
  writer: string;
  books: BookGroup[];
};
