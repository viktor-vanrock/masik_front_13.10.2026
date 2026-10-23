import type { MockExample, MockReadySet } from "./types";

export function readMockExamples(content: string): MockExample[] | null {
  if (!content.startsWith('MOCK_GENERATED_EXAMPLES:')) return null;
  try {
    const rows: unknown = JSON.parse(content.slice('MOCK_GENERATED_EXAMPLES:'.length));
    if (!Array.isArray(rows)) return null;
    const examples = rows.filter((row): row is { input: string; expectedOutput: string } =>
      typeof row === 'object' && row !== null && typeof row.input === 'string' && typeof row.expectedOutput === 'string',
    );
    return examples.length ? examples.map((row) => ({ ...row, accepted: true })) : null;
  } catch {
    return null;
  }
}

export function readMockReady(content: string): MockReadySet | null {
  if (!content.startsWith('MOCK_SET_READY:')) return null;
  try {
    const value: unknown = JSON.parse(content.slice('MOCK_SET_READY:'.length));
    if (!value || typeof value !== 'object') return null;
    const ready = value as Partial<MockReadySet>;
    if (typeof ready.name !== 'string' || !Array.isArray(ready.examples)) return null;
    return { name: ready.name, examples: ready.examples.filter((row): row is { input: string; expectedOutput: string } =>
      typeof row === 'object' && row !== null && typeof row.input === 'string' && typeof row.expectedOutput === 'string'), sourceId: typeof ready.sourceId === 'string' ? ready.sourceId : null };
  } catch {
    return null;
  }
}