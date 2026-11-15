---
title: Connection pooling and capacity
minutes: 12
summary: Size connections and memory, use PgBouncer pooling modes correctly, and recognise saturation before applications see errors.
---

A database does not slow down gradually when connections grow: it hits a wall. Pooling and capacity limits keep you on the right side of it.

## What you will learn

- Why connections are expensive
- Pool modes: session, transaction and statement
- Sizing the pool and max_connections
- Memory: shared buffers, work_mem and per connection costs
- Saturation signals

## Cost of connections

In PostgreSQL each connection is a process that uses memory and competes for CPU. Thousands of idle connections waste memory, and many active ones cause context switching. Applications that open a connection per request or per pod multiply the problem, especially during scale out.

## Pool modes

PgBouncer sits between applications and the database. In session mode a client keeps a server connection until it disconnects. In transaction mode it gets one only for the duration of a transaction, which allows thousands of clients to share a few dozen server connections. Transaction mode breaks features that need session state, such as session level advisory locks, `SET` and unnamed prepared statements without care.

## Sizing

The number of useful active connections is roughly a small multiple of the CPU cores, often between two and four times. More just queues. Set the pool size to that number, leave room for administrators and replication, and set `max_connections` above the total of all pools plus a margin.

## Memory

`shared_buffers` is often set to about a quarter of RAM. `work_mem` is allocated per sort or hash operation per connection, so a large value with many connections can exhaust memory. Raise it for specific queries or roles, not globally, and watch for the operating system killing the database.

## Saturation signals

Watch active versus idle connections, connections waiting in the pool, query queue time, lock waits and CPU. The first sign is rising wait time in the pool while the database CPU is moderate. Alerts should fire on waiting clients, not only on errors.

```diagram
title: Connection pooling and capacity
node: pods | Application pods | 0 | 1 | Many clients. | Pool per pod. | external
node: pool | PgBouncer | 1 | 1 | Shares connections. | Wrong mode. | process
node: db | PostgreSQL | 2 | 1 | Limited backends. | Memory exhaustion. | store
node: mon | Pool metrics | 3 | 1 | Waiting clients. | Not watched. | observe
edge: pods | pool
edge: pool | db
edge: db | mon
```

## Incident: Too many connections after a scale out

> **Incident:** Doubling the application pods made the database refuse new connections.

```console
$ psql -c "select state, count(*) from pg_stat_activity group by state"
 state  | count
 idle   | 870
 active | 24
$ psql -c "show max_connections"
 max_connections
 1000
(this is a simulated illustration, not a real incident)
```

Each pod kept ten idle connections and the new pods pushed the total to the limit while only 24 were doing work. PgBouncer in transaction mode with a pool of 40 connections replaced the per pod pools, and the application settings were changed to open fewer connections.

## Common mistakes

- Raising max_connections instead of pooling
- Transaction pooling with session state features
- Large global work_mem
- No alert on waiting clients
- A pool per pod with no total limit

```quiz
Q: Why are many connections costly?
+ Each is a process with memory and CPU overhead
- They are free :: No.
- They use no memory :: No.
- They speed queries :: No.
> Pool them. Review the matching section of this lesson if it is unclear.

Q: What does transaction mode allow?
+ Many clients sharing few server connections
- Session variables :: They break.
- No limits :: No.
- Bigger tables :: No.
> Be careful with session state.

Q: How big should the active pool be?
+ A small multiple of CPU cores
- Thousands :: Wasteful.
- One :: Too small.
- Zero :: Impossible.
> More just queues.

Q: What is a good early alert?
+ Clients waiting for a pool connection
- Disk colour :: No.
- Log size :: Late.
- Pod names :: No.
> Before errors appear.
```

```cards
PgBouncer :: A lightweight PostgreSQL connection pooler
Transaction pooling :: Assigning a server connection per transaction
work_mem :: Memory per sort or hash operation
Saturation :: A resource at its limit
```
