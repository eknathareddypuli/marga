---
title: Measuring platforms: DORA and developer experience
minutes: 12
summary: Measure whether the platform helps: DORA metrics, adoption and satisfaction, time to first deploy, and how to avoid measures that people game.
---

A platform is a product with internal customers. Without measurement, you cannot tell whether it saves time or only adds a layer.

## What you will learn

- DORA metrics and what they show
- Developer experience: surveys and friction
- Platform adoption and time to first deploy
- Cost, reliability and toil measures
- Using metrics without gaming them

## DORA metrics

Deployment frequency, lead time for changes, change failure rate and time to restore service measure delivery performance. The first two show speed and the last two show stability. Measure them per team from the delivery system and look at trends, not single numbers.

## Developer experience

Quantitative data misses friction. Run a short survey each quarter and ask about build time, waiting, confusing tools and cognitive load. Pair it with interviews and observation. Track the same questions over time to see whether changes helped.

## Adoption

Measure how many services use each golden path, the time from a new engineer start to first production deploy, and the time to create a new service. Low adoption is feedback about the product, not a failure of the teams that do not adopt.

## Cost, reliability and toil

Track platform availability and incident counts, the support load in tickets and chat, and the share of engineering time spent on repetitive operational work. Show cost per service or per team so the savings of shared services are visible.

## Avoiding gaming

Any metric used as a target will be gamed. Use metrics to find problems and start conversations, not to rank teams. Combine several measures, keep definitions stable and share results openly with the teams they describe.

```diagram
title: Measuring platforms: DORA and developer experience
node: dora | DORA metrics | 0 | 1 | Speed and stability. | Single number. | observe
node: dx | Developer survey | 1 | 1 | Friction. | Not asked. | observe
node: adopt | Adoption data | 2 | 1 | Golden path use. | Low. | observe
node: act | Platform roadmap | 3 | 1 | Acts on data. | Ignores it. | process
edge: dora | dx
edge: dx | adopt
edge: adopt | act
```

## Incident: A metric that rose while the work got worse

> **Incident:** Deployment frequency was used as a target and teams split changes into tiny deploys.

```console
$ psql -h metrics -c "select team, count(*) as deploys, avg(lines_changed) as avg_lines from deploys where month = '2026-10' group by team order by deploys desc limit 2"
 team   | deploys | avg_lines
 team-a | 612     | 3
(this is a simulated illustration, not a real incident)
```

When managers ranked teams by deployment frequency, one team deployed trivial changes to raise the count while lead time and failures did not improve. The platform team stopped ranking, reported the four measures together as trends, added the survey results and used them to choose the next improvement.

## Common mistakes

- Using DORA as a team ranking
- Measuring only speed
- Never asking developers
- Ignoring low adoption
- Changing metric definitions often

```quiz
Q: What do DORA metrics cover?
+ Speed and stability of delivery
- Only cost :: No.
- Only uptime :: No.
- Only code size :: No.
> Four measures together.

Q: Why run a developer survey?
+ Numbers miss friction that people feel
- To rank people :: No.
- To save time only :: No.
- To replace metrics :: No.
> Ask the same questions each quarter.

Q: What does low adoption tell you?
+ The product may not meet the needs
- Teams are lazy :: Usually wrong.
- Nothing :: No.
- Ignore it :: No.
> It is product feedback.

Q: How do you avoid gaming?
+ Use metrics to learn, combine several and do not rank
- Rank teams :: Invites gaming.
- One metric :: Easy to game.
- Hide results :: Loses trust.
> Share openly. Review the matching section of this lesson if it is unclear.
```

```cards
DORA :: Four research based delivery metrics
Lead time :: Time from commit to production
Change failure rate :: Share of changes causing failure
Developer experience :: How easy and pleasant work is for engineers
```
