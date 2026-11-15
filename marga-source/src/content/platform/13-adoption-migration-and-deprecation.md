---
title: Adoption, migration and deprecation
minutes: 13
summary: A platform only pays off when teams use it and old ways are retired. Plan adoption like a rollout, migrate services in waves with tooling and support, and deprecate old paths with dates, not hopes.
---

Building a platform is half of the work. The other half is getting teams from where they are to where the platform is, and then switching off the old ways. Companies that skip this end up paying for both worlds: the new platform and the old pipelines, scripts and servers that nobody dared remove.

## What you will learn

- How to plan adoption with pilots and waves
- What a migration kit contains
- How to deprecate responsibly
- How to deal with teams that cannot or will not move

## Start with a pilot

Pick two or three teams that have a real need, a friendly attitude and a service that matters but is not the most critical. Work with them closely, fix what breaks, and record how long each step took. Their results become the story and the checklist for everyone else. Avoid starting with the most critical system, where any bug is expensive, or with the least engaged team, which teaches you little.

## Migrate in waves

After the pilot, group the remaining services by effort and risk. Early waves take services that match the golden path well. Later waves take the awkward ones: unusual runtimes, stateful systems, regulated workloads. For each wave, schedule dates, name a migration contact on each team and assign a platform engineer who can help. A wave plan with dates turns "we should move" into a commitment.

## The migration kit

Make moving cheap. A kit usually includes:

- An inventory of what each service uses today, found by scanning repositories and pipelines
- A step-by-step guide with an estimate of effort
- Automation that opens a pull request adding the new pipeline and catalog descriptor
- A checklist of verification steps to compare old and new behaviour
- A rollback plan so teams are not afraid to try

Offer office hours or embedded help for the first weeks. The point is to reduce the effort a team needs to put in.

## Track adoption honestly

Track the share of services on the platform, by tier and by team, as well as how recently they were updated. Also track the reverse: who moved and then left again, and why. The snippet below summarises a migration list by wave.

```python
services = [
    {"name": "checkout", "wave": 1, "status": "done"},
    {"name": "search", "wave": 1, "status": "done"},
    {"name": "billing", "wave": 2, "status": "in progress"},
    {"name": "reports", "wave": 2, "status": "blocked"},
    {"name": "mainframe-bridge", "wave": 3, "status": "not started"},
]

waves = {}
for s in services:
    w = waves.setdefault(s["wave"], {"total": 0, "done": 0})
    w["total"] += 1
    w["done"] += s["status"] == "done"
for wave, w in sorted(waves.items()):
    print(f"wave {wave}: {w['done']}/{w['total']} done")
print("blocked:", [s["name"] for s in services if s["status"] == "blocked"])
```

## Deprecate with dates

Deprecation is a promise with a schedule. Announce what will be retired, why, when and what to do instead. A typical sequence is:

1. Announce with the date and the migration guide
2. Stop creating new things on the old path
3. Warn when the old path is used, with a link to the guide
4. Remove support and switch the old path off on the announced date

Stick to the date, but build in a clear process for exceptions with owners and expiry. If dates always slip, nobody believes the next one.

## Handle the teams that stay

Some teams have good reasons to stay: a system near end of life, a regulatory constraint or an unusual need the platform does not meet. Record the reason. If several teams share it, the platform has a gap worth closing. If a team simply does not want to move, escalate with data on risk, cost and support burden, and agree an end date with its leadership. Do not let a "temporary" exception become permanent.

## Keep the old and the new apart

During migration, avoid a half-state where a service is partly on the old path and partly on the new. Define a clear cutover: traffic shifts, the old pipeline is disabled and the old resources are cleaned up. Leave nothing running "just in case" without an owner and a removal date.

## Measure the end state

A migration is done when the old system is gone, not when the new one is available. Track the decommission: old pipelines deleted, old servers turned off, old credentials revoked and old documentation archived. Each retired system reduces cost, risk and confusion.

```diagram
title: Adoption in waves
node: pilot | Pilot teams | 0 | 1 | Two or three willing teams. | Starting with the hardest system. | external
node: kit | Migration kit | 1 | 1 | Inventory, guide, automation and checks. | Manual steps nobody wrote down. | service
node: w1 | Wave one | 2 | 0 | Services that fit the path well. | No dates or contacts. | process
node: w2 | Later waves | 2 | 2 | Awkward and stateful services. | Postponed forever. | process
node: dep | Deprecation | 3 | 1 | Dates, warnings and removal. | Dates that always slip. | security
node: done | Old system removed | 4 | 1 | Pipelines, servers and credentials gone. | Left running just in case. | store
edge: pilot | kit
edge: kit | w1
edge: kit | w2
edge: w1 | dep
edge: w2 | dep
edge: dep | done
```

## Incident: The old pipeline that was still deploying

> **Incident:** Six months after the new platform launched, a security fix reached only part of the fleet, because ten services still deployed through a pipeline that nobody maintained.

```console
$ platformctl audit pipelines --legacy
legacy pipelines still active: 10
last owner change: 14 months ago
credentials rotated: never
(this is a simulated illustration, not a real incident)
```

The old pipeline had never been listed as something to retire. The platform team inventoried it, announced a removal date, opened pull requests moving the ten services and revoked the old credentials on the date. They added "decommission" as a tracked item to every future migration.

## Common mistakes

- Starting with the most critical or the least willing team
- Offering the platform without migration tooling
- Announcing deprecation with no date
- Allowing temporary exceptions to become permanent
- Declaring victory before the old system is removed

```quiz
Q: What makes a good pilot team?
+ A team with a real need and a friendly attitude, with a service that matters but is not the most critical
- The team with the most critical system :: Bugs there are expensive.
- The least engaged team :: You learn little.
- The platform team itself :: They are not a user.
> A pilot should teach you quickly without high risk.

Q: What should a migration kit include?
+ Inventory, guide, automation, verification checks and rollback plan
- Only an announcement email :: That does not lower effort.
- A mandate :: That does not help teams move.
- A new logo :: Not useful here.
> The kit exists to make moving cheap and safe.

Q: Why give deprecations a date?
+ A promise with a schedule gets planned for, while hopes do not
- Dates make teams angry :: Clear dates are fairer than vague hopes.
- Dates are required by law :: Not the reason.
- Dates make removal unnecessary :: They schedule it.
> Dates turn intent into commitment.

Q: When is a migration complete?
+ When the old system is removed, not when the new one is available
- When the new system launches :: Both may still run.
- When the announcement is sent :: Too early.
- When the first team moves :: Too early.
> Decommissioning is what removes cost and risk.
```

```cards
Pilot :: A small first rollout with willing teams that proves and shapes the approach
Migration wave :: A group of services scheduled to move together
Migration kit :: The tools, guides and checks that make moving cheap
Deprecation :: Announcing that something will be retired on a set date, with a replacement
Decommission :: Fully removing an old system, including resources and credentials
```
