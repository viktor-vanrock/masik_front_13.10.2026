export const Pluralord = (
  n: number,
  words: [string, string, string]
): string => {
  const absN = Math.abs(n);
  const lastDigit = absN % 10;
  const lastTwoDigits = absN % 100;
  
  const [one, few, many] = words;

  if (lastDigit === 1 && lastTwoDigits !== 11) return one;
  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) return few;
  return many;
}