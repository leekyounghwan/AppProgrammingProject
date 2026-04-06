import type { Question } from '../types/quiz';

const CATEGORY_LABELS: Record<Question['category'], string> = {
  popsong: '팝송',
  worldmap: '세계지도',
  movie: '외국영화',
  general: '일반상식',
};

export const getCategoryLabel = (category: string): string =>
  CATEGORY_LABELS[category as Question['category']] ?? category;
