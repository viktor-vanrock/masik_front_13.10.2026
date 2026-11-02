export const calculateAverage = (scores: number[]): number | null => {
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

export const calculateMaxScore = (scores: number[]): number | null => {
  return scores.length > 0 ? Math.max(...scores) : null;
};