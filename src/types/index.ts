export type Character = {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting';
  personality: string[];
  goals: string[];
  background: string;
  appearance: string;
  relationships: { [characterId: string]: CharacterRelationship };
};

export type PlotPoint = {
  id: string;
  title: string;
  description: string;
  type: 'setup' | 'conflict' | 'resolution';
  characters: string[];
  impact: string;
  order: number;
  progress: number;
};

export type WorldElement = {
  id: string;
  name: string;
  type: 'location' | 'culture' | 'magic' | 'technology' | 'history' | 'religion' | 'politics';
  details: {
    [key: string]: string | string[];
  };
  connections: string[];
  description: string;
};

export type AIResponse = {
  text: string;
  error?: string;
};

export type StyleTarget = {
  tone?: string;
  pacing?: string;
  detail?: 'minimal' | 'balanced' | 'rich';
};

export type StyleAnalysis = {
  currentStyle: {
    tone: string;
    pacing: string;
    detail: string;
  };
  suggestions: Array<{
    type: string;
    original: string;
    improved: string;
    explanation: string;
  }>;
};

export type AICommand = {
  id: string;
  icon: string;
  label: string;
  description: string;
  onPress: () => void;
};

export type CharacterRelationship = {
  characterId: string;
  type: string;
  description: string;
}; 