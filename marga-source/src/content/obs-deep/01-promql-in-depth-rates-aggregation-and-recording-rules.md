---
title: PromQL in depth: rates, aggregation and recording rules
minutes: 13
summary: Write correct PromQL for counters, histograms and ratios, avoid the common rate and aggregation mistakes, and use recording rules to keep dashboards fast.
---

PromQL looks like a simple query language, but a handful of rules decide whether your graphs tell the truth. Counters, histograms and aggregation each have a correct pattern and a common wrong one.

## What you will learn

- How rate and increase handle counters and resets
- Aggregating without losing the labels you need
- Histogram quantiles and why you cannot average them
- Ratios, offsets and the staleness rules
- Recording rules for speed and consistency

## Counters and rate

A counter only goes up, so its raw value is rarely useful. Use `rate(metric[5m])` to get a per-second average and `increase(metric[1h])` for a total. The range window must hold at least two scrapes, so use four times the scrape interval or more. Always apply `rate` before `sum`: summing counters first hides resets and gives wrong answers.

## Aggregation and labels

`sum by (service)(rate(http_requests_total[5m]))` keeps only the service label. Use `by` to keep labels and `without` to drop a few. A ratio of two aggregations needs matching labels on both sides, or the division returns nothing. Check this when a query suddenly shows no data after a label change.

## Histograms and quantiles

Histogram buckets are counters, so use `histogram_quantile(0.99, sum by (le, service)(rate(latency_bucket[5m])))`. Keep the `le` label when aggregating. Never average pre-computed quantiles from several instances: the result has no meaning. Bucket boundaries limit accuracy, so choose them around your target latency.

## Staleness and gaps

A series that stops appearing is marked stale after five minutes, and a missing scrape leaves a gap. Alerts should use `for` durations and functions such as `absent()` or `up == 0` to catch missing data. A query that returns no result is not the same as zero.

## Recording rules

Expensive expressions evaluated by every dashboard refresh waste CPU. A recording rule computes them on a schedule and stores the result under a new name, such as `service:http_requests:rate5m`. Alerts and dashboards then read the cheap series and stay consistent.

```diagram
title: PromQL in depth: rates, aggregation and recording rules
node: app | Application | 0 | 1 | Exposes counters. | Counter resets. | service
node: prom | Prometheus | 1 | 1 | Scrapes and stores. | Slow queries. | observe
node: rule | Recording rules | 2 | 1 | Precompute series. | Stale results. | process
node: graf | Dashboards and alerts | 3 | 1 | Read cheap series. | Heavy queries. | observe
edge: app | prom
edge: prom | rule
edge: rule | graf
```

## Incident: A dashboard that averaged quantiles

> **Incident:** The p99 latency graph looked fine while customers complained about slow requests.

```console
$ curl -s localhost:9090/api/v1/query --data-urlencode 'query=avg(service_latency_p99_seconds)'
{"status":"success","data":{"result":[{"value":[1731600000,"0.21"]}]}}
$ curl -s localhost:9090/api/v1/query --data-urlencode 'query=histogram_quantile(0.99, sum by (le)(rate(latency_bucket[5m])))'
{"status":"success","data":{"result":[{"value":[1731600000,"1.84"]}]}}
(this is a simulated illustration, not a real incident)
```

The first query averaged the p99 of each instance, which is not the p99 of all requests. The second merges the buckets and shows a real p99 of 1.84 seconds. The dashboard was changed to use bucket aggregation and an alert was set on the correct value.

## Common mistakes

- Using rate on a gauge or summing before rate
- Averaging quantiles across instances
- Dropping le from a histogram aggregation
- Using a range window shorter than two scrapes
- Putting expensive queries on every dashboard instead of recording rules

```quiz
Q: What should you apply before sum on a counter?
+ rate or increase
- avg :: It does not handle resets.
- max :: It hides totals.
- nothing :: Raw sums hide resets.
> Rate first, then aggregate.

Q: How do you get a correct p99 across instances?
+ histogram_quantile over summed buckets with the le label kept
- avg of each p99 :: The average of quantiles is not a quantile.
- max of each p99 :: It overstates the value.
- sum of each p99 :: It has no meaning.
> Merge buckets, then compute the quantile.

Q: What is a good use of a recording rule?
+ Precompute an expensive expression used by many dashboards and alerts
- Store logs :: Prometheus does not store logs.
- Replace scraping :: Rules use scraped data.
- Delete series :: They only create series.
> It saves CPU and keeps results consistent.

Q: Why use a range window of at least four scrapes?
+ The window must contain enough samples for rate to be stable
- To increase retention :: Retention is separate.
- To reduce labels :: It has no effect on labels.
- To enable alerts :: Alerts do not need it.
> Too short a window gives gaps or noise.
```

```cards
rate :: Per-second average increase of a counter over a window
Recording rule :: A scheduled query whose result is stored as a new series
Histogram bucket :: A counter of observations at or below a boundary
Staleness :: Marking a series as gone when it stops being scraped
```
