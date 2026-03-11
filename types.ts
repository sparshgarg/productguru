export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  streak: number;
  lastPracticeDate: string | null; // ISO string
  averageScore: number;
  sessionsCompleted: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  streak: number;
  averageScore: number;
  rank: number;
}

export interface PromptData {
  question: string;
  context: string;
  proTip: string;
}

export interface UserResponse {
  answer: string;
}

export interface EvaluationScores {
  strategicThinking: number;
  creativity: number;
  clarity: number;
  analyticalThinking: number;
  customerEmpathy: number;
  overall: number;
}

export interface SampleAnswer {
  level: 'AI Junior PM' | 'AI Senior PM' | 'AI World-Class PM';
  content: string;
  scores: EvaluationScores;
}

export interface EvaluationResult {
  scores: EvaluationScores;
  feedback: string; // Brief qualitative feedback
  sampleAnswers: SampleAnswer[];
  shareMessage: string;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  date: string;
  question: string;
  context: string;
  answer: string;
  scores: EvaluationScores;
  feedback: string;
  sampleAnswers?: SampleAnswer[];
}
