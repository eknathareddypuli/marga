---
title: Lakes, warehouses and lakehouses: architecture
minutes: 13
summary: Understand how a data platform is layered, the difference between a lake, a warehouse and a lakehouse, and the table formats and zones that keep data usable.
---

A data platform moves data from the systems that create it to the people and models that use it. The shape of the storage layer decides cost, speed and how painful change will be.

## What you will learn

- Sources, ingestion, storage, processing and serving
- Warehouse, lake and lakehouse compared
- Open table formats: Iceberg and Delta
- Zones: raw, cleaned and curated
- Batch and streaming paths

## Layers

Sources are applications, databases and event streams. Ingestion copies them into storage with tools such as change data capture or file loads. Processing cleans and joins data. Serving exposes tables to analysts, dashboards and models. Each layer should be observable and owned by a named team.

## Warehouse, lake, lakehouse

A warehouse stores structured tables with strong performance and governance, but storage and compute are often tied together. A lake keeps files of any shape in cheap object storage, but without rules it becomes a swamp. A lakehouse puts table semantics, transactions and schema on top of object storage so one copy of data serves both styles.

## Table formats

Apache Iceberg and Delta Lake add a metadata layer over files in object storage. They give atomic commits, schema evolution, time travel and file level pruning. Without such a format, two jobs writing the same folder can leave readers with half written data.

## Zones

A common layout has a raw zone that keeps data exactly as received, a cleaned zone with typed and deduplicated tables, and a curated zone with business ready models. Raw data is never edited, so any later layer can be rebuilt after a bug is fixed.

## Batch and streaming

Batch jobs process large sets on a schedule and are simple and cheap. Streaming processes events as they arrive and gives fresh results at higher complexity. Many platforms use batch for most tables and streaming only where freshness has real value.

```diagram
title: Lakes, warehouses and lakehouses: architecture
node: src | Sources | 0 | 1 | Apps and databases. | Schema change. | external
node: ing | Ingestion | 1 | 1 | CDC and loads. | Lag. | process
node: lake | Object storage tables | 2 | 1 | Iceberg or Delta. | Small files. | store
node: srv | Serving layer | 3 | 1 | Marts and APIs. | Stale data. | service
edge: src | ing
edge: ing | lake
edge: lake | srv
```

## Incident: A dashboard that showed half of yesterday

> **Incident:** Two jobs wrote to the same folder and a report read partial files.

```console
$ aws s3 ls s3://corp-lake/curated/orders/dt=2026-11-20/ --summarize | tail -2
Total Objects: 187
   Total Size: 4.1 GiB
(this is a simulated illustration, not a real incident)
```

A compaction job and a load job wrote to the same partition while a dashboard query ran, so the report counted some files twice and missed others. Moving the tables to Iceberg gave atomic commits, so readers see either the old snapshot or the new one, never a mix.

## Common mistakes

- Writing files straight into folders that others read
- Editing raw data in place
- No owner for each table
- Everything streaming when batch is enough
- Many tiny files that slow every query

```quiz
Q: What does a table format such as Iceberg add?
+ Atomic commits, schema evolution and time travel over files
- A new database server :: It sits on object storage.
- Faster disks :: It is a metadata layer.
- Encryption only :: That is not its purpose.
> Metadata turns files into reliable tables.

Q: Why keep a raw zone?
+ So later layers can be rebuilt after a bug fix
- To save money :: It adds storage.
- To hide data :: No.
- To speed queries :: No.
> Raw data is the source of truth.

Q: What is a lakehouse?
+ Table semantics and transactions on object storage
- A building :: No.
- A backup tool :: No.
- A message queue :: No.
> One copy serves several workloads.

Q: When is streaming worth the cost?
+ When fresh results have real value
- Always :: It is costly.
- Never :: Sometimes needed.
- For archives :: No.
> Batch is simpler and cheaper.
```

```cards
Lakehouse :: Table semantics over object storage
Iceberg :: An open table format for large tables
CDC :: Change data capture from a database log
Medallion :: Raw, cleaned and curated layers
```
