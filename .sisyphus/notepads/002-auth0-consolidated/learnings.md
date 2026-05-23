## T3 completed [2026-05-22]
- Created packages/shared/auth-types/src/schema/migrations/0004_users_sub_pk.sql
- Accounts schema = billing entity: owner_sub UNIQUE + tier (NOT OAuth social connections)
- Smoke test: Docker pg16 container, migration applied cleanly
- Evidence: .sisyphus/evidence/task-3-users-desc.txt
