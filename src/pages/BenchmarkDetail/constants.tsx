export const BASE_TABS = ['overview', 'examples', 'scores', 'references'] as const;
export const ADDITIONAL_TABS = ['subsamples'] as const;
export type BaseTab = typeof BASE_TABS[number];
export type Tab = BaseTab | 'subsamples';
