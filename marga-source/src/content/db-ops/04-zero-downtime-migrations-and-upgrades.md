---
title: Zero downtime migrations and upgrades
minutes: 13
summary: Change schemas without locking tables using expand and contract, run safe index builds and plan major version upgrades with pg_upgrade or logical replication.
---

A schema change that takes a lock on a busy table is an outage. Safe migrations split a change into small compatible steps, and major upgrades need a rehearsed plan.

## What you will learn

- Locks taken by common DDL
- Expand and contract
- Safe patterns: indexes, columns and constraints
- Major version upgrades
- Rollback planning

## Locks

Many `ALTER TABLE` operations take an exclusive lock, and a long running query ahead of them in the queue blocks everything behind. Set `lock_timeout` so a migration fails fast instead of piling up waiters, and run it when the table is quiet. Know whether each statement rewrites the table.

## Expand and contract

First expand: add the new column or table, nullable, without removing anything. Deploy code that writes both and reads the old. Backfill in small batches. Then switch reads to the new structure. Finally contract: remove the old column once nothing uses it. Each step is safe to roll back.

## Safe patterns

Create indexes with `CREATE INDEX CONCURRENTLY`, which avoids blocking writes but takes longer and can leave an invalid index if it fails. Add a column with a default in recent versions without a rewrite. Add a foreign key or check constraint as `NOT VALID` and validate it afterwards, which needs a weaker lock.

## Major upgrades

`pg_upgrade` upgrades in place quickly, especially with link mode, but needs a window and a tested rollback. Logical replication builds a new version cluster in parallel and lets you switch with seconds of downtime. After the upgrade, run `ANALYZE` to rebuild statistics and watch query plans.

## Rollback

Before a risky step write the rollback. For schema changes it is often the reverse step. For upgrades keep the old cluster intact until the new one has been in use long enough. Rehearse on a recent copy of production data and measure the timing.

```diagram
title: Zero downtime migrations and upgrades
node: exp | Expand | 0 | 1 | Add compatible structure. | Blocking lock. | process
node: mig | Migrate code and data | 1 | 1 | Dual write, backfill. | Big batch. | process
node: con | Contract | 2 | 1 | Remove old structure. | Still used. | process
node: up | Major upgrade | 3 | 1 | Parallel cluster. | No rollback. | service
edge: exp | mig
edge: mig | con
edge: con | up
```

## Incident: An index build that blocked writes for ten minutes

> **Incident:** A plain index creation on a busy table held a lock and orders could not be saved.

```console
$ psql -c "select pid, wait_event_type, query from pg_stat_activity where wait_event_type = 'Lock' limit 2"
 pid  | wait_event_type | query
 4411 | Lock            | insert into orders (...)
 4412 | Lock            | insert into orders (...)
(this is a simulated illustration, not a real incident)
```

The team created the index without CONCURRENTLY, which blocks writes for the whole build. The next time they used CREATE INDEX CONCURRENTLY with a lock timeout, checked for an invalid index afterwards and scheduled it outside the peak.

## Common mistakes

- Migrations with no lock timeout
- Dropping a column before code stops using it
- Creating indexes without CONCURRENTLY on busy tables
- Upgrading with no rehearsal
- Forgetting ANALYZE after an upgrade

```quiz
Q: What is expand and contract?
+ Add compatible structure, migrate, then remove the old
- Delete then add :: Unsafe.
- Copy a database :: Different.
- Reindex :: Different.
> Small safe steps.

Q: Why set lock_timeout?
+ So a migration fails instead of blocking everything
- To speed queries :: No.
- To save disk :: No.
- To encrypt :: No.
> Avoid pile ups.

Q: What does CONCURRENTLY do?
+ Builds an index without blocking writes
- Skips the build :: No.
- Deletes data :: No.
- Locks the table :: Opposite.
> Check validity afterwards.

Q: What helps a major upgrade with little downtime?
+ Logical replication to a new cluster
- A larger disk :: No.
- A restart :: No.
- No testing :: No.
> Switch over quickly.
```

```cards
Expand and contract :: A pattern for compatible schema changes
lock_timeout :: Maximum time to wait for a lock
CONCURRENTLY :: Creating an index without blocking writes
pg_upgrade :: A tool for in place major upgrades
```
