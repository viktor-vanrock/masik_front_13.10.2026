export type ChipOption = string | { value: string; label: string };

export function resolveOption(o: ChipOption): { value: string; label: string } {
  return typeof o === 'string' ? { value: o, label: o } : o;
}
