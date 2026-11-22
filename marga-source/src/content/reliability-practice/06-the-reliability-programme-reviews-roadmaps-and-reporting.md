---
title: The reliability programme: reviews, roadmaps and reporting
minutes: 12
summary: Run reliability as an ongoing programme: production readiness reviews, a risk register, a funded roadmap, simple reporting to leaders and a way to show that reliability work paid off.
---

Individual fixes help, but a programme makes reliability work visible, prioritised and funded. This final lesson joins the earlier practices into a yearly rhythm.

## What you will learn

- Production readiness reviews and launch checks
- A risk register built from incidents and near misses
- A reliability roadmap with funding
- Reporting: a one page view for leaders
- Showing value: fewer incidents, faster recovery, happier users

## Readiness reviews

Before a service takes real traffic, review it against a checklist: SLOs and alerts exist, runbooks are written, capacity and failure behaviour have been tested, backups restore, ownership is clear and dependencies are known. Treat the review as help and not as a gate to punish. Record exceptions with an owner and a date to close them.

## Risk register

Keep a list of known risks with likelihood, impact and an owner. Feed it from post incident reviews, near misses, game days and audits. Rank by the product of impact and likelihood, and review it monthly. A risk that is accepted should be accepted by a named person who has the authority, with a date to look again.

## Roadmap

Turn the highest risks into planned work with estimates and put it on the same roadmap as features. Reserve capacity each quarter, for example fifteen to twenty percent, so that it is not squeezed out. Where the error budget policy has triggered, reliability work moves to the front of the queue.

## Reporting

Give leaders one page each month: SLO status and budget for the main services, the biggest open risks, the incidents with their impact and the progress of the roadmap. Use trends and plain words. Avoid a long list of technical metrics, because leaders need to decide whether to fund work, not to debug it.

## Showing value

Track mean time to detect and to recover, the number of customer visible incidents, repeat incidents and pages per shift. Compare them each quarter. When a past incident type stops recurring because of a funded fix, say so. Visible results are what keeps reliability work funded in the next planning round.

```diagram
title: The reliability programme: reviews, roadmaps and reporting
node: prr | Readiness review | 0 | 1 | Checklist. | Rubber stamp. | process
node: risk | Risk register | 1 | 1 | Ranked. | Stale. | store
node: road | Roadmap | 2 | 1 | Funded work. | Squeezed. | process
node: rep | Leadership report | 3 | 1 | One page. | Too technical. | observe
edge: prr | risk
edge: risk | road
edge: road | rep
```

## Incident: The same outage three times in a year

> **Incident:** A certificate based outage recurred because the follow up work was never scheduled.

```console
$ grep -c "status: open" postmortem-actions.csv
27
$ grep -c "status: done" postmortem-actions.csv
4
(this is a simulated illustration, not a real incident)
```

Twenty seven actions from earlier reviews were still open and only four were done, because they had no owners and no place on the roadmap. After the third outage, leadership asked for a reliability programme. The team ranked the open actions as risks, reserved twenty percent of each quarter, assigned owners and reported progress monthly. The next year had no repeat of that outage.

## Common mistakes

- Readiness reviews as a rubber stamp
- Actions with no owner or date
- No reserved capacity for reliability
- Reports full of technical metrics
- Never showing the result of fixes

```quiz
Q: What is a production readiness review for?
+ Checking a service is ready before real traffic
- Ranking people :: No.
- Changing prices :: No.
- Closing the office :: No.
> It finds gaps early and helps.

Q: How is a risk ranked?
+ By impact and likelihood
- By age of code :: No.
- By team size :: No.
- By colour :: No.
> The highest products come first.

Q: Why reserve capacity for reliability?
+ Otherwise feature work squeezes it out
- To slow releases :: Not the aim.
- To save money :: Not the aim.
- To lower morale :: No.
> A share each quarter keeps it funded.

Q: What should leaders get in a report?
+ A one page view of SLOs, risks and progress
- All raw logs :: Too much.
- Nothing :: No visibility.
- Only code stats :: Not decision useful.
> They need to decide on funding.
```

```cards
Readiness review :: A check before launching a service
Risk register :: A ranked list of known risks
MTTR :: Mean time to recover
Reliability roadmap :: Planned and funded reliability work
```
