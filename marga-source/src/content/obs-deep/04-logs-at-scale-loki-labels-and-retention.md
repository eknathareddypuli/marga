---
title: Logs at scale: Loki, labels and retention
minutes: 12
summary: Design a log pipeline that stays affordable, using low cardinality labels, structured fields, sensible retention and queries that filter early.
---

Logs are the most expensive signal to keep and the one people search under stress. A cost aware design uses a few stable labels, structured content and tiered retention.

## What you will learn

- How Loki indexes labels and stores log lines
- Choosing labels: few and stable
- LogQL basics and filtering early
- Retention, tiers and sampling
- Linking logs to traces and metrics

## Index labels, not content

Loki indexes only labels such as namespace, app and level, and stores the log text compressed in chunks. This keeps cost low but means every query narrows by labels first and then filters the text. A good label has a small set of values that does not change per request.

## Labels to avoid

Do not use user ids, request ids or pod names with churn as labels. Each unique combination creates a new stream, and thousands of tiny streams make ingestion slow and queries costly. Put such values in the log line as structured fields and filter them at query time.

## LogQL basics

A query starts with a stream selector such as `{app="api", env="prod"}`, then filters with `|= "error"` or parses with `| json`. Filter lines first and parse later, because parsing every line is expensive. Metrics from logs, such as `rate({app="api"} |= "error" [5m])`, support alerts where no counter exists.

## Retention and tiers

Keep recent logs on fast storage and older logs in cheap object storage with a retention period per tenant or stream. Audit and security logs may need a longer period, while debug logs may need a day. Sample or drop noisy health check lines at the agent.

## Correlation

Add a trace id to each log line and configure the data source to link it to the trace view. From a spike in a metric you can then jump to logs of that service and onward to a single slow trace.

```diagram
title: Logs at scale: Loki, labels and retention
node: agent | Log agent | 0 | 1 | Adds labels, ships lines. | Too many labels. | observe
node: dist | Distributor | 1 | 1 | Validates and routes. | Rate limited. | process
node: ing | Ingester and index | 2 | 1 | Builds chunks. | Stream explosion. | service
node: obj | Object storage | 3 | 1 | Chunks and retention. | Cost growth. | store
edge: agent | dist
edge: dist | ing
edge: ing | obj
```

## Incident: Logs rejected for too many streams

> **Incident:** A new label caused Loki to reject writes and logs went missing during an outage.

```console
$ logcli series '{app="api"}' --analyze-labels | head -4
Label Name  Unique Values  Found In Streams
pod_uid     48211          48211
env         3              48211
(this is a simulated illustration, not a real incident)
```

The agent added the pod uid as a label, so every restart created a new stream and the limit on active streams was hit. Removing that label and keeping app, env and namespace restored ingestion.

## Common mistakes

- Using request or user ids as labels
- Keeping all logs at the same retention
- Parsing every line before filtering
- Logging unstructured text that is hard to query
- No link between logs and traces

```quiz
Q: What does Loki index?
+ Labels
- Full text :: It indexes labels only.
- Every word :: That is another design.
- Trace ids only :: Not only.
> Content is stored compressed.

Q: Which makes a poor label?
+ A request id
- namespace :: Stable and small.
- app :: Stable and small.
- env :: Stable and small.
> Unbounded values create streams.

Q: How should a query start?
+ With a label selector, then line filters
- With a regex over everything :: Slow.
- With a parse :: Expensive on all lines.
- With a time sort :: Not a filter.
> Narrow early. Review the matching section of this lesson if it is unclear.

Q: How do you save storage cost?
+ Tiered retention and dropping noisy lines at the agent
- Longer retention :: Costs more.
- More labels :: Costs more.
- No compression :: Costs more.
> Match retention to value.
```

```cards
Stream :: A unique combination of labels in Loki
LogQL :: The query language of Loki
Chunk :: A compressed block of log lines
Cardinality :: The number of distinct label combinations
```
