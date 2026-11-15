---
title: Concurrency: threads, asyncio and processes
minutes: 13
summary: Choose between threads, asyncio and processes for operations work, limit concurrency with a semaphore and avoid shared state mistakes.
---

Checking a thousand hosts one by one takes forever. Concurrency helps, but the right kind depends on whether the work waits on the network or burns CPU.

## What you will learn

- I/O bound versus CPU bound
- Threads for simple parallel I/O
- asyncio and the event loop
- Processes for CPU work
- Limits, errors and cancellation

## Two kinds of work

I/O bound work waits for networks, disks and APIs, so many tasks can overlap. CPU bound work uses the processor, such as compressing or parsing large data. The global interpreter lock lets only one thread run Python code at a time, so threads speed up I/O but not CPU work.

## Threads

A `ThreadPoolExecutor` runs a function over many inputs with a fixed number of workers and is the simplest way to parallelise blocking calls such as SSH or HTTP. Keep functions independent, return results rather than mutating shared lists and set a worker limit.

## asyncio

`asyncio` runs many tasks on one thread by switching at `await` points. It scales to thousands of connections but needs async libraries, and one blocking call stalls everything. Use `asyncio.gather` to run tasks together and `asyncio.run` to start.

## Processes

`ProcessPoolExecutor` uses separate processes and so separate interpreters, which gives real parallelism for CPU bound work. Arguments and results must be picklable, and starting processes has a cost, so use them for heavy tasks.

## Limits and errors

Unlimited concurrency overloads the target and your own file descriptors. Use a semaphore or the pool size to limit it. Collect exceptions per task so one failure does not hide the others, and set timeouts so a stuck task does not block the run.

```diagram
title: Concurrency: threads, asyncio and processes
node: in | Work items | 0 | 1 | Many hosts. | Unbounded. | external
node: pool | Pool or event loop | 1 | 1 | Limited workers. | Too many. | process
node: work | Tasks | 2 | 1 | I/O or CPU. | Wrong model. | process
node: res | Collected results | 3 | 1 | Per task errors. | Lost errors. | store
edge: in | pool
edge: pool | work
edge: work | res
```

## Incident: A health check that opened too many connections

> **Incident:** A script checking 3000 hosts at once exhausted file descriptors and failed halfway.

```console
$ ulimit -n
1024
$ python check_all.py
OSError: [Errno 24] Too many open files
(this is a simulated illustration, not a real incident)
```

The script started every check at once. The team added a semaphore of 50 concurrent checks, set a per host timeout and collected failures into a report instead of stopping at the first exception.

## Common mistakes

- Threads for CPU heavy work
- Blocking calls inside async code
- Unlimited concurrency
- Shared mutable state between threads
- No timeouts per task

```quiz
Q: When do threads help?
+ For I/O bound work
- Only CPU work :: The GIL limits it.
- Never :: Wrong.
- Only math :: Wrong.
> Waiting overlaps.

Q: What helps CPU bound work?
+ Multiple processes
- More threads :: GIL limits.
- asyncio :: Single thread.
- Sleeping :: No.
> Real parallelism.

Q: What does a semaphore do here?
+ Limits concurrent tasks
- Speeds a task :: No.
- Encrypts :: No.
- Stores results :: No.
> Protects targets and descriptors.

Q: What breaks an event loop?
+ A blocking call
- An await :: Normal.
- A task :: Normal.
- A print :: Minor.
> Everything stalls.
```

```cards
GIL :: Lock allowing one thread to run Python code at a time
asyncio :: Library for single thread concurrency
Semaphore :: A counter that limits concurrent access
Executor :: A pool that runs functions in workers
```
