---
title: Backups, point in time recovery and restore testing
minutes: 13
summary: Plan backups for a recovery point and time objective, use base backups with WAL archiving for point in time recovery and test restores on a schedule.
---

Replication is not a backup: it copies mistakes and deletions instantly. Backups with point in time recovery let you return to the moment before a bad change, if you have tested them.

## What you will learn

- Logical versus physical backups
- Base backup plus WAL archiving
- Point in time recovery in practice
- Tools: pgBackRest and cloud snapshots
- Restore drills and monitoring

## Logical and physical

A logical backup with `pg_dump` exports data as SQL and is portable across versions but slow to restore on large databases. A physical backup copies the data files and is fast to restore. Large production databases rely on physical backups, with dumps for specific tables or version moves.

## Base plus WAL

A base backup is a full copy of the data directory. Continuous archiving then copies each WAL segment to storage as it fills. To restore, you take the base backup and replay the archived WAL up to a chosen time. The archive must be complete, so a missing segment breaks recovery.

## PITR

Point in time recovery lets you set a target such as `recovery_target_time = 2026-11-10 09:14:00`. After an accidental delete at 09:15 you restore to 09:14 into a separate server, copy out the lost rows and keep production running. Practise the steps so they are not new during an incident.

## Tools

pgBackRest and similar tools handle full, differential and incremental backups, compression, encryption, parallel restore and retention. Managed services provide snapshots and PITR, but you still choose retention, test restores and protect backups from deletion by the same account that runs the database.

## Drills and monitoring

Restore a backup into a scratch environment on a schedule and run integrity checks and a sample query. Record how long it took and compare it with the recovery time objective. Alert on archive failures, the age of the last successful backup and the size of the WAL archive.

```diagram
title: Backups, point in time recovery and restore testing
node: db | Primary | 0 | 1 | Writes WAL. | Archive fails. | store
node: arch | WAL archive | 1 | 1 | Continuous copy. | Gap in segments. | store
node: base | Base backups | 2 | 1 | Full copies. | Old or missing. | store
node: drill | Restore drill | 3 | 1 | Proves it works. | Never tested. | observe
edge: db | arch
edge: db | base
edge: base | drill
```

## Incident: A restore that stopped at a missing segment

> **Incident:** During a recovery the database refused to continue because one WAL segment was missing.

```console
$ pgbackrest --stanza=main check
ERROR: [082]: WAL segment 0000000100000A3B000000F2 was not archived before the 60000ms timeout
$ pgbackrest --stanza=main info | grep -A2 "wal archive min/max"
        wal archive min/max (15): 0000000100000A3B000000A1/0000000100000A3B000000F1
(this is a simulated illustration, not a real incident)
```

The archive command had been failing for two days because a credential expired and nobody was alerted. The team renewed the credential, took a fresh full backup to cover the gap and added an alert on archive errors and on the age of the newest archived segment.

## Common mistakes

- Treating replication as a backup
- Backups stored in the same account and region
- Never restoring them
- No alert on archive failures
- Retention that is too short for late discovered mistakes

```quiz
Q: Why is a replica not a backup?
+ It copies deletions immediately
- It is slower :: No.
- It is encrypted :: No.
- It is smaller :: No.
> Mistakes replicate.

Q: What does PITR need?
+ A base backup and a continuous WAL archive
- A dump only :: Not enough.
- A replica only :: Not enough.
- A screenshot :: No.
> Replay to a target time.

Q: What should a restore drill measure?
+ Whether it works and how long it takes
- Only disk size :: No.
- Only cost :: No.
- Nothing :: Pointless.
> Compare with RTO.

Q: What should be monitored?
+ Archive errors and the age of the last backup
- Dashboard colours :: No.
- User count :: No.
- Query text :: No.
> Silent failure is the risk.
```

```cards
PITR :: Restoring a database to a chosen moment in time
Base backup :: A full copy of the data directory
pgBackRest :: A backup and restore tool for PostgreSQL
RTO :: Recovery time objective
```
