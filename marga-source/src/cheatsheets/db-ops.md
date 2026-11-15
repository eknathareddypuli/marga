---
title: Database operations
summary: PostgreSQL checks, backup rules and safe schema changes.
module: db-ops
---

## PostgreSQL checks

| Job | Query or command |
|-----|------------------|
| Replication lag | `select now() - pg_last_xact_replay_timestamp()` |
| Slots | `select * from pg_replication_slots` |
| Active queries | `select pid, state, query from pg_stat_activity` |
| Blockers | `select * from pg_blocking_pids(PID)` |
| Cancel query | `select pg_cancel_backend(PID)` |

## Backups

| Item | Rule |
|------|------|
| RPO | Sets WAL archive and backup frequency |
| RTO | Sets restore automation |
| Drill | Restore on a schedule and time it |

## Safe DDL

| Change | Pattern |
|--------|---------|
| Index | `CREATE INDEX CONCURRENTLY` |
| Constraint | Add `NOT VALID` then `VALIDATE` |
| Lock wait | `SET lock_timeout = '5s'` |
