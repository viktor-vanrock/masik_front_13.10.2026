export const LEADERBOARD_BOARD_QUERY_KEYS = {
  all: ['leaderboard-boards'] as const,
  list: (authenticated: boolean, userId?: string) =>
    ['leaderboard-boards', authenticated ? userId ?? 'mine' : 'public'] as const,
};
