# Microservices reconciliation — 2026-10-02

Base: `new-microservices` (`f1c3715`). Reconciled history: develop `4a68021`, main `8160352`, and the separate user selection change `5b05f5b`.

Catalog, submission/moderation, asynchronous Kafka operations, dashboard metrics, auth and DevOps source files remain unchanged. All original files and tests are preserved. Checkpoints are published under `codex/checkpoint-20261002T115529Z/`; `fetched-new-microservices`, `fetched-develop`, `fetched-main` and `checkout` preserve the key starting points. Independent Git bundles and SHA manifests reside in the parent workspace's `merge-safety/20261002T115529Z/`.

The chat now includes Inventor progress/results/retry/cancel, Producer scaling and JSONL download, selection of generated seeds, equal variants per selected seed, explanations and direct creation from recommendations. Canonical API identifiers remain `testId`. Original rejection-to-creation behavior is preserved. Generation/production queries and mutations are scoped to the initiating user; late GET/mutation responses cannot overwrite another account or a retried/cancelled job. Restoring a generating conversation does not restart the interviewer.

The unrelated MAS visual redesign was excluded. The matching backend integration branch is required for generation/production APIs. Backend details and configuration are documented in `benchmark-catalog-back/docs/reconciliation-20261002.md`.

Validation: lint, production build and all 44 test files / 270 tests passed. Existing Vite bundle-size and local Node localStorage warnings remain. No live browser/deployment test was performed.
