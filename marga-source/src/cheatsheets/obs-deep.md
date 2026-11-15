---
title: Observability in depth
summary: PromQL patterns, burn rate pairs and rule checks.
module: obs-deep
---

## PromQL patterns

| Goal | Query |
|------|-------|
| Request rate | `sum(rate(http_requests_total[5m])) by (service)` |
| Error ratio | `sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` |
| p99 latency | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` |
| Series count | `count({__name__=~".+"})` |

## Burn rate pairs

| Severity | Long window | Short window | Rate |
|----------|-------------|--------------|------|
| Page | 1 hour | 5 minutes | 14.4 |
| Page | 6 hours | 30 minutes | 6 |
| Ticket | 3 days | 6 hours | 1 |

## Checks

| Check | Command |
|-------|---------|
| Validate rules | `promtool check rules rules.yml` |
| Test rules | `promtool test rules tests.yml` |
| Label values | `logcli labels` |
