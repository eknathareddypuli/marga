---
title: Database incidents and runbooks
minutes: 12
summary: Respond to common database incidents with a method: classify, stabilise, diagnose with the right views, and write runbooks that others can follow.
---

Database incidents follow patterns: too many connections, a runaway query, locks, full disk, replication broken. A short method and good runbooks make them routine.

## What you will learn

- A first five minute checklist
- Diagnosing load: queries, locks and waits
- Disk, WAL and replication emergencies
- Safe actions and what not to do
- Writing and testing runbooks

## First five minutes

Confirm the impact, check whether the database is up and accepting connections, check disk and CPU, then look at connections and the longest running queries. Announce the incident and pick a commander. Avoid changing several things at once, because you will not know what worked.

## Queries, locks and waits

In PostgreSQL `pg_stat_activity` shows running queries and their wait events, and `pg_locks` shows who blocks whom. A single long transaction can hold locks and prevent cleanup, which causes bloat. In MongoDB `currentOp` and the profiler play the same role. Find the blocker, not only the victims.

## Disk and replication

A full disk can stop a database. Find what is large: tables, temporary files, WAL or logs. Do not delete WAL files by hand. Free space by removing safe files, dropping unused slots or extending the volume. If a replica breaks, rebuild it from a base backup rather than guessing at repairs.

## Safe actions

Cancel a query with `pg_cancel_backend` before terminating it with `pg_terminate_backend`. Kill the blocker only when you understand the effect. Do not restart a database during recovery unless you must, and never run a destructive command on the only copy of the data without a backup.

## Runbooks

A good runbook starts with the symptom, lists the checks in order with exact commands, states what is safe, has a decision for each result and names who to call. Test it by letting someone who did not write it follow it in a drill, then fix what was unclear.

```diagram
title: Database incidents and runbooks
node: sym | Symptom | 0 | 1 | Alert or report. | Misread. | external
node: diag | Diagnose | 1 | 1 | Queries, locks, disk. | Changing many things. | observe
node: act | Safe action | 2 | 1 | Cancel, free space. | Destructive step. | process
node: rb | Runbook update | 3 | 1 | Captures lessons. | Never updated. | store
edge: sym | diag
edge: diag | act
edge: act | rb
```

## Incident: One idle transaction that blocked everything

> **Incident:** A forgotten transaction held a lock for six hours and queries stacked up behind it.

```console
$ psql -c "select pid, now()-xact_start as age, state, left(query,40) from pg_stat_activity where state = 'idle in transaction' order by age desc limit 2"
 pid  | age      | state               | left
 3902 | 06:11:02 | idle in transaction | update accounts set ...
(this is a simulated illustration, not a real incident)
```

A script opened a transaction and then waited for input. The commander cancelled it after checking it was safe, queries drained within a minute and an idle in transaction timeout was set, with an alert on the age of the oldest transaction.

## Common mistakes

- Changing many things at once
- Deleting WAL files by hand
- Killing sessions without understanding them
- Runbooks that nobody has tried
- No timeout for idle in transaction sessions

```quiz
Q: What should you do first in an incident?
+ Confirm impact and check basic health
- Restart the server :: Too early.
- Delete logs :: Wrong.
- Change settings :: Too early.
> Then look at connections and queries.

Q: How do you find who blocks whom?
+ pg_locks with pg_stat_activity
- top only :: Not enough.
- ping :: No.
- df :: No.
> Find the blocker.

Q: What should you never do?
+ Delete WAL files by hand
- Cancel a query :: Safe first step.
- Check disk :: Safe.
- Read logs :: Safe.
> It can corrupt the database.

Q: How do you test a runbook?
+ Let someone else follow it in a drill
- Read it once :: Not enough.
- Print it :: No.
- Skip it :: Unsafe.
> Fix unclear steps.
```

```cards
Runbook :: Step by step instructions for responding to a situation
Blocker :: A session holding a lock that others wait for
Idle in transaction :: A session that opened a transaction and is not working
Commander :: The person coordinating the response
```
