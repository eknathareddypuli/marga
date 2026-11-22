---
title: Data platform engineering
summary: Platform layers, Kafka durability settings and quality checks.
module: data-platform
---

## Platform layers

| Layer | Examples |
|-------|----------|
| Ingest | CDC, file loads, Kafka |
| Store | Object storage with Iceberg or Delta |
| Process | Spark, SQL engines, dbt |
| Orchestrate | Airflow |
| Serve | Warehouse marts, APIs |

## Kafka durability

| Setting | Value |
|---------|-------|
| replication.factor | 3 |
| min.insync.replicas | 2 |
| acks | all |
| retention | longer than worst consumer outage |

## Quality checks

| Check | Question |
|-------|----------|
| Freshness | Updated on time? |
| Volume | Row count in range? |
| Schema | Columns as agreed? |
| Values | Nulls, duplicates, ranges? |

## Handy commands

```bash
kafka-consumer-groups.sh --bootstrap-server BROKER:9092 --describe --group GROUP
```

```bash
airflow dags list-runs -d DAG_ID
```

```bash
airflow tasks clear DAG_ID -s 2026-01-01 -e 2026-01-02
```

```bash
spark-submit --conf spark.sql.shuffle.partitions=200 job.py
```

```bash
kafka-topics.sh --bootstrap-server BROKER:9092 --describe --topic TOPIC
```

```bash
dbt test --select tag:critical
```

## Watch out for

> **Warning:** Do not delete or edit raw data, because every downstream fix depends on being able to replay it.

> **Warning:** A task that appends on retry will duplicate rows, so make tasks overwrite a partition or merge by key.

> **Warning:** Consumer lag that grows quietly turns into stale data, so alert on lag and age.

> **Warning:** A query without a partition filter can scan the whole table and cost a month of budget.
