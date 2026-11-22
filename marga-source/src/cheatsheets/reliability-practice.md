---
title: Reliability practice
summary: SLI shapes, budget maths, policy triggers and exercise roles.
module: reliability-practice
---

## SLI shapes

| Service type | Indicators |
|--------------|------------|
| Request service | Availability, latency |
| Pipeline | Freshness, correctness |
| Storage | Durability, read and write success |
| Batch job | Finished in time, correct output |

## Downtime per month

| Target | Allowed failure |
|--------|-----------------|
| 99 percent | About 7 hours |
| 99.9 percent | About 43 minutes |
| 99.99 percent | About 4 minutes |

## Error budget policy triggers

| Budget used | Action |
|-------------|--------|
| Over 50 percent | Review risky changes |
| 100 percent | Pause non critical releases |
| One incident over 30 percent | Post incident review |

## Exercise roles

| Role | Job |
|------|-----|
| Facilitator | Runs the clock and injects |
| Scribe | Records timeline and decisions |
| Observer | Watches response and tools |
| Responder | Acts as in a real incident |

## Handy commands

```bash
promtool check rules slo-rules.yml
```

```bash
kubectl get events --sort-by=.lastTimestamp
```

```bash
k6 run load-test.js
```

```bash
kubectl delete pod -l app=checkout --field-selector=status.phase=Running --dry-run=client
```

```bash
kubectl top pods -A --sort-by=cpu
```

```bash
timeout 60 k6 run soak.js
```

## Watch out for

> **Warning:** An indicator that counts a slow success as good will show green while users suffer.

> **Warning:** An SLO without an approved policy changes no decisions.

> **Warning:** Do not rescue the team during a game day, because the gaps are the lesson.

> **Warning:** Soak tests find leaks that short tests never show, so run them overnight.
