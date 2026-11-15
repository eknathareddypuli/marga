---
title: Platform as a product: users, roadmap and feedback
minutes: 13
summary: Run the platform like a product: know your users, find their biggest pain, ship the thinnest useful version, publish a roadmap and measure whether people choose it when they could do otherwise.
---

The most common reason a platform fails is not technical. It is that nobody treated it as something people have to want. Internal users usually have a choice, even when it is unofficial: they can keep their own scripts, buy a managed service or ignore the platform and ask a friendly engineer for help. A platform that wins has to be better than those alternatives.

## What you will learn

- How to identify users and their jobs
- How to find the pain worth fixing first
- The idea of the thinnest viable platform
- How to run a roadmap, feedback and release notes

## Start with users, not tools

List the groups who use or are affected by the platform: product developers, data engineers, security reviewers, new joiners, on-call engineers. For each, write the jobs they are trying to get done: "deploy a change to production", "get a database for a prototype", "see why my service is slow". Interview a handful of them and watch them work. You will find friction that no survey would reveal, such as a copied command that everyone has to edit by hand.

A useful habit is to record each interview as a short journey: step, time taken, who helped, what went wrong. Add the steps up. The slowest and most painful steps across many teams are candidates for the first release.

## Rank by pain and reach

For each problem, estimate how many teams have it, how often, and how much time it costs. Multiply roughly and sort. This avoids two common errors: fixing the loudest complaint, and fixing the most interesting problem. The ranking also gives you a defensible answer when someone asks why their request is not first.

```python
problems = [
    ("get a database", 11, 6, 4.0),
    ("add a pipeline", 12, 3, 6.0),
    ("rotate a secret", 8, 12, 0.5),
    ("create a dashboard", 9, 2, 2.0),
]
# teams affected, times per year, hours each time
ranked = sorted(problems, key=lambda p: p[1] * p[2] * p[3], reverse=True)
for name, teams, times, hours in ranked:
    print(f"{name:20} {teams * times * hours:6.0f} hours per year")
```

## The thinnest viable platform

Team Topologies uses the phrase "thinnest viable platform" for the smallest set of capabilities that lets product teams move faster. It might be a documented wiki page at first, then a template, then a self-service workflow. Each step earns the next. Avoid the temptation to build the full architecture diagram before anyone has used a single piece.

## Make adoption a choice

Mandates give you usage but hide quality. If you can, let teams opt in, and watch what they choose. A rising share of new services created through the platform, and teams coming back for the second and third thing, are better signals than a mandate. Where a mandate is justified, for example a security control, make it narrow and explain why.

## A roadmap people can read

Publish a short roadmap with three horizons: now, next and later. State the problem each item solves and the users it helps, not only the technology. Say what you are not doing and why. Keep a visible changelog with release notes written for users: what changed, what they need to do and what they gain.

## Feedback loops

Collect feedback in more than one way: an office hour, a channel with an on-call rotation for questions, a short survey after common tasks, and direct interviews each quarter. Close the loop. When someone reports a problem, tell them what happened. A platform team that never answers will soon stop being told.

## Name an owner and a customer for each capability

Each capability needs a product owner on the platform side and, ideally, a named pilot customer on the product side. The pilot customer tells you whether the capability solves a real job, and becomes a reference for others.

```diagram
title: The platform product loop
node: users | Users and jobs | 0 | 1 | Interviews and observation of real work. | Assumptions instead of watching users. | external
node: pain | Ranked pain | 1 | 1 | Reach times frequency times cost. | The loudest request wins by default. | observe
node: build | Thinnest slice | 2 | 1 | The smallest capability that removes the pain. | A big design before first use. | process
node: ship | Release and notes | 3 | 1 | Docs, a changelog and an announcement. | Users never hear about it. | service
node: measure | Adoption and feedback | 4 | 1 | Usage, satisfaction and time saved. | Counting mandated use as success. | observe
edge: users | pain
edge: pain | build
edge: build | ship
edge: ship | measure
edge: measure | users | next round
```

## Incident: The request queue that ate the roadmap

> **Incident:** A platform team answered every request in order, and after a quarter had shipped nothing that reduced requests.

```console
$ platformctl requests --last 90d --by type
database-request        214
pipeline-setup          167
access-request           98
namespace-request        76
(this is a simulated illustration, not a real incident)
```

The team had treated itself as a support desk. Looking at the counts, they saw that two request types made up most of the work and both were repeatable. They paused new features for a month, automated the database and pipeline requests as self-service workflows, and watched the queue fall by more than half the next quarter. The measure of success became requests that no longer needed to exist.

## Common mistakes

- Prioritising by who asks loudest
- Building the whole platform before anyone uses a piece of it
- Counting mandated usage as proof of value
- Publishing no roadmap or release notes
- Never closing the loop with people who gave feedback

```quiz
Q: Why interview and watch users before building?
+ To find real friction that surveys and assumptions miss
- To avoid writing any code :: Building still follows.
- To please the loudest team :: Ranking by pain is meant to avoid that.
- To reduce the user count :: Unrelated.
> Observation shows steps and workarounds that people do not mention.

Q: What does the thinnest viable platform mean?
+ The smallest set of capabilities that makes product teams faster
- A platform with no documentation :: Docs are part of it.
- Only one cloud region :: Unrelated.
- A platform that is cheap to run only :: The focus is on user value.
> Start small, learn, and extend as each piece proves its worth.

Q: How should you rank candidate improvements?
+ By how many teams are affected, how often and how much time it costs
- By which one is most interesting to build :: That is a bias, not a reason.
- By who requested it first :: Order of arrival is not value.
- Alphabetically :: Arbitrary.
> Reach, frequency and cost make the ranking defensible.

Q: Which signal best shows real adoption?
+ Teams choosing the platform for new work without being forced
- A policy that says everyone must use it :: That shows compliance, not value.
- The number of platform engineers :: Unrelated to value.
- The length of the roadmap :: Unrelated.
> Voluntary use and repeat use show that the platform solves a real job.
```

```cards
Product mindset :: Treating internal tools as products with users, a roadmap and measurable value
Thinnest viable platform :: The smallest set of capabilities that speeds up product teams
Pilot customer :: A named user team that helps shape and validates a capability
Roadmap horizons :: Now, next and later, each tied to a user problem
Release notes :: User-facing notes saying what changed and what to do
```
