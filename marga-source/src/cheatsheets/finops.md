---
title: FinOps and cloud cost
summary: Cost questions, waste checks, pricing options and review habits.
module: finops
---

## Questions to ask of any bill

| Question | Where to look |
|----------|---------------|
| Who owns this cost? | Account, project, tag, namespace |
| What changed? | Cost by service, day over day |
| Is it growth or waste? | Cost per unit of traffic |
| Is it a price problem? | Coverage and utilisation |

## Waste checks

| Waste | Query idea |
|-------|-----------|
| Unattached volumes | Status available for 30 days |
| Idle load balancers | No healthy targets or traffic |
| Old snapshots | Older than the retention policy |
| Oversized instances | p95 CPU and memory under 30 percent |

## Pricing options

| Option | Best for | Risk |
|--------|----------|------|
| On demand | Unknown or short use | Highest price |
| Savings plan | Steady baseline | Unused commitment |
| Spot | Restartable work | Interruption |

## Habits

| Habit | Rhythm |
|-------|--------|
| Team cost report | Weekly |
| Anomaly review | Daily |
| Commitment review | Monthly |
| Forecast comparison | Monthly |

## Handy commands

```bash
aws ce get-cost-and-usage --time-period Start=2026-10-01,End=2026-11-01 --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE
```

```bash
aws ec2 describe-volumes --filters Name=status,Values=available
```

```bash
aws ce get-savings-plans-utilization --time-period Start=2026-10-01,End=2026-11-01
```

```bash
aws ce get-anomalies --date-interval StartDate=2026-10-01,EndDate=2026-10-31
```

```bash
aws ec2 describe-nat-gateways --query 'NatGateways[].NatGatewayId' --output text
```

```bash
aws budgets describe-budgets --account-id ACCOUNT_ID
```

## Watch out for

> **Warning:** Never delete a resource on cost alone, because an owner may need it at month end.

> **Warning:** Tags added by hand after the fact are always incomplete, so enforce them at creation.

> **Warning:** A commitment sized to the peak is paid for even when unused, so cover the baseline only.

> **Warning:** Moving large data through a NAT gateway is charged per gigabyte, so check flow logs first.
