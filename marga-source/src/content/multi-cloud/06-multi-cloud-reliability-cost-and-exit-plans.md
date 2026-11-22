---
title: Multi-cloud reliability, cost and exit plans
minutes: 12
summary: Use two clouds for reliability only where it pays, compare cost fairly, and write exit and failure plans that you have actually rehearsed.
---

A second cloud adds failure modes of its own. It helps when the design is simple, tested and justified by a real risk, not by a diagram.

## What you will learn

- Active active, active passive and cloud as failure domain
- The complexity bill of two clouds
- Comparing cost fairly: egress, support and skills
- Observability and operations across clouds
- Exit and failover rehearsals

## Patterns

Most reliability needs are met inside one cloud with several zones or regions. Active passive across clouds uses a warm standby and a failover process. Active active spreads traffic over both, but needs data replication, consistent identity and global traffic steering. Choose the simplest pattern that meets the recovery targets.

## Complexity bill

Two clouds mean two sets of tools, skills, security controls and on call knowledge. Data replication across clouds adds lag and cost. The extra failure modes can exceed the failure you were avoiding. Write down the specific risk you are reducing and how often it actually happens.

## Fair cost comparison

Compare compute, storage and request prices, but also egress, support plans, committed discounts, engineering time and the cost of running two stacks. A cheaper unit price can lose once data transfer and duplicate tooling are counted. Tag everything and report cost per service in a shared model.

## Operations

Use one observability stack for both clouds with consistent labels for cloud, region and account. Standardise on OpenTelemetry, shared dashboards and one on call process. Differences in provider status pages and incident notices should be tracked in the same place.

## Rehearsals

A failover plan that has never run is only a guess. Run game days that shift traffic, restore from backup in the other cloud and rebuild from code. Record how long it took and what broke. Keep an exit plan that lists data, dependencies, order and a realistic timeline.

```diagram
title: Multi-cloud reliability, cost and exit plans
node: risk | Named risk | 0 | 1 | What are we avoiding. | Vague. | external
node: pat | Chosen pattern | 1 | 1 | Simplest that works. | Too complex. | process
node: obs | Shared observability | 2 | 1 | One view. | Two tools. | observe
node: reh | Rehearsal | 3 | 1 | Game day. | Never run. | observe
edge: risk | pat
edge: pat | obs
edge: obs | reh
```

## Incident: A failover that took nine hours

> **Incident:** The second cloud copy of the database was a day old and the runbook had never been tested.

```console
$ psql -h standby-db -c "select now() - pg_last_xact_replay_timestamp() as lag"
 lag
 23:41:07
(this is a simulated illustration, not a real incident)
```

The cross cloud replica fell behind after a link change and nobody noticed, and the failover steps used names that no longer existed. In the exercise the team lost a day of data and needed nine hours to bring the service up. After the review they added lag alerts, updated the runbook from code and ran a game day each quarter.

## Common mistakes

- A second cloud without a named risk
- Active active without data strategy
- Comparing only unit prices
- Two observability stacks
- A failover plan nobody has run

```quiz
Q: What should justify a second cloud for reliability?
+ A specific risk and a tested plan
- A diagram :: Not enough.
- A vendor slide :: No.
- A rumour :: No.
> Name the risk. Review the matching section of this lesson if it is unclear.

Q: What is often missed in cost comparison?
+ Egress, duplicate tooling and engineering time
- Colours :: No.
- Logos :: No.
- Region names :: No.
> Count the full cost.

Q: Why share one observability stack?
+ One consistent view and on call process
- Fewer alerts always :: Not guaranteed.
- More dashboards :: Not the aim.
- No telemetry :: No.
> Consistent labels help.

Q: How do you know a failover works?
+ By rehearsing it and recording the result
- By reading it :: No.
- By trust :: No.
- By luck :: No.
> Game days. Review the matching section of this lesson if it is unclear.
```

```cards
Active passive :: Primary serves, standby waits
Active active :: Both sites serve traffic
Game day :: A planned failure exercise
Exit plan :: A plan to leave a provider
```
