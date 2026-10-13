# Frontend regression — 2026-10-05

Current remote main8160352/develop4a68021 do not contain the microservice integration9468e4c. Their ordinary suites pass215/219 tests but all6 shared split-contract checks fail. Actual Chrome visiting current develop /catalog against backenddevelop25b9a25 renders a blank page with undefined.map: old subDatasets/benchmarkId and synchronous mutation expectations do not match datasetSubsamples/testId and202operation receipts.

This branch includes the complete prior microservice integration plus narrow fixes found by live regression:

- Profile reads the owner-scoped conversations API instead of MOCK_DIALOGUE/session1, with explicit loading/error/retry/empty states and correct history links.
- USER can return to /add-benchmark after login. Login/Register and AuthProvider use the same authorized destination; the provider captures return state before async profile completion to avoid the observed redirect-to-home race.
- The catalogue submission button follows the same authenticated route permission; /admin remains restricted.

Validation: lint, build,47test files/278tests PASS. Includes actual Login/AuthProvider/AppProvider/AuthGuard regression, profile ownership transitions, and original catalogue/operations/moderation/metrics/chat tests. Real Chrome recheck confirmed stable USER login returnTo, private history isolation and admin denial.

The isolated live stack also passed catalogue search/detail/tabs/RU-EN, all admin tabs, five-step UI submission202 through real Kafka, metric-required moderation, UI metric edit/publish, actual91.75 result upload/display after reload,20Inventor examples with selected indices[1,19], partial Producer3/4 and3-lineJSONL download/reload. ML worker outputs were synthetic; real corporate model/cluster configuration is not certified.

Backend null-PATCH corrections are a companion MR. Full source-branch matrix, Astafurov feature audit, database migration rehearsal and evidence are in the backend docs/regression-20261005.md and docs/astafurov-audit-20261005.md, plus the parent workspace regression-20261005/ directory.

This MR supersedes the previous frontend integration MR31 if that MR has not been merged. It carries its ancestry and all implemented features. Main/develop were not rewritten during testing.
