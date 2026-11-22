---
title: Commitments, spot and the pricing portfolio
minutes: 13
summary: Manage the mix of on demand, committed and spot capacity: coverage and utilisation maths, laddering commitments, and designing workloads that tolerate interruption.
---

Discounts of thirty to seventy percent are available for predictable use, but they are promises. This lesson treats pricing as a portfolio that you manage with numbers and review regularly.

## What you will learn

- The pricing options and what each one trades
- Coverage and utilisation: the two numbers to watch
- Laddering commitments over time
- Spot capacity and interruption design
- Reviewing the portfolio every month

## The options

On demand has no commitment and the highest price. Reserved instances and savings plans give a discount for a commitment to a term of one or three years, either to specific capacity or to a spend per hour. Spot capacity is spare capacity at a large discount that the provider can reclaim with short notice. Each trades flexibility for price.

## Coverage and utilisation

Coverage is the share of eligible usage that a commitment covers. Utilisation is the share of the commitment that you actually use. High coverage with low utilisation means you pay for unused commitment. Low coverage means you leave discounts unused. Aim for utilisation near one hundred percent on the baseline and cover the steady floor, not the peaks.

## Laddering

Buying everything at once risks a cliff when the term ends and locks in today architecture. Buy in steps through the year, so that part of the portfolio expires every few months. Prefer flexible spend based plans for usage that may change instance family, and keep a margin for projects that will shrink.

## Spot design

Spot suits stateless, restartable and batch work. Diversify across instance types and zones, handle the interruption notice by draining and checkpointing, and keep a small on demand base for work that cannot stop. Kubernetes tools and managed groups can mix both for you. Do not run a single replica database on spot.

## Monthly review

Review coverage, utilisation, expiring terms and forecast usage once a month. Record who owns the decision and the rules, such as the maximum share committed. Share the savings and the unused commitment openly with the teams, so that they can plan to use what has been bought.

```diagram
title: Commitments, spot and the pricing portfolio
node: base | Steady baseline | 0 | 1 | Committed. | Shrinks. | store
node: flex | Variable load | 1 | 1 | On demand. | Costly. | service
node: spot | Spot batch | 2 | 1 | Interruptible. | Reclaimed. | service
node: rev | Monthly review | 3 | 1 | Coverage and use. | Skipped. | observe
edge: base | flex
edge: flex | spot
edge: spot | rev
```

## Incident: A three year commitment for a service that shrank

> **Incident:** A large commitment was bought and the service it covered moved to another instance family.

```console
$ aws ce get-savings-plans-utilization --time-period Start=2026-10-01,End=2026-11-01 --query Total.Utilization.UtilizationPercentage
61.4
(this is a simulated illustration, not a real incident)
```

The commitment was sized to peak usage and was tied to one instance family. After a migration to a newer family and a project that ended, only sixty one percent was used, so the company paid for capacity it did not need for the rest of the term. The team moved to flexible spend based plans, bought in quarterly steps and added utilisation to the monthly review, with an alert below ninety percent.

## Common mistakes

- Committing to the peak instead of the floor
- Locking into one instance family for three years
- Buying everything on one day
- Running stateful single replicas on spot
- Not reviewing utilisation after a migration

```quiz
Q: What does low utilisation of a commitment mean?
+ You pay for committed capacity you do not use
- You get a refund :: Not automatic.
- Spot is cheaper :: Unrelated.
- Usage is free :: No.
> The commitment is a fixed charge.

Q: What should commitments usually cover?
+ The steady baseline of usage
- Only peaks :: Wastes money.
- Nothing at all :: Misses savings.
- Test environments only :: Too small.
> The floor is predictable.

Q: Why ladder purchases?
+ So terms expire in steps and architecture can change
- To avoid tags :: No.
- To delay review :: No.
- To raise price :: No.
> It avoids one big cliff.

Q: Which workloads suit spot?
+ Stateless, restartable and batch work
- Single database primary :: Interrupt risk.
- Payment API with one replica :: Interrupt risk.
- License servers :: Poor fit.
> Design for interruption.
```

```cards
Coverage :: Share of usage covered by commitments
Utilisation :: Share of a commitment that is used
Savings plan :: A discount in return for spend commitment
Spot capacity :: Spare capacity that can be reclaimed
```
