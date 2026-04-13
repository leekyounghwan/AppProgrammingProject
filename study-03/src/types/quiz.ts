export interface Question {
  id: number;
  category: 'popsong' | 'worldmap' | 'movie' | 'general';
  question: string;
  options: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation?: string;
}

export interface ScoreRecord {
  nickname: string;
  category: Question['category'];
  score: number;
  total: number;
  date: string; // ISO string
}
