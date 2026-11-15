---
title: Redis and MongoDB operations
minutes: 12
summary: Operate Redis and MongoDB: persistence, memory and eviction for Redis, replica sets, sharding and indexes for MongoDB, and the failure modes of each.
---

Not every system uses PostgreSQL. Redis and MongoDB appear in most estates, and each has its own durability and capacity rules that operators must know.

## What you will learn

- Redis persistence: RDB and AOF
- Redis memory, eviction and big keys
- Redis replication, Sentinel and Cluster
- MongoDB replica sets and write concern
- MongoDB indexes, sharding and backups

## Redis persistence

Redis keeps data in memory. RDB snapshots write the dataset at intervals and are compact but can lose recent writes. The append only file logs each write and can fsync every second, which limits loss to about a second. Many caches use no persistence, and the team must know which data can be lost.

## Memory and eviction

Set `maxmemory` below the machine memory with room for fork and copy on write during snapshots. The eviction policy decides what happens when it is full: `allkeys-lru` suits caches, while `noeviction` makes writes fail, which is right for data you must not lose. Find big keys and unbounded lists with `redis-cli --bigkeys` or memory analysis.

## Redis availability

A primary with replicas can be managed by Sentinel, which monitors and promotes a replica, or by Redis Cluster, which shards keys over many primaries by hash slot. Replication is asynchronous, so a failover can lose recent writes. Clients must handle redirections and reconnects.

## MongoDB replica sets

A replica set has a primary and secondaries, and elects a new primary when it fails with a majority vote, so use three or more voting members. Write concern `majority` waits until most members have the write, which protects it from rollback. Read preference controls whether reads may go to secondaries.

## Indexes, sharding and backups

Queries without an index scan the whole collection. Check slow queries with the profiler and `explain`, and keep indexes few and useful. Sharding splits a collection across shards by a shard key. A poor key causes hot spots, so choose one with high cardinality and even distribution. Back up with snapshots or `mongodump` consistent with the oplog, and test restores.

```diagram
title: Redis and MongoDB operations
node: app | Applications | 0 | 1 | Read and write. | No reconnect logic. | external
node: redis | Redis | 1 | 1 | Memory store. | Eviction or loss. | store
node: mongo | MongoDB replica set | 2 | 1 | Primary and secondaries. | Rollback. | store
node: bk | Backups and monitoring | 3 | 1 | Snapshots and alerts. | Untested. | observe
edge: app | redis
edge: app | mongo
edge: mongo | bk
```

## Incident: A cache that evicted the sessions

> **Incident:** Users were logged out when Redis reached its memory limit and removed session keys.

```console
$ redis-cli info memory | grep -E "used_memory_human|maxmemory_human|maxmemory_policy"
used_memory_human:7.98G
maxmemory_human:8.00G
maxmemory_policy:allkeys-lru
(this is a simulated illustration, not a real incident)
```

Sessions and cache entries shared one instance with an eviction policy meant for caches, so sessions were removed under pressure. The team separated sessions into their own instance with noeviction and alerts at eighty percent memory, and left the cache with allkeys-lru.

## Common mistakes

- Mixing caches and primary data in one Redis
- No maxmemory with snapshots enabled
- Two member MongoDB replica sets
- A shard key with low cardinality
- No tested restore

```quiz
Q: What does allkeys-lru do?
+ Evicts least recently used keys when memory is full
- Stops writes :: That is noeviction.
- Deletes all keys :: No.
- Encrypts keys :: No.
> Suits caches. Review the matching section of this lesson if it is unclear.

Q: Why use three MongoDB members?
+ To elect a primary with a majority
- To save disk :: No.
- To speed reads only :: Not the reason.
- To avoid indexes :: No.
> Majority voting.

Q: What does write concern majority give?
+ Protection from rollback after failover
- Faster writes :: Slower.
- No replication :: No.
- Larger data :: No.
> Wait for most members.

Q: What is a good shard key property?
+ High cardinality and even distribution
- Few values :: Hot spots.
- Always increasing :: Hot spot on one shard.
- Random text only :: Not specific.
> Avoid hot spots.
```

```cards
RDB :: Redis point in time snapshot
AOF :: Redis append only file of writes
Replica set :: MongoDB group of nodes with one primary
Shard key :: The field that decides data placement in a sharded collection
```
