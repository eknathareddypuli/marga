---
title: Capstone: plan and rehearse an upgrade and a recovery
minutes: 14
summary: Put the module together by writing an upgrade plan with checks and rollback points and a recovery runbook, then rehearsing both and timing them.
---

The best sign of a mature cluster is that the scary tasks are boring. This capstone turns what you have learned into two documents you can hand to a colleague, an upgrade plan and a recovery runbook, and a rehearsal that proves they work.

## What you will learn

- What an upgrade plan must contain
- What a recovery runbook must contain
- How to rehearse safely and measure the result
- A readiness checklist you can reuse

## The upgrade plan

Write the plan as numbered steps with an owner, an expected duration and a check after each step. Include the current and target versions and the version skew check. List preparation tasks: release notes, deprecated API scan, add-on compatibility, an etcd snapshot, PodDisruptionBudget review and a maintenance window. Describe the order, control plane first, then workers in batches that keep capacity. Define a stop point after the first control plane node where you can still roll back.

## Rollback thinking

Control plane upgrades are not easily reversible once storage schema migrations have run, so the safe rollback is a restore from the snapshot taken before. Worker upgrades are reversible by replacing nodes with the previous version. Say clearly what you will do at each stop point if a check fails, and who decides.

## The recovery runbook

Cover the cases you can name: one control plane node lost, etcd quorum lost, all control plane nodes lost, expired certificates and a deleted namespace. For each give symptoms, the first checks, the exact commands with placeholders you fill in at the time, expected output, and how to verify the result. Keep it where you can read it when the cluster is down.

## Rehearse and measure

Build a scratch cluster that mirrors production in shape, run the upgrade plan end to end, then break it on purpose and use the runbook to recover. Time each step, note surprises and fix the documents. Repeat each quarter, and after major changes.

## A readiness check in code

```python
checks = {
    "etcd snapshot taken and verified": True,
    "deprecated API scan clean": True,
    "add-ons support target version": True,
    "PDBs allow one disruption": False,
    "rollback owner named": True,
}
blocked = [k for k, ok in checks.items() if not ok]
print("ready" if not blocked else "blocked by: " + ", ".join(blocked))
```

```diagram
title: Capstone: plan and rehearse an upgrade and a recovery
node: plan | Upgrade plan | 0 | 1 | Steps, checks, stop points. | Vague steps. | store
node: run | Runbook | 1 | 1 | Recovery commands. | Out of date. | store
node: drill | Rehearsal | 2 | 1 | Scratch cluster. | Not like prod. | process
node: meas | Measured times | 3 | 1 | RTO evidence. | No timing. | observe
edge: plan | run
edge: run | drill
edge: drill | meas
```

## Incident: The runbook that lived on the broken cluster

> **Incident:** During an outage the only copy of the runbook was in a wiki hosted on the failed cluster.

```console
$ curl -sI https://wiki.corp.example/k8s-recovery | head -1
curl: (7) Failed to connect to wiki.corp.example port 443: Connection refused
$ ls ~/runbooks
(no such directory)
(this is a simulated illustration, not a real incident)
```

The documentation platform ran on the same cluster that had failed, so nobody could read the steps. The team moved the runbooks to version control, copied them to a read only share and a printed binder for the on-call, and added a check that the runbook location does not depend on the cluster. Test that you can reach your recovery documents with the cluster down.

## Common mistakes

- Plans without stop points or owners
- Runbooks stored on the system they recover
- Rehearsing only the happy path
- Never timing the steps
- Not updating documents after a drill

```quiz
Q: Where should a recovery runbook live?
+ Somewhere that does not depend on the cluster
- Only on the cluster wiki :: It would be unreachable in an outage.
- In one person's head :: Not shareable.
- In a pod :: It would be unreachable.
> You must read it when the cluster is down.

Q: What is the safest rollback for a control plane upgrade?
+ Restore from the pre-upgrade snapshot
- Downgrade the packages :: Not supported after migrations.
- Delete the API server :: No.
- Ignore it :: Not a plan.
> Storage migrations are one way.

Q: Why time the rehearsal?
+ To measure real recovery time against the objective
- To impress managers :: Not the point.
- To reduce disk use :: Not related.
- To reset certificates :: Not related.
> Times show whether the RTO is achievable.

Q: How often should you rehearse?
+ Regularly, such as quarterly, and after major changes
- Never :: Then it fails when needed.
- Once ever :: Environments change.
- Only after an outage :: Too late.
> Rehearsal keeps documents true.
```

```cards
Runbook :: Written steps for handling a known situation
Stop point :: A planned place to decide whether to continue or roll back
Rehearsal :: A practice run in a safe environment
Readiness check :: A list of conditions that must be true before a change
Maintenance window :: A planned period for risky changes
```
