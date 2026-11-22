---
title: Spark and distributed processing for operators
minutes: 13
summary: Understand how Spark runs a job, why shuffles and skew hurt, how to size executors and memory, and how to read the Spark UI to find the real bottleneck.
---

You do not need to write every Spark job to operate the platform that runs them. You need to know where time and memory go, and how to tell a bad query from a bad cluster.

## What you will learn

- Driver, executors, stages and tasks
- Shuffles and why they are expensive
- Skew and small files
- Memory, executors and dynamic allocation
- Reading the Spark UI

## How a job runs

The driver turns code into a plan, splits it into stages and sends tasks to executors. A stage ends where data must be moved between machines. Narrow steps such as filters run in place, while wide steps such as joins and group by need a shuffle.

## Shuffles

A shuffle writes data to disk, sends it over the network and reads it back. It is usually the slowest part of a job. Reduce it by filtering early, using broadcast joins for small tables and choosing the right number of shuffle partitions.

## Skew and small files

Skew means a few keys hold most of the data, so one task runs for an hour while the others finish in seconds. Salting keys or adaptive query execution can spread the load. Thousands of tiny files make planning and reading slow, so compact them into files of a few hundred megabytes.

## Memory and executors

An executor out of memory is often caused by a skewed partition, a large collect to the driver or too many cores sharing one heap. Right size cores and memory per executor, use dynamic allocation to release idle executors and set spill and overhead memory with care.

## The Spark UI

The stages tab shows task duration spread, shuffle read and write and spilled data. If the slowest task is far above the median, suspect skew. If many tasks spill to disk, memory is too small. If tasks wait for executors, the cluster is the limit, not the code.

```diagram
title: Spark and distributed processing for operators
node: drv | Driver | 0 | 1 | Plans the job. | Out of memory. | process
node: exe | Executors | 1 | 1 | Run tasks. | Lost executors. | process
node: shf | Shuffle | 2 | 1 | Moves data. | Skew. | store
node: ui | Spark UI and metrics | 3 | 1 | Shows bottlenecks. | Ignored. | observe
edge: drv | exe
edge: exe | shf
edge: shf | ui
```

## Incident: One task ran for three hours

> **Incident:** A nightly join was stuck on a single task while the rest of the cluster sat idle.

```console
$ curl -s http://spark-history:18080/api/v1/applications/app-2026/stages/7/taskSummary | head -c 300
{"quantiles":[0.05,0.25,0.5,0.75,0.95],"duration":[1200,1400,1900,2600,10800000]}
(this is a simulated illustration, not a real incident)
```

The median task took two seconds and the slowest took three hours because one customer id held most of the rows. Enabling adaptive skew handling and salting the key for that join spread the work and brought the stage down to a few minutes.

## Common mistakes

- Adding executors to fix a skewed join
- Collecting large data to the driver
- Thousands of small files
- No history server or metrics
- Setting shuffle partitions once for all jobs

```quiz
Q: What starts a new stage?
+ A shuffle between machines
- A filter :: Narrow step.
- A comment :: No.
- A variable :: No.
> Wide steps need data movement.

Q: What does skew look like in the UI?
+ One task far slower than the median
- All tasks equal :: Not skew.
- No tasks :: No.
- Fast shuffle :: No.
> Compare max with median.

Q: When is a broadcast join useful?
+ When one side of the join is small
- Both sides huge :: Not suitable.
- No joins :: Not relevant.
- Only for text :: No.
> It avoids a shuffle of the large side.

Q: Why compact small files?
+ Many tiny files slow planning and reads
- To increase shuffles :: Opposite.
- To lose data :: No.
- To change schema :: No.
> Aim for files of hundreds of megabytes.
```

```cards
Shuffle :: Moving data between executors
Skew :: Uneven distribution of data over keys
Broadcast join :: Sending a small table to every executor
Spill :: Writing data to disk when memory is full
```
