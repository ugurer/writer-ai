export type User = {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  type: 'novel' | 'story' | 'article';
  genre: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  coverImage?: string;
  isPublic: boolean;
  status: 'draft' | 'inProgress' | 'completed';
  wordCount: number;
  chapters: Chapter[];
  characters: Character[];
  plotPoints: PlotPoint[];
};

export type Chapter = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  status: 'draft' | 'inProgress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  lastEditedBy: string;
};

export type Character = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  role: 'protagonist' | 'antagonist' | 'supporting';
  traits: string[];
  background: string;
  goals: string[];
  relationships: CharacterRelationship[];
  createdAt: Date;
  updatedAt: Date;
};

export type CharacterRelationship = {
  characterId: string;
  relatedCharacterId: string;
  type: 'friend' | 'enemy' | 'family' | 'romantic' | 'other';
  description: string;
};

export type PlotPoint = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'event' | 'revelation' | 'decision' | 'conflict';
  chapterId?: string;
  involvedCharacters: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AIPrompt = {
  id: string;
  projectId: string;
  chapterId?: string;
  type: 'character' | 'plot' | 'setting' | 'dialogue';
  prompt: string;
  response: string;
  createdAt: Date;
  usedTokens: number;
};

export type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  type: 'novel' | 'story' | 'article';
  structure: {
    chapterCount: number;
    suggestedWordCount: number;
    outline: string[];
  };
  suggestedCharacterRoles: string[];
  plotPoints: {
    title: string;
    description: string;
    type: PlotPoint['type'];
  }[];
}; 