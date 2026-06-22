export interface Novel {
  id: string;
  title: string;
  description?: string | null;
  totalWords?: number;
  streak?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface Chapter {
  id: string;
  novelId: string;
  title: string;
  content?: string | null;
  order: number;
  wordCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Character {
  id: string;
  novelId: string;
  name: string;
  age?: number | null;
  appearance?: string | null;
  personality?: string | null;
  history?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorldEntity {
  id: string;
  novelId: string;
  type: string;
  name: string;
  description?: string | null;
  content?: string | null;
  tags?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Relation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
}

export interface TimelineEvent {
  id: string;
  novelId: string;
  title: string;
  content?: string | null;
  type: 'event' | 'climax' | 'twist' | 'resolution' | string;
  arc: string;
  datePoint?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChapterVersion {
  id: string;
  chapterId: string;
  content: string;
  createdAt: string;
}

export interface PlotCardType {
  id: string;
  novelId: string;
  title: string;
  description?: string | null;
  act: string;
  position: number;
  foreshadowingNotes?: string | null;
}
