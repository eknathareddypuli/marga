---
title: Scaling Prometheus: HA, federation and long-term storage
minutes: 13
summary: Run Prometheus reliably at scale with replicas, sharding and remote write, and choose between Thanos, Mimir and federation for long retention.
---

A single Prometheus is easy to start and hard to keep happy as series counts grow. Scaling means choosing how to make it highly available, how to split the load and where to keep long-term data.

## What you will learn

- What limits a single Prometheus: series, scrape load and memory
- High availability with replicas and deduplication
- Sharding and federation, and when each fits
- Remote write and long-term storage with Thanos or Mimir
- Capacity signals to watch

## What limits one server

Memory use is driven mostly by active series, and each series costs a few kilobytes. Query load and the write ahead log also matter. A server with a few million active series needs tens of gigabytes. Watch `prometheus_tsdb_head_series` and scrape duration to see headroom before it runs out.

## High availability

Run two identical replicas that scrape the same targets. Each has its own data, so a failure of one does not lose recent metrics. Alertmanager deduplicates alerts from both. Queries use a proxy such as Thanos Query that merges and deduplicates the replicas.

## Sharding and federation

When one server cannot hold all series, shard targets across servers by a hash or by team. Federation lets a global server scrape selected aggregated series from others, which suits a summary view. It does not replace long-term storage, and federating raw series defeats the purpose.

## Long-term storage

Thanos sidecars upload blocks to object storage and a store gateway serves them back for queries. Mimir and similar systems accept remote write and store data centrally with horizontal scaling. Both give months of retention at lower cost, and both need downsampling and compaction settings you must understand.

## Capacity signals

Alert on head series growth, WAL replay time, rejected samples and slow rule evaluations. A cardinality explosion from a new label is the most common cause of sudden trouble, so keep a dashboard of the top series by metric name.

```diagram
title: Scaling Prometheus: HA, federation and long-term storage
node: t | Targets | 0 | 1 | Expose metrics. | Cardinality growth. | service
node: p | Prometheus replicas | 1 | 1 | Scrape and store. | Out of memory. | observe
node: q | Query layer | 2 | 1 | Merges and deduplicates. | Slow fan out. | process
node: o | Object storage | 3 | 1 | Long term blocks. | Missing blocks. | store
edge: t | p
edge: p | q
edge: p | o
edge: o | q
```

## Incident: The label that added ten million series

> **Incident:** A deployment added a per-request id as a label and Prometheus ran out of memory in an hour.

```console
$ curl -s localhost:9090/api/v1/status/tsdb | head -c 220
{"status":"success","data":{"headStats":{"numSeries":11800000,"numLabelPairs":15900000},"seriesCountByMetricName":[{"name":"http_requests_total","value":10400000}]}}
(this is a simulated illustration, not a real incident)
```

The request id label created a new series for every request. The label was dropped with a relabel rule, the server was restarted from its last good state and a limit on samples per scrape was added so one target cannot do this again.

## Common mistakes

- Running one server with no replica for critical alerts
- Federating raw series instead of aggregates
- Ignoring series growth until memory runs out
- Keeping long retention on local disk only
- Adding labels with unbounded values

```quiz
Q: How does HA work for Prometheus?
+ Two replicas scrape the same targets and the query layer deduplicates
- Shared disk :: Replicas keep separate storage.
- One leader writes :: Prometheus has no leader.
- Replication by Raft :: It does not use Raft.
> Replicas are independent.

Q: What mostly drives Prometheus memory use?
+ Active series
- Dashboard count :: Dashboards use queries, not memory.
- Alert count :: Rules cost CPU more than memory.
- Retention days :: It affects disk more than memory.
> Watch head series.

Q: What is Thanos used for?
+ Long term storage and global querying over object storage
- Log search :: It handles metrics.
- Tracing :: It does not trace.
- Service discovery :: Prometheus handles that.
> Blocks go to object storage.

Q: What is a common cause of sudden series growth?
+ A new label with unbounded values
- More dashboards :: They do not add series.
- A longer retention :: It does not add series.
- A new alert :: Alerts do not add series.
> Cardinality is the main risk.
```

```cards
Active series :: Distinct time series currently held in memory
Federation :: One Prometheus scraping aggregated series from another
Remote write :: Sending samples to a central store
Downsampling :: Reducing resolution of old data to save space
```
