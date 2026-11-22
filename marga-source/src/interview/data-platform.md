## Warehouse, lake or lakehouse?
level: mid
A warehouse is fast and governed, a lake is cheap and flexible, a lakehouse puts tables and transactions on object storage. I choose by workloads, skills and cost, and usually keep one copy of data.

## How do you make a pipeline safe to retry?
level: mid
Make each task idempotent: overwrite a partition or merge by key, record run metadata and check row counts, so retries and backfills never duplicate data.

## What do you watch on Kafka?
level: mid
Under replicated partitions, in sync replicas, consumer lag and its trend, disk and request latency per broker, and whether retention is longer than the worst consumer outage.

## How do you debug a slow Spark job?
level: senior
Open the stage view, compare the slowest task with the median for skew, look at shuffle and spill, then fix the query shape or key before adding executors.

## How do you keep data trustworthy?
level: mid
Freshness, volume and schema checks on critical tables, data contracts with producers, lineage to find affected reports and an owner who gets alerts with context.

## How do you control data platform cost?
level: mid
Lifecycle rules on storage, partitioning and scan limits, auto stop for idle clusters, and per team cost reports so the owners see their spend. I explain the trade-off, give a concrete example from my own work and say how I would check that the change really worked.
