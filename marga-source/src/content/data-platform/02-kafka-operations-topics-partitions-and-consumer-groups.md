---
title: Kafka operations: topics, partitions and consumer groups
minutes: 13
summary: Operate Kafka safely: partitions and ordering, replication and min in sync replicas, consumer groups and lag, retention and the failures that cause data loss.
---

Kafka is the backbone of many data platforms. It is reliable when its settings match the promise you make to producers and consumers, and painful when they do not.

## What you will learn

- Topics, partitions and ordering
- Replication, acks and min.insync.replicas
- Consumer groups, offsets and lag
- Retention and compaction
- Capacity and rebalancing

## Topics and partitions

A topic is split into partitions, and order is guaranteed only inside one partition. Messages with the same key go to the same partition, so choose keys that keep related events together. The number of partitions limits how many consumers in a group can read in parallel and is hard to reduce later.

## Durability settings

Each partition has a leader and followers. With `acks=all` a write is confirmed after the in sync replicas have it. Set `replication.factor=3` and `min.insync.replicas=2` so the loss of one broker neither loses data nor stops writes. With `acks=1` a leader crash can lose acknowledged messages.

## Consumer groups and lag

Consumers in a group share partitions, and each commits the offset it has processed. Lag is the gap between the newest message and the committed offset. Rising lag means consumers are too slow, stuck or rebalancing, so alert on lag and on its trend.

## Retention and compaction

Retention deletes data by age or size, for example seven days. Log compaction keeps the latest value for each key and suits changelog topics. A consumer that is down longer than the retention period loses messages it never read.

## Capacity and rebalancing

Watch disk, network and request latency per broker. Adding brokers does not move data by itself, so run a partition reassignment with throttling to avoid starving normal traffic. Spread leaders evenly and keep brokers in different racks or zones.

```diagram
title: Kafka operations: topics, partitions and consumer groups
node: prod | Producers | 0 | 1 | Send with keys. | acks=1. | external
node: brk | Broker cluster | 1 | 1 | Replicated partitions. | Under replicated. | store
node: grp | Consumer group | 2 | 1 | Reads and commits. | Lag. | process
node: mon | Lag and ISR alerts | 3 | 1 | Detect trouble. | Not watched. | observe
edge: prod | brk
edge: brk | grp
edge: grp | mon
```

## Incident: Consumers fell behind and then lost messages

> **Incident:** A consumer group was down over a weekend and its offsets expired from the topic.

```console
$ kafka-consumer-groups.sh --bootstrap-server broker1:9092 --describe --group billing
GROUP    TOPIC    PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
billing  invoices 0          0               482113          482113
(this is a simulated illustration, not a real incident)
```

Retention on the topic was two days and the group was down for three, so the oldest messages were deleted before they were read and the group restarted from the earliest available offset. The team raised retention to seven days for billing topics and added an alert on lag older than one hour.

## Common mistakes

- acks=1 for important data
- min.insync.replicas of 1
- Too few partitions to scale consumers
- No alert on consumer lag
- Reassigning partitions without a throttle

```quiz
Q: What keeps order in Kafka?
+ Messages with the same key in one partition
- One topic only :: Order is per partition.
- More consumers :: No.
- Compaction :: No.
> Ordering is per partition.

Q: Which settings protect against losing one broker?
+ replication factor 3 and min in sync replicas 2 with acks all
- acks equals zero :: Unsafe.
- One replica :: Unsafe.
- Larger batches :: Not durability.
> Write only when enough replicas have it.

Q: What does rising consumer lag mean?
+ Consumers are slower than producers or stuck
- More disk :: No.
- Faster network :: No.
- Fewer topics :: No.
> Alert on lag and its trend.

Q: What happens if a group is down longer than retention?
+ It can lose unread messages
- Nothing :: Data is deleted.
- Messages are duplicated :: No.
- Offsets reset to latest only :: Depends, data is lost.
> Set retention longer than the worst outage.
```

```cards
Partition :: An ordered slice of a topic
Consumer lag :: Messages not yet processed by a consumer group
ISR :: The set of in sync replicas
Compaction :: Keeping the latest value per key
```
