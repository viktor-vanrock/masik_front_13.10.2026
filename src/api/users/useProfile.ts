// useProfile — текущий пользователь (GET /users/profile), он же session-probe.
// Retry: 401/403 не ретраим (identity), 5xx/network — 1 раз (транзиентный blip).

import { useQuery } from "@tanstack/react-query";
import type { User } from "@/types";
import { ApiException } from "@/services/http";
import { getProfile } from "./usersApi";
import { USERS_QUERY_KEYS } from "./queryKeys";

interface Options {
  enabled?: boolean;
}

export function useProfile({ enabled = true }: Options = {}) {
  return useQuery<User>({
    queryKey: USERS_QUERY_KEYS.profile,
    queryFn: getProfile,
    enabled,
    staleTime: 5 * 60_000,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiException &&
        (error.status === 401 || error.status === 403)
      ) {
        return false;
      }
      return failureCount < 1; // 1 ретрай для 5xx / NetworkError
    },
  });
}
