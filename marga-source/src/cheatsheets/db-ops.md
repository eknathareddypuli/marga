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

## Handy commands

```bash
psql -c "select pid, state, wait_event from pg_stat_activity where state <> 'idle';"
```

```bash
psql -c "select relname, n_dead_tup from pg_stat_user_tables order by n_dead_tup desc limit 5;"
```

```bash
pgbackrest info
```

```bash
redis-cli info memory
```

```bash
psql -c "select * from pg_stat_replication;"
```

```bash
pg_dump --schema-only -f schema.sql DBNAME
```

## Watch out for

> **Warning:** A backup that was never restored is only a hope, so schedule restore tests.

> **Warning:** Creating an index without CONCURRENTLY blocks writes on a busy table.

> **Warning:** A pooler in transaction mode breaks session features such as prepared statements and advisory locks.

> **Warning:** Never run a failover command twice without checking which node is the primary.
