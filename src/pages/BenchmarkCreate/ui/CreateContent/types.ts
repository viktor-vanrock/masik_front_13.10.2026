export type DerivedMode = 'modify' | 'russify';
export type MockExample = { input: string; expectedOutput: string; accepted: boolean };
export type MockReadySet = { name: string; examples: Array<{ input: string; expectedOutput: string }>; sourceId: string | null };