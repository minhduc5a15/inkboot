export type Scene = {
  id: string;
  title: string;
  content: string;
  wordCount: number;
};

export type Chapter = {
  id: string;
  title: string;
  scenes: Scene[];
};

export type Story = {
  id: string;
  title: string;
  chapters: Chapter[];
};

export type Character = {
  id: string;
  name: string;
  description: string;
};
