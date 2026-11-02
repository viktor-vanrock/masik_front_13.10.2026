// Auth-состояние выводится из GET /api/users/profile. Токен фронт не трогает —
// cookie ставит и снимает бэкенд.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  broadcastAbortPendingLogout,
  broadcastAuthSessionChanged,
  clearAuthScopedStorage,
  clearLocalLogout,
  hasLocalLogoutBarrier,
  markLocalLogout,
  onUnauthorized,
  readAuthSessionRevision,
  rotateAuthSessionRevision,
  subscribeAbortPendingLogout,
  subscribeAuthSessionChange,
} from '@/services/auth';
import { USERS_QUERY_KEYS, useProfile, getProfile } from '@/api/users';
import { CATALOG_QUERY_KEYS } from '@/api/catalog/queryKeys';
import { SETTINGS_QUERY_KEYS } from '@/api/settings/queryKeys';
import { METRICS_QUERY_KEYS } from '@/api/metrics/queryKeys';
import { useLoginMutation, useRegisterMutation, useLogoutMutation } from '@/api/auth';
import { ApiException } from '@/services/http';
import { canAccess as canAccessByPath } from '@/routes/access';
import { ROUTES } from '@/routes/routes.constants';
import { postAuthRedirect } from '@/routes/postAuthRedirect';
import type { LoginDto, RegisterDto } from '@/types';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';

// Only these endpoint families are public. Other queries (including future keys)
// belong to the session and must not survive an identity boundary. Removing an
// observed public query would strand its observer while /profile resolves to 401.
const publicQueryPrefixes: readonly (readonly unknown[])[] = [
  CATALOG_QUERY_KEYS.lists(),
  CATALOG_QUERY_KEYS.details(),
  CATALOG_QUERY_KEYS.groups(),
  CATALOG_QUERY_KEYS.filterOptions(),
  CATALOG_QUERY_KEYS.suiteLists(),
  CATALOG_QUERY_KEYS.suiteDetails(),
  CATALOG_QUERY_KEYS.suiteOptions(),
  SETTINGS_QUERY_KEYS.aggregate(),
  METRICS_QUERY_KEYS.models(),
  METRICS_QUERY_KEYS.results(),
];

function isPublicQuery(queryKey: readonly unknown[]): boolean {
  return publicQueryPrefixes.some((prefix) =>
    prefix.every((part, index) => queryKey[index] === part),
  );
}

function purgePrivateQueries(queryClient: QueryClient, includeProfile = false): void {
  const privateQueries = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      !isPublicQuery(query.queryKey) &&
      (includeProfile || query.queryKey[0] !== USERS_QUERY_KEYS.profile[0]),
  };
  void queryClient.cancelQueries(privateQueries);
  queryClient.removeQueries(privateQueries);
}

function purgeUserScopedState(queryClient: QueryClient): void {
  clearAuthScopedStorage();
  purgePrivateQueries(queryClient);
}

function hardResetSession(queryClient: QueryClient): void {
  clearAuthScopedStorage();
  purgePrivateQueries(queryClient);
  queryClient.resetQueries({
    queryKey: USERS_QUERY_KEYS.profile,
    exact: true,
  });
}

// Локальное завершение сессии (own-tab и cross-tab логаут): отменяет летящие запросы
// сессии (в т.ч. profile), без рефетча — барьер держит status в anonymous.
// Публичные запросы остаются привязаны к наблюдателям открытой страницы.
function applyLocalLogout(queryClient: QueryClient): void {
  clearAuthScopedStorage();
  purgePrivateQueries(queryClient, true);
  queryClient.getMutationCache().clear();
}

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Подписки монтируются один раз, поэтому свежий location читаем через ref.
  const locationRef = useRef<Location>(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Local logout barrier: переживает reload (читается синхронно при маунте) и общий для
  // вкладок. Пока стоит — profile вообще не запрашивается (см. useProfile ниже), не только
  // игнорируется в status: протухшая-но-живая cookie не может "оживить" локальный логаут.
  const [isLocalLogout, setIsLocalLogout] = useState(() => hasLocalLogoutBarrier());

  // Профиль — session-probe, но подавляется барьером локального логаута.
  const profileQuery = useProfile({ enabled: !isLocalLogout });
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  const { mutateAsync: loginMutate } = loginMutation;
  const { mutateAsync: registerMutate } = registerMutation;
  const { mutateAsync: logoutMutate } = logoutMutation;

  // Контроллер текущего pending logout-запроса — абортится при более новом login/register,
  // в этой ИЛИ другой вкладке (см. invalidatePendingLogouts и cross-tab handler ниже).
  const pendingLogoutAbortRef = useRef<AbortController | null>(null);
  const abortPendingLogout = useCallback(() => {
    pendingLogoutAbortRef.current?.abort();
    pendingLogoutAbortRef.current = null;
  }, []);

  const status: AuthStatus = useMemo(() => {
    if (isLocalLogout) return 'anonymous';
    const err = profileQuery.error;
    const is401 = err instanceof ApiException && err.status === 401;
    if (is401) return 'anonymous';
    if (profileQuery.data) return 'authenticated';
    if (profileQuery.isSuccess || profileQuery.isError) return 'error';
    return 'initializing';
  }, [isLocalLogout, profileQuery.isSuccess, profileQuery.isError, profileQuery.error, profileQuery.data]);

  // user виден только в authenticated, даже если TanStack держит stale data.
  const user = status === 'authenticated' ? profileQuery.data ?? null : null;

  // Purge user-scoped кэша+storage при ЛЮБОМ подтверждённом anonymous — включая
  // initializing → anonymous (протухшая сессия, обнаруженная сразу при reload).
  // Профиль не трогаем — он уже корректно anonymous.
  useEffect(() => {
    if (status === 'anonymous') {
      purgeUserScopedState(queryClient);
    }
  }, [status, queryClient]);

  // Fallback для пропущенного/неподдерживаемого BroadcastChannel: профиль сам (естественным
  // рефетчем) сменил identity authenticated(A) → authenticated(B) без прохода через anonymous/null.
  // Профиль уже подтверждён этим переходом — resetQueries здесь не нужен.
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = currentUserId;
    if (prevUserId !== null && currentUserId !== null && prevUserId !== currentUserId) {
      purgeUserScopedState(queryClient);
    }
  }, [user?.id, queryClient]);

  // Global unauthorized (ordinary 401): ref-guard схлопывает burst в один переход.
  const unauthorizedInFlightRef = useRef(false);
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      if (unauthorizedInFlightRef.current) return;
      unauthorizedInFlightRef.current = true;
      hardResetSession(queryClient);
      navigate(ROUTES.LOGIN, {
        state: { from: locationRef.current },
        replace: true,
      });
    });
    return unsubscribe;
  }, [queryClient, navigate]);

  useEffect(() => {
    if (status === 'authenticated' || status === 'error') unauthorizedInFlightRef.current = false;
  }, [status]);

  // cross-tab: два независимых сигнала. abort-pending-logout — только гасит pending logout
  // этой вкладки (шлётся сразу после login/register, до profile-confirm). session-changed —
  // полноценная граница (логаут другой вкладки → purge без /profile; логин → hardResetSession
  // подтверждает identity рефетчем).
  useEffect(() => {
    const unsubscribeAbort = subscribeAbortPendingLogout(() => {
      abortPendingLogout();
    });
    const unsubscribeSessionChanged = subscribeAuthSessionChange(() => {
      const barrierNow = hasLocalLogoutBarrier();
      setIsLocalLogout(barrierNow);
      if (barrierNow) {
        applyLocalLogout(queryClient);
      } else {
        hardResetSession(queryClient);
      }
    });
    return () => {
      unsubscribeAbort();
      unsubscribeSessionChanged();
    };
  }, [queryClient, abortPendingLogout]);

  // cookie новой сессии уже установлена сервером сразу после loginMutate/registerMutate —
  // отменяем pending logout (эта и другие вкладки) СРАЗУ, до profile-фетча, а не после него:
  // иначе окно гонки со старым logout растягивается на весь round-trip профиля.
  const invalidatePendingLogouts = useCallback(() => {
    abortPendingLogout();
    rotateAuthSessionRevision();
    broadcastAbortPendingLogout();
    // Cookie already belongs to the new login. Hide the previous identity and
    // its cached conversations before the fresh profile request completes.
    hardResetSession(queryClient);
  }, [abortPendingLogout, queryClient]);

  // После login/register cookie уже стоит — подтверждаем сессию свежим профилем и навигируем.
  // Если профиль упал — барьер (если был) остаётся; ранняя отмена старого logout не откатывается.
  const finishAuthSuccess = useCallback(async () => {
    const returnState = locationRef.current.state;
    try {
      const freshUser = await queryClient.fetchQuery({
        queryKey: USERS_QUERY_KEYS.profile,
        queryFn: getProfile,
        staleTime: 0,
      });
      clearLocalLogout();
      setIsLocalLogout(false);
      // Сигнал другим вкладкам — только после подтверждённого profile 200.
      broadcastAuthSessionChanged();
      const target = postAuthRedirect(returnState, freshUser);
      navigate(target, { replace: true });
    } catch {
      // Профиль не подтвердился — статус разрешит useProfile (error/anonymous). Токена нет, откат не нужен.
    }
  }, [navigate, queryClient]);

  const login = useCallback(
    async (dto: LoginDto) => {
      await loginMutate(dto);
      invalidatePendingLogouts();
      await finishAuthSuccess();
    },
    [loginMutate, invalidatePendingLogouts, finishAuthSuccess]
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      await registerMutate(dto);
      invalidatePendingLogouts();
      await finishAuthSuccess();
    },
    [registerMutate, invalidatePendingLogouts, finishAuthSuccess]
  );

  // Успех/ошибка/timeout — исход не важен: сессия завершается локально всегда (barrier
  // переживёт reload, пока не будет успешного login/register). Единственное исключение —
  // revision сменилась, пока ждали ответ: более новый login уже установил валидную сессию,
  // тогда НЕ уводим на /login и намеренно её не трогаем.
  const logout = useCallback(async () => {
    const revisionAtStart = readAuthSessionRevision();
    const controller = new AbortController();
    pendingLogoutAbortRef.current = controller;
    try {
      await logoutMutate(controller.signal);
    } catch {
      // сервер не подтвердил / запрос отменён (см. invalidatePendingLogouts) — логаутимся локально всё равно
    } finally {
      if (pendingLogoutAbortRef.current === controller) {
        pendingLogoutAbortRef.current = null;
      }
    }
    if (readAuthSessionRevision() !== revisionAtStart) return;
    markLocalLogout();
    setIsLocalLogout(true);
    applyLocalLogout(queryClient);
    broadcastAuthSessionChanged();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logoutMutate, queryClient, navigate]);

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.profile });
  }, [queryClient]);

  const canAccess = useCallback(
    (pathname: string) => canAccessByPath(pathname, user),
    [user]
  );

  const value: AuthContextValue = useMemo(
    () => ({
      status,
      user,
      login,
      register,
      logout,
      retry,
      canAccess,
      isLoggingIn: loginMutation.isPending,
      isRegistering: registerMutation.isPending,
      isLoggingOut: logoutMutation.isPending,
      loginError: loginMutation.error,
      registerError: registerMutation.error,
      logoutError: logoutMutation.error,
    }),
    [
      status,
      user,
      login,
      register,
      logout,
      retry,
      canAccess,
      loginMutation.isPending,
      loginMutation.error,
      registerMutation.isPending,
      registerMutation.error,
      logoutMutation.isPending,
      logoutMutation.error,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
