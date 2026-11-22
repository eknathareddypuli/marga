---
title: A symptom-first method: narrow the layer in ten minutes
minutes: 12
summary: Use a repeatable way to find the failing layer: state the symptom, ask what changed, split the path in half, test one hypothesis at a time and write down each result.
---

Experts do not guess faster. They shrink the search space with cheap tests and keep notes so that nothing is repeated. This lesson is the method that the following scenarios apply.

## What you will learn

- Writing the symptom precisely
- Asking what changed, and where to look for it
- Bisecting the request path
- One hypothesis, one test, one note
- Knowing when to stop and mitigate

## State the symptom

Write one sentence that says who sees what, since when, how often and how bad. Compare it with a normal case. Slow for everyone since 14:05 is a different problem from failing for one customer on one endpoint. Avoid causes in the sentence. A precise symptom already removes half of the possibilities.

## What changed

Most incidents follow a change: a deployment, a configuration or flag change, a certificate or key expiry, a traffic shift, a dependency update or a quota limit. Check the deployment history, change calendar, cloud audit log and the dependency status pages around the start time. If nothing changed, look for growth: data volume, traffic or a counter that reached its limit.

## Bisect the path

A request travels through client, DNS, network, load balancer, application, dependencies and storage. Test at the middle. If a request made directly to the application works, the problem lies before it. If not, it lies in or after it. Halve again. Each test removes half of the path, so a long chain needs only a few steps.

## One hypothesis at a time

State a hypothesis that a test could disprove, such as if the pool is exhausted then waiting connections will be at the maximum. Run the cheapest test, and write the result. Changing several things at once makes the outcome impossible to interpret. Prefer read only checks first, then reversible changes.

## Mitigate first

If users are hurt, restore service before finding the root cause: roll back, fail over, scale out or disable a feature. Keep the evidence, such as logs and a heap dump, before restarting. Then continue to the cause. Hand over clearly if you get tired, with the notes you kept.

```diagram
title: A symptom-first method: narrow the layer in ten minutes
node: sym | Precise symptom | 0 | 1 | Who, what, when. | Vague. | observe
node: chg | What changed | 1 | 1 | Audit and deploys. | Skipped. | observe
node: bis | Bisect the path | 2 | 1 | Halve each time. | Random. | process
node: mit | Mitigate and record | 3 | 1 | Restore then learn. | Lost notes. | process
edge: sym | chg
edge: chg | bis
edge: bis | mit
```

## Incident: Twenty minutes of guessing

> **Incident:** An error rate rose and three engineers tried different ideas at the same time.

```console
$ kubectl rollout history deploy/checkout -n shop | tail -2
41   <none>
42   <none>
$ kubectl get events -n shop --sort-by=.lastTimestamp | tail -2
2m  Normal  ScalingReplicaSet  deployment/checkout  Scaled up replica set checkout-7d9 to 6
(this is a simulated illustration, not a real incident)
```

Each engineer changed a different setting, so no one knew which change had any effect. The incident lead stopped the changes and asked what changed. A deployment had been made six minutes before the alert, so they rolled it back and the errors stopped. The root cause, a bad configuration value, was found afterwards in a calm review with the saved logs.

## Common mistakes

- Several people changing things at once
- Skipping the what changed question
- Guessing a cause before writing the symptom
- Restarting before saving evidence
- Not recording the tests and results

```quiz
Q: What goes in a good symptom statement?
+ Who sees what, since when and how often
- The guessed cause :: Biases the search.
- A person to blame :: No.
- A fix :: Too early.
> Precision narrows the search.

Q: Why ask what changed first?
+ Most incidents follow a change
- Changes are always wrong :: Not always.
- It is a rule of law :: No.
- To assign blame :: Not the aim.
> Deploys, flags and expiries start many incidents.

Q: How does bisecting help?
+ Each test removes half of the request path
- It adds logs :: No.
- It adds servers :: No.
- It speeds the network :: No.
> A few tests locate the layer.

Q: When should you mitigate before finding the cause?
+ When users are being hurt
- Never :: Prolongs harm.
- Only on Mondays :: No.
- After the meeting :: Too slow.
> Restore service and keep evidence.
```

```cards
Hypothesis :: A testable guess about the cause
Bisecting :: Splitting the path to find the failing part
Mitigation :: An action that restores service before the root cause is known
Symptom :: What users or monitors observe
```
