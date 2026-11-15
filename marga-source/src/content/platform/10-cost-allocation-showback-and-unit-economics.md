---
title: Cost allocation, showback and unit economics
minutes: 13
summary: Make cloud and cluster spend visible to the teams that cause it: tagging and labelling, shared cost splitting, showback versus chargeback, and unit costs that connect spend to the product.
---

Shared platforms hide cost. When twenty teams run on one cluster, the bill arrives as a single number, and nobody feels responsible for it. Cost allocation breaks the bill down to the teams and services that caused it, and gives them data they can act on. It is a core platform capability because only the platform can label everything consistently from the start.

## What you will learn

- How to label resources so cost can be attributed
- How to split shared and idle costs fairly
- The difference between showback and chargeback
- How to express cost per unit of product value

## Labels first

Allocation depends on consistent labels or tags on cloud resources and on Kubernetes workloads: owner team, service, environment and, where relevant, cost centre. The platform should apply these automatically from the catalog, as part of templates and policies, and reject resources without them. Retrofitting labels is slow and always incomplete.

Cloud providers support cost allocation tags in their billing tools. For Kubernetes, tools such as OpenCost, a CNCF project, estimate cost per namespace, workload or label by combining resource usage with node prices. The FinOps Foundation publishes a framework of practices and terms for this area.

## Direct and shared costs

Some costs belong clearly to one service: its database, its storage. Others are shared: the cluster control plane, networking, monitoring, the platform team's own tools. You need a rule for splitting the shared part. Common choices are proportional to usage, such as CPU and memory requested, equal shares, or a fixed percentage. Pick one, publish it, and apply it consistently. A rule people can understand is better than a perfect but obscure one.

## Idle and unallocated cost

Reserved capacity that nobody is using still costs money. Track it as its own line: idle node capacity, unattached disks, empty reserved instances. If you hide it by spreading it evenly, no one has a reason to reduce it. Showing it separately lets the platform team own the efficiency of the shared layer.

## Showback and chargeback

- **Showback** shows each team the cost it caused, without moving money. It informs and builds awareness.
- **Chargeback** actually bills the team's budget. It creates stronger incentives but also arguments over the splitting rules, so you need accurate data first.

Most organisations start with showback and move to chargeback only when the data is trusted and there is a business reason. Either way, give teams a monthly view they can drill into, with trends and anomalies.

## A simple allocation

The snippet below splits a shared cluster bill by requested CPU and shows the unallocated portion.

```python
cluster_cost = 12000.0
requested_cpu = {"payments": 120, "search": 80, "checkout": 40}
node_cpu_total = 400  # total capacity, including unused

allocated = sum(requested_cpu.values())
unit = cluster_cost / node_cpu_total
for team, cpu in requested_cpu.items():
    print(f"{team:10} {cpu * unit:8.2f}")
idle = (node_cpu_total - allocated) * unit
print(f"{'idle':10} {idle:8.2f}")
```

Here costs are split by requested capacity against total capacity, so idle capacity appears as its own line.

## Unit economics

Total cost does not say whether spend is healthy. A team whose cost doubled because traffic tripled is doing well. Express cost per unit of value: per thousand requests, per active user, per build, per gigabyte processed. Plot it over time. A rising unit cost is a signal to investigate; a falling one shows efficiency gains. Choose a unit that the product team recognises.

## Give actionable advice

Reports that only show numbers are ignored. Pair data with suggestions: right-size requests that are consistently far above usage, remove idle environments, move batch work to cheaper capacity, and use autoscaling. But protect reliability: do not recommend cuts that remove headroom for production traffic.

## Keep the platform's own cost visible

The platform also costs money. Report what it costs per supported team or per deploy, and what it saves. This keeps the conversation about value, not only about spend.

```diagram
title: From bill to team view
node: bill | Cloud bill | 0 | 1 | Raw cost by account and service. | Single unexplained total. | store
node: label | Labels and tags | 1 | 0 | Owner, service and environment. | Missing or inconsistent labels. | process
node: usage | Usage data | 1 | 2 | Requests and consumption per workload. | No usage data, only totals. | observe
node: alloc | Allocation rules | 2 | 1 | Direct, shared and idle costs. | Rules nobody understands. | process
node: view | Team cost view | 3 | 1 | Showback with trends and unit costs. | Numbers with no advice. | service
node: act | Actions | 4 | 1 | Right-size, clean up and plan. | Cutting reliability headroom. | external
edge: bill | alloc
edge: label | alloc
edge: usage | alloc
edge: alloc | view
edge: view | act
```

## Incident: The unlabelled third

> **Incident:** Finance asked which team caused a 30 percent rise in monthly spend. The platform team could attribute only two thirds of the bill.

```console
$ costctl report --month 2026-10 --group-by team
payments        41,200
search          28,900
checkout        19,400
unallocated     36,300
(this is a simulated illustration, not a real incident)
```

A large share of resources had been created before labelling was required, and several automation scripts created resources without tags. The team added a policy that denied unlabelled resources, back-filled labels from the catalog using resource names, and reported unallocated spend every week as a number the platform team had to reduce.

## Common mistakes

- Starting allocation after resources already exist without labels
- Hiding idle capacity inside team bills
- Using chargeback before the data is trusted
- Reporting only total cost, not cost per unit of value
- Recommending savings that remove production headroom

```quiz
Q: Why must labels be applied automatically by the platform?
+ Retrofitting is slow and always incomplete
- Labels make resources run faster :: They do not.
- Cloud providers require labels to start resources :: They usually do not.
- Labels replace the catalog :: They complement it.
> Consistent labels from creation make attribution reliable.

Q: What is the difference between showback and chargeback?
+ Showback shows teams their cost, chargeback bills their budget
- They are the same :: Chargeback moves money.
- Chargeback only shows graphs :: That is showback.
- Showback is only for finance :: It is mostly for teams.
> Showback informs, chargeback bills.

Q: Why show idle capacity as its own line?
+ So someone owns the efficiency of the shared layer
- To make bills longer :: That is not the point.
- To hide it from teams :: It does the opposite.
- To raise prices :: Unrelated.
> Visible idle cost gives the platform team a reason to reduce it.

Q: Why use unit cost such as cost per thousand requests?
+ It shows whether spend is healthy relative to what the product delivers
- It replaces total cost :: Both are useful.
- It is always lower than total cost :: It is a different scale.
- It removes the need for labels :: Labels are still needed.
> A doubling in spend is fine if traffic tripled.
```

```cards
Cost allocation :: Attributing cloud and cluster spend to the teams and services that caused it
Showback :: Showing teams their cost without billing them
Chargeback :: Billing teams' budgets for the cost they cause
Idle cost :: Paid-for capacity that is not being used
Unit cost :: Cost per unit of product value, such as per thousand requests
```
