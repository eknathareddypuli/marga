---
title: Observability as code and cost control
minutes: 12
summary: Manage dashboards, alerts and collectors from version control, set ownership and budgets for telemetry, and review cost against value.
---

Observability grows by accident when each team adds metrics and dashboards by hand. Treating it as code gives review, repeatability and a way to control cost.

## What you will learn

- Dashboards and alerts as code
- Collector pipelines in configuration
- Ownership, labels and budgets for telemetry
- Reading the cost by signal
- A review habit that prunes

## Dashboards and alerts as code

Store Grafana dashboards as JSON or generated from a library, and alert rules as files, in version control. Deploy them through a pipeline. Reviews catch broken queries and give every change an author. Hand edits in the UI are overwritten at the next deploy, so teams must know that.

## Collector pipelines

An OpenTelemetry Collector configuration lists receivers, processors and exporters. Use it to add resource attributes, drop noisy metrics, batch data and route to different backends. Keep the configuration in the same repository as the rules and test it with a staging collector.

## Ownership and budgets

Every metric, log stream and dashboard should have an owner label or folder. Give each team a budget in series, log gigabytes a day or trace spans a day, and show their usage next to it. Limits at the collector stop a single mistake from becoming a large bill.

## Reading cost by signal

Cost comes from active series for metrics, ingested gigabytes for logs and sampled spans for traces. Find the top ten contributors in each. Often a few metrics with unbounded labels or a chatty debug log make most of the cost.

## Pruning review

Each quarter, list dashboards with no views and alerts that never fired or always fire, and decide to delete or fix them. Track the telemetry cost per request or per customer so growth is visible against traffic.

```diagram
title: Observability as code and cost control
node: git | Repository | 0 | 1 | Rules and dashboards. | Hand edits. | external
node: ci | Pipeline | 1 | 1 | Validates and deploys. | No tests. | process
node: col | Collector | 2 | 1 | Limits and routes. | Bad config. | observe
node: cost | Cost report | 3 | 1 | Usage by owner. | No owner. | observe
edge: git | ci
edge: ci | col
edge: col | cost
```

## Incident: A dashboard edit that disappeared

> **Incident:** A team fixed a panel in the UI and the fix vanished the next day.

```console
$ git log --oneline -3 -- dashboards/payments.json
a1b2c3d Add latency panel
$ curl -s -u admin:$GRAFANA_PASS localhost:3000/api/dashboards/uid/payments | grep -c version
1
(this is a simulated illustration, not a real incident)
```

The dashboard is provisioned from the repository, so the UI edit was overwritten by the next deploy. The fix was committed as a pull request, and the provisioning settings now mark UI editing as disabled with a note linking to the repository.

## Common mistakes

- Editing provisioned dashboards by hand
- No owner on metrics and dashboards
- Never reviewing unused alerts
- Keeping debug logs at full volume in production
- Treating telemetry cost as someone else problem

```quiz
Q: Why keep dashboards in version control?
+ Review, history and repeatable deploys
- Faster queries :: Not related.
- Less data :: Not related.
- More labels :: Not related.
> Code practices apply.

Q: Where can noisy metrics be dropped centrally?
+ In the collector pipeline
- In the dashboard :: Too late.
- In the browser :: No.
- In DNS :: No.
> Processors drop or filter.

Q: Which usually drives most metric cost?
+ A few metrics with unbounded labels
- Dashboard count :: Not a cost driver.
- Alert count :: Small.
- Users :: Not directly.
> Find the top contributors.

Q: What should a quarterly review do?
+ Delete or fix unused and noisy alerts and dashboards
- Add more alerts :: Increases noise.
- Ignore costs :: Allows growth.
- Disable tracing :: Loses value.
> Prune on a schedule.
```

```cards
Observability as code :: Managing dashboards, alerts and collectors from version control
Collector :: A pipeline that receives, processes and exports telemetry
Telemetry budget :: A limit on data a team may produce
Provisioning :: Loading configuration into a tool from files
```
