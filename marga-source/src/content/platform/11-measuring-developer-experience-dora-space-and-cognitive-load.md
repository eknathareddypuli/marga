---
title: Measuring developer experience: DORA, SPACE and cognitive load
minutes: 14
summary: Prove the platform helps with a small set of honest measures: delivery metrics from DORA, the dimensions of the SPACE framework, onboarding time and developer surveys, and learn which numbers mislead.
---

A platform team that cannot show whether it helps will lose its budget to the first reorganisation. A platform team that measures the wrong things will optimise for the wrong outcome. The aim is a few measures that tell you whether developers can deliver changes safely and with less pain, and that you cannot easily game.

## What you will learn

- The DORA software delivery measures and how to collect them
- The dimensions of the SPACE framework
- Onboarding time and survey questions that reveal friction
- Common traps when measuring people and teams

## DORA delivery measures

The DevOps Research and Assessment programme studied thousands of teams and found a small set of measures that relate to delivery performance:

- **Deployment frequency**: how often a team releases to production
- **Lead time for changes**: how long from a commit to running in production
- **Change failure rate**: the share of releases that cause a failure needing a fix
- **Time to restore**: how quickly service recovers after a failed release or incident

Newer reports refine the names and add related measures, so check the current definitions at dora.dev. The first two describe speed and the last two describe stability. The research finding that matters most is that speed and stability tend to rise together, not trade off, in high performing teams.

You can compute these from data the platform already holds: deployment events from the pipeline, commit times from source control, and incident or rollback records. Measure them per service or team, not as a company-wide average that hides who needs help.

```python
from datetime import datetime
from statistics import median

deploys = [
    {"commit": datetime(2026, 11, 2, 9, 0), "live": datetime(2026, 11, 2, 11, 30), "failed": False},
    {"commit": datetime(2026, 11, 3, 14, 0), "live": datetime(2026, 11, 3, 15, 0), "failed": True},
    {"commit": datetime(2026, 11, 5, 10, 0), "live": datetime(2026, 11, 5, 16, 0), "failed": False},
    {"commit": datetime(2026, 11, 9, 8, 0), "live": datetime(2026, 11, 9, 8, 45), "failed": False},
]
days = 14

lead_hours = [(d["live"] - d["commit"]).total_seconds() / 3600 for d in deploys]
print("deploys per week:", round(len(deploys) / (days / 7), 1))
print("median lead time (hours):", round(median(lead_hours), 1))
print("change failure rate:", sum(d["failed"] for d in deploys) / len(deploys))
```

## The SPACE framework

Researchers from Microsoft, GitHub and the University of Victoria proposed SPACE as a way to think about developer productivity beyond one number. It covers five dimensions:

- **Satisfaction and well-being**: how developers feel about their work and tools
- **Performance**: outcomes such as quality and impact
- **Activity**: counts of actions such as commits or deploys
- **Communication and collaboration**: how well people and teams work together
- **Efficiency and flow**: how smoothly work proceeds with few interruptions and waits

The core advice is to measure across several dimensions, and to include at least one perception measure. Activity counts alone, such as lines of code or number of commits, are easy to collect and easy to game.

## Cognitive load and onboarding

Two measures speak directly to what a platform does. **Time to first deploy** for a new engineer, from laptop setup to a change running in a real environment, shows how much the platform removes. **Time to create a new service** shows the cost of starting something. Track both as medians, and run a short survey after each task asking how hard it was and what slowed the person down.

A useful survey is brief and recurring: how easy is it to deploy, to debug in production, to find documentation, to get help? Add a free-text question. A rating alone tells you that something is wrong; the comment tells you what.

## Treat adoption as evidence, not proof

Rising usage of the platform is good news but not proof of value, especially if it is mandatory. Pair it with satisfaction and outcome measures. If usage is high and satisfaction is low, people are tolerating it.

## Traps to avoid

- **Targets become goals.** When a measure becomes a target, people optimise the number. Use measures to learn and discuss, not to rank individuals.
- **Comparing teams unfairly.** A team maintaining a regulated mainframe interface has different constraints from a new web service.
- **Averages that hide pain.** Use medians and percentiles, and look at the slowest cases.
- **Measuring only what is easy.** Deploy counts are easy; the feeling of being blocked is not, and it often matters more.
- **Surveillance.** Individual tracking harms trust. Measure systems and teams.

## Close the loop

Review the measures with the product teams every quarter. Pick one or two to improve, make a hypothesis about what platform change will move them, and check afterwards. The conversation is the product of measurement, not the dashboard.

```diagram
title: Measuring whether the platform helps
node: data | Platform data | 0 | 1 | Deploy events, commits and incidents. | Data stored per tool and never joined. | store
node: dora | Delivery measures | 1 | 0 | Frequency, lead time, failure rate and recovery. | Company-wide averages hiding outliers. | observe
node: onb | Onboarding time | 1 | 2 | Time to first deploy and to a new service. | Measured once, never repeated. | observe
node: survey | Developer survey | 2 | 1 | Ease, blockers and free text. | Rare surveys with no follow-up. | external
node: rev | Quarterly review | 3 | 1 | Pick one or two things to improve. | Dashboards without decisions. | process
node: chg | Platform change | 4 | 1 | A hypothesis tested against the measures. | Changes made without a baseline. | service
edge: data | dora
edge: data | onb
edge: dora | rev
edge: onb | rev
edge: survey | rev
edge: rev | chg
```

## Incident: The leaderboard

> **Incident:** A manager published a ranking of teams by deployment count. Within a month, teams were splitting changes into tiny deploys, and change failure rate did not improve.

```console
$ platformctl metrics --team search --last 30d
deploys:            94   (previous 30d: 41)
median lead time:   2.9h (previous: 3.1h)
change failure:     17%  (previous: 16%)
rollbacks:          15   (previous: 7)
(this is a simulated illustration, not a real incident)
```

Deployment frequency doubled but the stability numbers were unchanged or worse, which is a sign of gaming. The platform team withdrew the leaderboard, replaced it with per-team trends that only the team and its manager saw, and added the survey question "what slows you down most?" to the quarterly review.

## Common mistakes

- Ranking individuals or teams by a single activity count
- Using a company-wide average that hides problem teams
- Ignoring the human side: surveys and free-text feedback
- Treating mandatory usage as success
- Changing the platform with no baseline to compare against

```quiz
Q: Which pair of DORA measures describe stability?
+ Change failure rate and time to restore
- Deployment frequency and lead time :: Those describe speed.
- Lines of code and commits :: Activity counts, not DORA measures.
- Number of dashboards and alerts :: Not DORA measures.
> The speed measures are frequency and lead time; the stability measures are failure rate and time to restore.

Q: Why does SPACE advise measuring several dimensions?
+ One number is easy to game and misses how work actually feels and flows
- Because five is a lucky number :: Not the reason.
- To make surveys unnecessary :: SPACE encourages surveys.
- To rank individuals :: That is a misuse.
> A rounded picture avoids over-trusting any single activity count.

Q: Which measure speaks most directly to what a platform removes?
+ Time to first deploy for a new engineer
- Total lines of code :: Not related to platform value.
- Number of meetings :: Not directly.
- Cloud region count :: Unrelated.
> Onboarding time shows how much friction the platform eliminates.

Q: Why avoid ranking teams by deployment count?
+ People game the number without improving outcomes
- Deployments are not measurable :: They are measurable.
- It makes teams deploy less :: It may make them split work to inflate counts.
- It is too accurate :: Unrelated.
> A measure used as a target stops being a good measure.
```

```cards
DORA metrics :: Delivery measures from research: deployment frequency, lead time, change failure rate and time to restore
SPACE framework :: Five dimensions of developer productivity: satisfaction, performance, activity, communication and efficiency
Lead time for changes :: Time from commit to running in production
Time to first deploy :: How long a new engineer takes to get a change running in a real environment
Gaming a metric :: Improving the number without improving the outcome it stands for
```
