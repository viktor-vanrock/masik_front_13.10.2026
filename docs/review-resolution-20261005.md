# Frontend runtime review resolution — 2026-10-05

Reviewed starting frontend commit `4270bfd2e7bfe741a9796b3d4ed4b74670d5ad50` on `codex/regression-fixes-20261005`. The pasted review was treated as claims to verify, not as instructions to reverse the service separation or account isolation. This document covers API, polling, auth and chat runtime findings; presentation/domain review is documented separately.

## Confirmed and fixed

### Operation polling did not enforce its wall-clock deadline

`src/api/catalog/operations.ts` previously checked the deadline only after a status GET resolved. A stuck request could keep a mutation pending indefinitely, and reaching the deadline during backoff started one additional GET.

The wait now owns an AbortController and a deadline timer. HTTP status reads receive its signal; timeout or caller cancellation rejects the wait promptly even if an adapter never settles, stops the HTTP request and clears the backoff timer. The deadline is checked before and after a status read. Timeout still returns `BenchmarkOperationTimeoutError` with the receipt and does not represent the server operation as rejected. The timeout applies to waiting for the operation, not the separate subsequent aggregate read. Callers may supply an optional AbortSignal; no new automatic resend or server cancellation is introduced.

Regression tests cover a hung GET, an applied response arriving after timeout, no new GET at the deadline, timeout zero, cancellation while fetching/backing off, a pre-aborted signal, backoff timing, and timer cleanup. Default queued polling now makes 12 reads within 45 seconds instead of a thirteenth read at expiry.

### Identity reset unnecessarily restarted the typing indicator

`src/pages/BenchmarkCreate/ui/CreateContent/hooks/useConversation.ts` set `isTyping` false and then true inside the identity-boundary cleanup, even when no conversation was active. The redundant true assignment was removed. A test changes the authenticated user without remounting the hook and verifies no active session, no typing indicator, and removal of session, status and owner keys.

The review's separate assertion that `CONV_STATUS_KEY` was not cleared was incorrect: `clearAuthScopedStorage()` already includes it alongside session and owner IDs. That behavior remains intact and is now explicitly covered by the identity-change regression.

## Claims verified and not changed

| Review claim | Resolution and evidence |
|---|---|
| `moderateCatalogEntry` must await a Kafka operation receipt | Not applicable. Moderation is Catalog-owned synchronous state, not a Benchmark Service specification mutation. Backend `catalog-entry.service.ts` updates the entry in a transaction and returns the hydrated Test; the controller has no queued receipt contract here. User submission and specification writes continue using receipt polling. Wrapping all mutations indiscriminately would conflate service ownership. |
| Rejected operations need an early exit after N polls | Already handled more promptly: the first matching `rejected` response throws `BenchmarkOperationRejectedError`. Existing coverage preserves reason/status/deletedId for restore. The rejection test now explicitly asserts exactly one GET. No N-poll delay was added. |
| A refetch during generation retry can restore stale terminal data | Not reproduced on the current implementation. Both `onMutate` and `onSuccess` cancel the exact owner-scoped generation query, and `onSuccess` writes the newly queued job. Added a stricter test that starts a refetch after onMutate, completes retry first, then resolves the old failed response. The new job remains queued. Existing tests also cover pre-retry fetch, cancel races and late mutation responses across user switches. No extra epoch mechanism was needed. |
| `purgeNonProfileQueries` can reinsert late query results after removal | Not reproduced with the installed TanStack Query implementation. `query.cancel()` synchronously cancels the retryer before the returned promise settles; cancellation rejects `fetchQuery` consumers, and removal destroys the query. Added an actual Login/AuthProvider integration test with an old in-flight `fetchQuery().then(setter)`: login removes the key, the late transport response never calls its success setter, and the old cache stays absent. Restoring `resetQueries` refetch behavior would be counterproductive across a cookie identity change. |
| Auth redirect lacks a whitelist and can send users externally | The current shared `postAuthRedirect` already requires a local slash-prefixed path, rejects protocol-relative/external values and login/register loops, and calls `canAccess` with the freshly confirmed identity. Added tests for HTTPS/protocol-relative/javascript destinations, auth-page loops, privileged admin denial and authenticated submission return. Actual Login/AuthProvider tests cover stable final navigation and direct authenticated login→home. No reachable external-return source or role bypass was demonstrated by the review. |
| Every agent `result` prematurely completes a conversation | Current contract has only `done`, `finished`, and `generating`. `generating` is explicitly nonterminal; errors are also nonterminal. `done`/`finished` complete as the backend does, including legacy results without isFinal. Existing contract tests cover these cases. The backend validates incoming result status before emitting it. Changing this to isFinal-only would regress the legacy result contract. |
| `useEffectEvent` is unavailable/experimental | Installed React is `19.2.7`; `typeof React.useEffectEvent` is `function`. React dependency is the stable 19.2 line and the current builds/tests execute it. No replacement based on an incorrect availability claim. |
| createBenchmark removes the public cache when published | The source does the opposite: `published` responses populate public detail; unpublished responses remove public detail and populate management detail. Synchronous and receipt paths both return a hydrated Test to the same onSuccess handler. This is the intended public/management visibility boundary. |
| `TEST_METRIC_REQUIRED` hides a 403/usage/duplicate response | The only backend emitter of that code is a `BadRequestException` (400) during publication. The proposed 403+metric-code response is hypothetical and does not occur in the current contract. Permission checks remain backend-enforced. No behavior changed for an invented payload combination. |
| Hiding the submission button while auth is initializing is a regression | Intentional identity-boundary behavior: an unconfirmed cached/cookie session does not grant authenticated actions. Once profile is confirmed, `auth.canAccess('/add-benchmark')` permits USER as well as ADMIN/SUPERUSER. Current login and route tests cover this intended behavior. |

## Files changed by runtime audit

- `src/api/catalog/operations.ts`
- `src/api/catalog/operations.test.ts`
- `src/api/catalog/requests.test.ts` (updated expected status-read request signal)
- `src/pages/BenchmarkCreate/ui/CreateContent/hooks/useConversation.ts`
- `src/pages/BenchmarkCreate/ui/CreateContent/hooks/useConversation.test.tsx`
- `src/pages/BenchmarkCreate/ui/CreateContent/hooks/useGeneration.test.tsx`
- `src/pages/Login/Login.redirect.test.tsx`
- `src/routes/postAuthRedirect.test.ts`

No commits, pushes, merges or merge-request changes were performed by this subtask.

## Validation

- Operations/catalog requests: 2 files / 23 tests passed.
- Auth/redirect/conversation/generation targeted run: 5 files / 31 tests passed.
- Lint and production build passed after the runtime and concurrent UI changes.
- Full combined frontend suite: **49 files / 296 tests passed**. This includes the concurrent UI agent’s tests. Existing Vite bundle-size and local Node storage warnings are unchanged.
- `git diff --check` passed.


# Разбор UI/domain замечаний frontend — 05.10.2026

Источник замечаний: приложенный `Pasted text.txt`, синтез ревью. Проверена рабочая ветка `codex/regression-fixes-20261005` на исходном HEAD `4270bfd`. Приоритет проверки — согласованный контракт разделения: Benchmark/Test принадлежат Benchmark Service, публикация принадлежит каталогу, MetricResult относится к Test, human baseline — поле Test. Исходники API/auth/generation hooks в этой части работы не менялись.

## Вердикты по каждому переданному замечанию

| Пункт синтеза | Вердикт | Проверенные факты / решение |
| --- | --- | --- |
| `ScoresTab.tsx:77`: удалён фильтр `subsetId === null` | Отклонено: противоречит действующему доменному контракту. | `src/types/metrics.ts` больше не содержит subsetId. Backend `CreateMetricResultDto` отвергает непустые subsetId/subsampleId, `docs/benchmark-domain-contract.md` явно закрепляет Test + Model + Metric и запрещает результаты частей датасета. Восстановление фильтра убрало бы **все** корректные новые результаты: отсутствующее свойство даёт undefined, не null. `latestResults` корректно выбирает последнюю запись для пары metricId/modelId. Код не менялся. |
| `AdminValidationTab.tsx:63`: disabled + повторная проверка метрики в handler | Отклонено: защитная проверка, не гонка, создающая запрещённую запись. | `ValidationCard` и `ValidationDetailModal` отключают approve при отсутствии metric или pending. `handleApprove` повторно проверяет `hasAssignedMetric`, показывает причину и делает return **до** `mutateAsync`. Backend повторно проверяет назначение перед публикацией. Асинхронно устаревшая карточка может потребовать обновления, но не обходить серверную проверку. Удалять guard нельзя. |
| `BenchmarkCard/index.tsx:38`: один цвет в getColorByName | Факт подтверждён, но это исходный дизайн пользователя, не регрессия объединения. | `getColorByName` с `['--add-red-600']` побайтно совпадает с `new-microservices f1c3715`. Цвет не определяет доступность/данные/маршруты. Введение произвольной палитры изменило бы приоритетную пользовательскую UI-ветку без функциональной причины. Оставлено. |
| `UploadModal.tsx:28`: без назначенных метрик нечего выбрать | Частично подтверждено: запрет правильный, объяснение следующего действия недостаточно конкретно. Исправлено узко. | Показывать все определения при пустом `uploadTarget.metrics` нельзя: это позволяет выбрать **неназначенную** метрику, которую backend запрещает. Пустой selector и disabled submit сохранены. Уже существовало общее предупреждение; добавлена точная RU/EN подсказка назначить Metric в форме редактирования и ссылка на текущий Test. При назначенной, но недоступной definition сохраняется отдельное прежнее сообщение. |
| `ScoresTab.tsx:113`: humanBaseline не ранжируется как Model | Отклонено: ожидаемая новая модель данных. | `docs/benchmark-domain-contract.md:98–107` и `MetricsService.createMetricResult` прямо запрещают синтетический `modelId=human`. Число `benchmark.humanBaseline` показано отдельно и на графике; сортировка применяется только к реальным Model result. Возвращать human в ranking означает восстановить удалённую монолитную трактовку. Код не менялся. |
| `GenerationPanel.tsx:109`: пользователь может снять последнюю галочку | Отклонено: корректное, явно объяснённое состояние выбора. | При 0 selected UI показывает честный счётчик, текст «Выберите хотя бы одно задание для масштабирования», disabled start; slider/count вычисляются безопасно без деления на 0. Уже есть тест `requires at least one selected task before production`. Запрещать снять последнюю галочку означало бы неожиданно менять выбор пользователя. Код не менялся. |
| `Navbar.tsx:15`: effect вызывает setMobileOpen(false) на pathname change | Не функциональный дефект. | Effect закрывает открытое меню при переходе, включая программный logout. React пропускает обновление с прежним boolean false; утверждение «обязательно новый рендер при уже закрытом меню» неверно. Код совпадает с приоритетной `new-microservices`, новых обработчиков/циклов нет. Оставлено. |
| `BenchmarkDetail/index.tsx:40`: literal `/` вместо ROUTES.CATALOGUE | Поддерживаемость, без текущей ошибки маршрутизации. | Каталог находится на `/` (`ROUTES.HOME`); `ROUTES.CATALOGUE` отсутствует уже в `f1c3715`. Redirect/back links ведут в корректный существующий маршрут. Код и constants совпадают с исходной веткой пользователя. Гипотетическое будущее переименование не основание для правки функционального merge. Оставлено. |

## Узкое исправление UploadModal

Изменены только:

- `src/pages/AdminPanel/ui/UploadModal.tsx` — contextual guidance + существующий route `ROUTES.ADMIN_EDIT(uploadTarget.id)`, закрытие modal по переходу; фильтр назначенных метрик и Test-level payload сохранены.
- `src/i18n/index.ts` — ключ `admin.metricRequiredForResult` на русском и английском.
- `src/pages/AdminPanel/ui/UploadModal.test.tsx` — 4 проверки: RU/EN guidance/link, запрещённая отправка без assignment, только назначенная definition и payload с testId, различение отсутствия assignment/недоступной definition.

Проверки: `vitest run UploadModal.test.tsx validationRules.test.ts GenerationPanel.test.tsx` — **3 файла, 23 теста passed**. ESLint по изменённым файлам и `git diff --check` прошли. Существующее предупреждение Node `--localstorage-file` не связано с изменениями.

## История и MR31 / MR32

Read-only Git проверка:

- `new-microservices` = `f1c3715` — предок `9468e4c` (`codex/reconcile-microservices-20261002`).
- `9468e4c` — предок `4270bfd` (`codex/regression-fixes-20261005`).
- Единственный дополнительный commit между этими remote source branches до текущих правок — `4270bfd`, реальные owner profile history и post-login destinations. Следовательно второй source включает всю первую интеграцию, а не альтернативную несовместимую работу.
- По сохранённым данным публикации `regression-20261005/final-manifest.json` и `REPORT.md`: frontend MR32 — `4270bfd` → develop, включает MR31; MR31 представляет integration source `9468e4c`. Для окончания merge достаточно одного MR32 с полной историей; решение о закрытии MR31 принимает родительский агент после проверки актуального GitLab состояния.
- В каталожных UI/domain путях (`BenchmarkDetail`, `AdminPanel`, `BenchmarksCatalogue`, Navbar, route constants) между `f1c3715` и `4270bfd` нет diff. Большая часть рассматриваемых претензий адресована **исходной архитектурной ветке пользователя**, а не внесённым merge изменениям.

Текущие server-side title/state/head MR31/MR32 через Code Review tool перепроверить не удалось: запросы вернули ошибку подключения «Sign in to Codex with ChatGPT to connect GitHub». Локальный `glab` отсутствует. Branch ancestry подтверждена напрямую Git; mapping MR основан на сохранённом publication manifest. Permissions, ветки, настройки GitLab, commits, push и merge в этой работе не выполнялись.


## Единый источник объединения

MR32 содержит всю историю и реализацию MR31, исходный new-microservices и последующие исправления. Для develop используется один итоговый head MR32; MR31 не является второй независимой реализацией. Main не обновляется до приёмки develop.

## Ограничение текущего CI

В проверенном `.gitlab-ci.yml` build/lint/test ограничены ветками develop/main, а `check_lint` и `check_test` допускают failure. Успешный pipeline сам по себе не является подтверждением прохождения этих jobs. Фактические MR pipelines и обязательные approvals нужно проверить на сервере с учётом внешних includes. Настройка обязательных MR jobs относится к отдельному согласованию с DevOps; текущая конфигурация Захара сохранена. Приведённые выше 296 tests, lint и build выполнены локально на итоговом коде.
