---
title: Batch orchestration with Airflow
minutes: 12
summary: Run data workflows with Airflow: DAGs, schedules and backfills, idempotent tasks, retries and sensors, and operating the scheduler and workers.
---

Data jobs depend on each other and on time. An orchestrator records those dependencies, runs the jobs in order and lets you retry or rerun a day without guessing.

## What you will learn

- DAGs, tasks and schedules
- Idempotent tasks and safe reruns
- Retries, timeouts and sensors
- Backfills and catchup
- Operating the scheduler and workers

## DAGs

A DAG is a graph of tasks with no cycles. Each run has a logical date, which is the data interval it processes, not the moment it started. Keep DAG files light, because the scheduler parses them often, and do the real work inside tasks.

## Idempotent tasks

A task is idempotent when running it twice for the same interval gives the same result. Write to a partition for the interval and overwrite it, or use merge, instead of appending blindly. Then a retry or a backfill never duplicates rows.

## Retries and sensors

Set retries with a delay and an execution timeout so a stuck task does not hold a slot forever. A sensor waits for a file or a table to arrive. Use deferrable sensors or reschedule mode so waiting does not occupy a worker.

## Backfills

A backfill reruns a range of past intervals after a fix or a new DAG. Limit concurrency with `max_active_runs` and pools so a backfill does not overload the source database. Because tasks are idempotent, rerunning old days is safe.

## Operations

The scheduler, the metadata database, the executor and the workers all need monitoring. Watch scheduler heartbeat, queued tasks, task duration and the age of the oldest running task. Run the metadata database with backups, because it holds run history.

```diagram
title: Batch orchestration with Airflow
node: dag | DAG definition | 0 | 1 | Tasks and schedule. | Heavy parsing. | process
node: sch | Scheduler | 1 | 1 | Creates runs. | Heartbeat lost. | service
node: wrk | Workers | 2 | 1 | Run tasks. | Slots full. | process
node: meta | Metadata database | 3 | 1 | Run history. | Not backed up. | store
edge: dag | sch
edge: sch | wrk
edge: wrk | meta
```

## Incident: A retry that doubled yesterday revenue

> **Incident:** A failed load task retried and appended rows a second time.

```console
$ psql -h warehouse -c "select dt, count(*) from fact_sales where dt = '2026-11-20' group by dt"
 dt         | count
 2026-11-20 | 2408812
(this is a simulated illustration, not a real incident)
```

The task appended rows each time it ran, so a retry after a timeout loaded the same day twice and the report showed double revenue. The team changed the task to overwrite the date partition, added a row count check against the source and marked the load task as idempotent in the DAG documentation.

## Common mistakes

- Append only tasks that cannot be retried
- Heavy imports at the top of DAG files
- No timeouts on tasks
- Backfills with no concurrency limit
- No backup of the metadata database

```quiz
Q: What does idempotent mean for a task?
+ Running it twice gives the same result
- It runs once only :: No.
- It never fails :: No.
- It is fast :: No.
> Safe retries and backfills.

Q: What is the logical date of a run?
+ The data interval it processes
- The time it started :: Not the meaning.
- The server time :: No.
- The deploy date :: No.
> It names the data, not the clock.

Q: Why limit backfill concurrency?
+ To avoid overloading source systems
- To make it slower :: Side effect only.
- To save disk :: No.
- To change data :: No.
> Use max active runs and pools.

Q: What should be monitored?
+ Scheduler heartbeat, queued tasks and task duration
- Only CPU :: Not enough.
- Only logs :: Not enough.
- Only DAG count :: Not enough.
> Orchestrators fail quietly.
```

```cards
DAG :: A directed acyclic graph of tasks
Idempotent task :: A task that is safe to run again
Backfill :: Rerunning past intervals
Sensor :: A task that waits for a condition
```
