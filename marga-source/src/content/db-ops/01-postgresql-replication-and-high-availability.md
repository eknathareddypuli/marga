---
title: PostgreSQL replication and high availability
minutes: 13
summary: Understand streaming replication, synchronous and asynchronous trade-offs, failover tools such as Patroni, and how to avoid split brain and data loss.
---

A single database server is a single point of failure. Replication keeps copies, and a failover process promotes one when the primary dies. The hard part is doing it without losing data or ending up with two primaries.

## What you will learn

- Write ahead log and streaming replication
- Asynchronous versus synchronous replication
- Replication lag and what it means for reads
- Automatic failover with Patroni and a consensus store
- Split brain, fencing and promotion safety

## WAL and streaming

PostgreSQL writes every change to the write ahead log first. A standby connects to the primary and replays that log continuously. The standby is a read only copy that can serve queries and take over. Replication slots keep the log until each standby has received it, but a stuck standby can fill the primary disk with retained log.

## Asynchronous or synchronous

In asynchronous replication the primary commits without waiting, so it is fast but a crash can lose the last few transactions. Synchronous replication waits for at least one standby, which avoids loss but adds latency and can block writes if the standby is gone. Quorum settings such as `ANY 1 (s1, s2)` give a compromise.

## Lag

Replication lag is the delay between the primary and a standby. Measure it in bytes and in seconds. Reads from a lagging standby can return old data, so route read your writes queries to the primary or wait for a log position. Alert on lag before it becomes minutes.

## Automatic failover

Patroni runs next to each PostgreSQL instance and keeps a leader key in a consensus store such as etcd. If the leader key expires, the healthiest standby is promoted and the others follow it. Applications connect through a proxy or a virtual address that points to the current leader.

## Split brain and fencing

Split brain means two nodes both accept writes. Prevent it with a consensus store, a watchdog that restarts a node that cannot reach it and a proxy that checks the role. After a failover, the old primary must not rejoin as primary: it needs to be rewound or rebuilt from the new one.

```diagram
title: PostgreSQL replication and high availability
node: app | Application | 0 | 1 | Writes and reads. | Hard coded host. | external
node: pri | Primary | 1 | 1 | Accepts writes. | Crash. | store
node: stb | Standby | 2 | 1 | Replays WAL. | Lag. | store
node: dcs | Consensus store | 3 | 1 | Holds the leader key. | Quorum lost. | process
edge: app | pri
edge: pri | stb
edge: stb | dcs
```

## Incident: A primary that filled its disk with retained logs

> **Incident:** A forgotten replica made the primary retain WAL until the disk was full.

```console
$ psql -c "select slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) as retained from pg_replication_slots"
 slot_name | active | retained
 old_rep_2 | f      | 412 GB
(this is a simulated illustration, not a real incident)
```

A standby decommissioned weeks earlier still had a replication slot, so the primary kept every log segment since then. Dropping the slot freed the space, and the team added an alert on retained WAL per slot and a step in the decommission checklist.

## Common mistakes

- Forgotten replication slots
- Synchronous replication with a single standby
- No fencing of the old primary
- Reading from standbys without considering lag
- Failover never tested

```quiz
Q: What does a standby replay?
+ The write ahead log from the primary
- The query log :: No.
- The CPU :: No.
- The backups only :: No.
> Streaming replication.

Q: What is a risk of asynchronous replication?
+ Losing the last transactions on a crash
- Slow writes :: It is fast.
- No standby :: It has one.
- No logs :: It has logs.
> Trade speed for durability.

Q: What prevents split brain?
+ A consensus store, watchdog and fencing
- More replicas :: Not enough.
- A bigger disk :: No.
- A cache :: No.
> One leader at a time.

Q: Why alert on replication slots?
+ An inactive slot retains log and can fill the disk
- They slow reads :: Not the point.
- They delete data :: No.
- They encrypt data :: No.
> Watch retained size.
```

```cards
WAL :: Write ahead log of all changes
Standby :: A replica that follows the primary
Patroni :: A tool for PostgreSQL high availability
Split brain :: Two nodes both acting as primary
```
