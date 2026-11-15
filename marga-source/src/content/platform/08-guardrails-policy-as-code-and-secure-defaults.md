---
title: Guardrails, policy as code and secure defaults
minutes: 13
summary: Safety that depends on people remembering rules fails. Build guardrails into the platform with secure defaults, admission policies and checks that explain themselves, so the safe path is also the easy one.
---

A guardrail keeps people from driving off the road without slowing the journey. In a platform, guardrails are checks and defaults built into the paths and workflows: images must come from an approved registry, services must have an owner, containers must not run as root. When they work, developers rarely notice them. When they are badly designed, they are the thing developers resent most.

## What you will learn

- Defaults, guardrails and gates, and when to use each
- How policy as code works with admission control
- How to write policies that explain themselves
- How to roll out a new policy without breaking teams

## Three levels of control

1. **Defaults.** The safe option is already chosen. A template sets resource limits and a non-root user. Most people never change them, so the default does most of the work.
2. **Guardrails.** Automated checks that block or warn on dangerous choices, with a clear message. A policy rejects a deployment with no resource limits.
3. **Gates.** A human approval for rare, high-risk actions, such as widening access to production data.

Prefer defaults first, guardrails next and gates last. Each step adds friction, so use the lightest control that gives enough safety.

## Policy as code

Policies written in a document are forgotten. Policies written as code can be reviewed, tested, versioned and enforced automatically. In Kubernetes, admission controllers intercept requests to the API server and can validate or mutate them. Tools commonly used for this include Kyverno, Open Policy Agent with Gatekeeper, and the built-in validating admission policies, which use the Common Expression Language. The same rules can also run earlier, in pipelines and in the template step, so developers see failures in their own change instead of at deploy time.

An example rule, written in plain terms: every Deployment must declare resource requests and limits for each container. In a policy engine this becomes a few lines of configuration. The important part is where it runs and what it says when it fails.

## Messages that help

A policy that rejects with "denied" teaches nothing. A good message says what was wrong, why the rule exists and how to fix it: "Container `web` has no memory limit. Limits stop one service from starving others. Add `resources.limits.memory`, or use the default from the path template." Link to the documentation. Developers read the message at the moment they are most motivated to fix the problem.

```python
def check_deployment(d):
    problems = []
    for c in d["containers"]:
        if "limits" not in c.get("resources", {}):
            problems.append(f"container {c['name']} has no resource limits: add resources.limits so one service cannot starve others")
        if c.get("run_as_root", True):
            problems.append(f"container {c['name']} may run as root: set runAsNonRoot to true")
    if "owner" not in d.get("labels", {}):
        problems.append("deployment has no owner label: add the owning team so alerts can be routed")
    return problems

deploy = {
    "labels": {},
    "containers": [{"name": "web", "resources": {}, "run_as_root": True}],
}
for p in check_deployment(deploy):
    print("DENY:", p)
```

## Roll out in stages

Switching a new policy to enforce on day one will break teams and cost you trust. Use stages:

1. Audit mode: record violations but allow everything
2. Publish the list of affected services and the fix
3. Warn mode: show the message but allow
4. Enforce, with a dated deadline and a documented exception process

Measure how many violations remain at each stage. If many teams hit the same violation, improve the template so the default prevents it.

## Exceptions are part of the design

Real systems have exceptions. Make them explicit, time-limited and visible: an exception has an owner, a reason and an expiry date, and is listed somewhere reviewable. Silent, permanent exceptions erode the policy until it means nothing.

## Test the policies

Write test cases for each policy, both a passing and a failing example, and run them in CI whenever the policy changes. A policy bug that rejects all deployments is an outage you caused yourself.

## Do not duplicate trust

Run the same policy in more than one place only if it is the same code. Different copies drift. Keep one policy repository and let the pipeline, admission controller and template reference it.

```diagram
title: Guardrails along the path
node: tmpl | Template defaults | 0 | 1 | Safe values chosen up front. | Defaults that are rarely updated. | store
node: ci | Pipeline checks | 1 | 1 | Policy and scan results in the pull request. | Checks that can be bypassed. | process
node: adm | Admission control | 2 | 1 | Validates requests to the cluster. | A rule that blocks everything. | security
node: aud | Audit and exceptions | 3 | 1 | Violations and time-limited exceptions. | Permanent silent exceptions. | observe
node: dev | Developer | 1 | 3 | Sees clear messages and fixes the cause. | Messages that only say denied. | external
edge: tmpl | ci
edge: ci | adm
edge: adm | aud
edge: ci | dev | message
edge: adm | dev | message
```

## Incident: The rule that blocked a rollback

> **Incident:** During an outage the on-call engineer tried to roll back a deployment, and an admission policy rejected the old version because it lacked a label added after it was built.

```console
$ kubectl rollout undo deployment/checkout -n shop
Error from server: admission webhook "policy.platform" denied the request: missing label owner
(this is a simulated illustration, not a real incident)
```

The new policy applied to old workloads as well as new ones. The incident lasted fifteen minutes longer while a platform engineer granted an exception. Afterwards the team made new policies apply only to resources created or changed after a date, added an emergency path with logging for rollbacks, and tested policies against old versions before enforcing them.

## Common mistakes

- Relying on documents and reviews instead of automated checks
- Denying with a message that gives no fix
- Enforcing a new policy on day one
- Letting exceptions live forever without owners
- Running different copies of the same policy in different places

```quiz
Q: Which control should you prefer first?
+ A secure default that most users never change
- A manual gate for every change :: It adds friction and delay.
- A written policy document :: People forget it.
- A weekly audit meeting :: It finds problems late.
> Defaults give protection with no effort from the user.

Q: What makes a policy failure message useful?
+ It says what is wrong, why the rule exists and how to fix it
- It says only denied :: It teaches nothing.
- It is long and technical only :: Clarity matters more.
- It is hidden in logs :: Users will not see it.
> The message is the moment of teaching.

Q: How should you roll out a new enforced policy?
+ Audit, then warn, then enforce with a deadline and an exception process
- Enforce at once for everyone :: It breaks teams and trust.
- Never enforce :: Then it protects nothing.
- Enforce only on weekends :: Arbitrary.
> Staged rollout builds trust and finds problems early.

Q: Why test policy code?
+ A buggy policy can block valid changes, including emergency rollbacks
- Policies cannot fail :: They can.
- Tests make policies slower for users :: Tests run in CI.
- Tests replace exceptions :: They do not.
> Policies are production code and need tests.
```

```cards
Guardrail :: An automated check that blocks or warns on an unsafe choice
Secure default :: A safe setting applied automatically unless changed
Admission control :: Checks on requests to the cluster before they are stored
Policy as code :: Rules written as versioned, tested, enforceable code
Time-limited exception :: A recorded, owned and expiring permission to break a rule
```
