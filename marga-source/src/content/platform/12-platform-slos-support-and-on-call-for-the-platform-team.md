---
title: Platform SLOs, support and on-call for the platform team
minutes: 13
summary: The platform is production software with internal customers. Set service level objectives for it, run a support model that scales, and decide what the platform team is on call for and what product teams own.
---

When the pipeline is down, every team stops shipping. When the cluster API is slow, every deploy fails. The platform is a dependency of everything else, which makes its reliability matter more than that of any single product. Treat it like a service with customers, objectives, an error budget and an on-call rotation.

## What you will learn

- Which platform capabilities need SLOs, and what to measure
- How to design support so it does not drown the team
- What the platform team owns versus what product teams own
- How to communicate incidents and changes

## SLOs for platform capabilities

Pick the capabilities users depend on most and describe their reliability in terms users feel:

| Capability | Example indicator | Example objective |
|---|---|---|
| Pipeline | Share of builds that start within 2 minutes | 99 percent over 30 days |
| Deploy | Share of deploys that succeed without platform error | 99.5 percent |
| Cluster API | Share of requests under 1 second | 99.9 percent |
| Self-service workflows | Time from request to ready for common tasks | 95 percent under 15 minutes |
| Portal | Availability of the catalog and templates | 99.5 percent |

Choose indicators that exclude user errors, such as a build failing because of a user's code, and include platform faults. Set objectives with the users, based on how much downtime they can tolerate. Do not aim for the highest number you can imagine, because each extra nine costs a great deal.

## Error budgets for the platform

An error budget is the amount of unreliability the objective allows. If the pipeline objective is 99 percent of builds starting within two minutes over thirty days, the budget is one percent. When the budget is nearly spent, the platform team slows feature work and fixes reliability. When the budget is healthy, it can ship changes faster. This gives platform decisions the same discipline that the SRE practice gives to products.

```python
window_minutes = 30 * 24 * 60
objective = 0.995
budget_minutes = window_minutes * (1 - objective)
bad_minutes = 85

remaining = budget_minutes - bad_minutes
print("budget (min):", round(budget_minutes))
print("used (min):", bad_minutes)
print("remaining (min):", round(remaining))
print("status:", "slow down changes" if remaining < budget_minutes * 0.25 else "ok to ship")
```

## A support model that scales

Without a plan, support consumes the whole team. A workable structure has layers:

1. **Self-service documentation** that answers the common questions, kept current from the questions actually asked
2. **A request channel or form** with templates, so each question arrives with the information needed
3. **A rotating support engineer** who handles incoming questions for a week, so the rest of the team can focus
4. **Escalation to the owning engineers** for real defects

Categorise questions. If the same question appears ten times, fix the cause: improve the template, error message or documentation. The goal is a falling number of questions per user.

## Who is on call for what

Write a clear boundary. The platform team is on call for the platform's own components: the pipeline system, the cluster control plane, the portal, shared databases, and the workflows. Product teams are on call for their services, including those that run on the platform. A service failing because of its own code is not a platform incident, even though it runs on the platform's cluster. Make this boundary visible, with example scenarios, so nobody wastes the first twenty minutes arguing about whose problem it is.

Give product teams good tools to diagnose their own services, such as default dashboards and logs, so they can tell whether the problem is theirs or the platform's.

## Communicate well

Maintain a status page for the platform. During incidents, post updates at a regular cadence. Announce planned maintenance and upgrades in advance, with a date, the expected impact and what users must do. After a significant incident, publish a short blameless review. People forgive outages they understand and hate surprises.

## Plan upgrades as a service

The platform depends on clusters, controllers and tools that need upgrades. Give each a schedule, test upgrades in a non-production copy, and use staged rollouts. Tell teams what changes for them, and provide automated fixes where possible.

```diagram
title: Running the platform as a service
node: slo | SLOs | 0 | 1 | Targets for pipeline, deploy and workflows. | Targets set without users. | observe
node: bud | Error budget | 1 | 1 | Decides pace of change versus reliability. | Ignored when spent. | process
node: sup | Support model | 2 | 0 | Docs, forms, rotation and escalation. | One person answers everything. | service
node: oc | Platform on call | 2 | 2 | Owns platform components. | Unclear boundary with product teams. | security
node: com | Status and notes | 3 | 1 | Status page, notices and reviews. | Silence during incidents. | external
edge: slo | bud
edge: bud | sup
edge: bud | oc
edge: sup | com
edge: oc | com
```

## Incident: Whose problem is it?

> **Incident:** At 11:40 several teams reported failing deploys. The platform on-call spent half an hour on a pipeline that was healthy, while a different cause was fixing itself.

```console
$ platformctl status pipeline
build queue:      healthy (median wait 41s)
deploy workers:   healthy
registry:         degraded: rate limit from upstream
(this is a simulated illustration, not a real incident)
```

The failure was a rate limit on pulls from a public registry, which showed up as deploy failures. The team added the registry to the platform's own indicators, put a pull-through cache in front of it, and updated the status page template to show dependencies on outside services.

## Common mistakes

- Setting an SLO nobody asked for and nobody measures
- Ignoring the error budget when it is spent
- Letting every question go straight to senior engineers
- Leaving the on-call boundary between platform and products vague
- Going silent during platform incidents

```quiz
Q: What should an indicator for a platform SLO exclude?
+ Failures caused by the user's own code
- All failures :: Platform faults must be counted.
- Slow responses :: They may be part of the objective.
- Weekend traffic :: There is no such rule.
> A good indicator reflects the platform's reliability, not user mistakes.

Q: What happens when the error budget is nearly spent?
+ The team slows feature work and invests in reliability
- Nothing, budgets are decoration :: They should drive decisions.
- The team stops all work forever :: It is a pace decision, not a ban.
- Users are charged :: Unrelated.
> The budget balances speed against reliability.

Q: How should support scale?
+ Self-service docs, request forms, a rotating support engineer and escalation
- Everyone asks the most senior engineer :: It does not scale.
- No support :: Users will leave.
- A single shared inbox with no process :: It becomes noise.
> Layers protect the team while keeping users supported.

Q: Who is on call for a product service running on the platform?
+ The product team that owns the service
- The platform team :: They own the platform, not each service.
- Nobody :: Services need owners.
- The cloud provider :: They run infrastructure, not your code.
> Clear ownership avoids losing time at the start of an incident.
```

```cards
Platform SLO :: A reliability target for a platform capability that users rely on
Error budget :: The amount of unreliability an objective allows over a period
Support rotation :: A rota where one engineer handles incoming questions for a set time
On-call boundary :: The written line between what the platform team and product teams respond to
Status page :: A public place for the platform's current health and planned work
```
