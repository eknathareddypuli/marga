---
title: Async Rust with Tokio and network services
minutes: 13
summary: Write concurrent network code with async and await on Tokio, use channels and timeouts, avoid blocking the runtime and build a small HTTP service.
---

Network tools such as proxies, exporters and agents spend most of their time waiting. Async Rust handles thousands of connections on a few threads, if you follow a few rules.

## What you will learn

- Futures, async and await
- The Tokio runtime and tasks
- Timeouts, cancellation and select
- Channels and shared state
- Blocking calls and a small HTTP service

## Futures

An `async fn` returns a future, a value that does nothing until it is awaited. `await` pauses the function until the result is ready and lets other tasks run. Futures are lazy, so forgetting to await a call means it never runs, and the compiler warns about it.

## Tokio

Tokio provides a runtime that schedules tasks over a pool of threads. `#[tokio::main]` starts it, and `tokio::spawn` runs a future as a separate task. Tasks are cheap, so spawn one per connection. Use Tokio versions of file, network and timer operations.

## Timeouts and cancellation

Wrap remote calls in `tokio::time::timeout`, because a network call without one can wait forever. Dropping a future cancels it, so be careful about work that must not stop halfway. `tokio::select!` waits for the first of several futures, for example a request or a shutdown signal.

## Channels and state

Tasks communicate through channels such as `mpsc`, which avoids sharing memory. When you do share state, wrap it in `Arc<Mutex<T>>` and keep the lock short and never hold it across an await. For counters prefer atomics.

## Blocking and HTTP

A blocking call such as a heavy computation or a synchronous file read stops a worker thread and starves other tasks. Run it with `spawn_blocking`. For HTTP, `axum` builds services from handler functions, and `reqwest` is a client. Add graceful shutdown so in-flight requests finish before exit.

```diagram
title: Async Rust with Tokio and network services
node: req | Incoming requests | 0 | 1 | Many connections. | Overload. | external
node: rt | Tokio runtime | 1 | 1 | Schedules tasks. | Blocked threads. | process
node: task | Tasks and channels | 2 | 1 | Concurrent work. | Lock held across await. | service
node: shut | Graceful shutdown | 3 | 1 | Finishes requests. | Abrupt exit. | service
edge: req | rt
edge: rt | task
edge: task | shut
```

## Incident: A service that froze under load

> **Incident:** An exporter stopped answering health checks when one handler read a large file.

```console
$ curl -s -m 2 localhost:9100/health; echo "exit=$?"
exit=28
$ grep -n "std::fs::read" src/*.rs
src/handlers.rs:22:    let data = std::fs::read(path).unwrap();
(this is a simulated illustration, not a real incident)
```

The handler used a blocking file read on the runtime thread, so with a few slow reads all workers were busy and health checks timed out. Using tokio::fs and spawn_blocking for the heavy parse restored responsiveness.

## Common mistakes

- Blocking calls on the runtime
- No timeout on network calls
- Holding a mutex across an await
- Spawning unbounded tasks without limits
- No graceful shutdown

```quiz
Q: When does an async fn run?
+ When its future is awaited or spawned
- When defined :: Futures are lazy.
- At compile time :: No.
- Never :: It does run.
> Futures are lazy.

Q: What does spawn_blocking do?
+ Runs blocking work on a separate thread pool
- Speeds up the network :: No.
- Cancels tasks :: No.
- Adds timeouts :: No.
> Protect the runtime.

Q: What does select do?
+ Waits for the first of several futures
- Waits for all :: That is join.
- Sorts :: No.
- Locks :: No.
> Use for shutdown.

Q: What is a good rule for mutexes?
+ Keep the lock short and not across an await
- Hold it always :: Deadlocks.
- Never lock :: Needed sometimes.
- Lock twice :: No.
> Prefer channels.
```

```cards
Future :: A value representing work that will complete later
Tokio :: The most used async runtime for Rust
Task :: A unit of async work scheduled on the runtime
Channel :: A queue for passing messages between tasks
```
