export const getColorByName = (name: string) => {

  const colors = ['--add-red-600'];
  const hash = name.split('').reduce((hash, char) => {
    return char.charCodeAt(0) + ((hash << 5) - hash);
  }, 0);

  const colorIndex = Math.abs(hash) % colors.length;

  return `var(${colors[colorIndex]})`;
}