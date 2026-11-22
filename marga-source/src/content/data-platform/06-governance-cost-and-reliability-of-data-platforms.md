---
title: Governance, cost and reliability of data platforms
minutes: 12
summary: Run a data platform responsibly: access control and sensitive data, retention and deletion, cost control for storage and compute, and reliability targets for pipelines.
---

A data platform stores the most sensitive and the most expensive data in the company. Governance, cost and reliability decide whether people can trust and afford it.

## What you will learn

- Access control and sensitive data
- Retention, deletion and privacy requests
- Cost control for storage and compute
- Reliability targets for data products
- Platform operations and on call

## Access and sensitive data

Classify data as public, internal or sensitive and apply rules to each class. Use roles and groups instead of per person grants, column level and row level controls for sensitive fields, and masking or tokenisation for identifiers. Log who reads sensitive tables and review the logs.

## Retention and deletion

Keep data only as long as there is a reason to. Set retention per dataset, and make deletion work through every copy: raw files, derived tables, backups and caches. A privacy deletion request must be answerable with a list of where the person data lives, which lineage helps to build.

## Cost

Storage cost grows quietly: duplicate copies, old partitions and tiny files. Compute cost grows with unbounded queries and always on clusters. Use lifecycle rules to move cold data to cheaper storage, auto stop idle clusters, set query limits and show each team its own bill.

## Reliability

Treat important datasets as products with service levels: freshness within a time, completeness above a threshold and a stated recovery time. Measure them, report on them and spend an error budget the same way you would for a service. Keep pipelines idempotent so recovery is a rerun.

## Operations

Run an on call rotation for the platform with runbooks for stuck pipelines, lagging streams and failed loads. Review incidents without blame, track repeat causes and invest in the ones that cost the most analyst time.

```diagram
title: Governance, cost and reliability of data platforms
node: gov | Governance rules | 0 | 1 | Access and retention. | Over broad access. | security
node: cost | Cost controls | 1 | 1 | Lifecycle and limits. | Runaway queries. | observe
node: slo | Data SLOs | 2 | 1 | Freshness and recovery. | Unmeasured. | observe
node: ops | Platform on call | 3 | 1 | Runbooks. | No owner. | service
edge: gov | cost
edge: cost | slo
edge: slo | ops
```

## Incident: A query that cost more than the team monthly budget

> **Incident:** One analyst unbounded query scanned a petabyte of raw logs.

```console
$ bq query --dry_run --use_legacy_sql=false 'select count(*) from raw.events'
Query successfully validated. This query will process 1048576000000000 bytes.
(this is a simulated illustration, not a real incident)
```

There was no limit on bytes scanned and the raw table was not partitioned, so a full scan ran against the entire history. The platform team added a per user scan limit, partitioned the table by date, required a partition filter and showed dry run estimates in the query tool.

## Common mistakes

- Granting access per person instead of by role
- Deleting data from only one copy
- No lifecycle rules on object storage
- No per query cost limit
- No stated reliability target for key tables

```quiz
Q: Why use roles instead of per person grants?
+ They are easier to audit and change
- They are slower :: No.
- They hide data :: No.
- They cost more :: No.
> Access scales with groups.

Q: What must a deletion request cover?
+ Every copy including derived tables and backups
- Only the raw table :: Incomplete.
- Only the dashboard :: Incomplete.
- Only the cache :: Incomplete.
> Lineage helps find copies.

Q: How can query cost be limited?
+ Partitioning, required filters and per user scan limits
- More analysts :: No.
- Bigger clusters :: No.
- Longer retention :: No.
> Make expensive mistakes impossible.

Q: What is a data service level?
+ A measurable promise such as freshness within an hour
- A job name :: No.
- A table size :: No.
- A color :: No.
> Measure and report it.
```

```cards
Row level security :: Limiting which rows a user can read
Retention :: How long data is kept
Lifecycle rule :: An automatic move or delete by age
Data SLO :: A measurable target for a dataset
```
