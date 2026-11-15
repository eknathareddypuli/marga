---
title: Policy as code and drift detection
minutes: 12
summary: Enforce rules on plans with OPA or Sentinel style policies and detect changes made outside code, then decide whether to revert or adopt them.
---

Reviews miss things. Policy as code applies the same rules to every plan, and drift detection finds the changes people made by hand so the code and reality match again.

## What you will learn

- What to enforce with policy
- Policies against plan output
- Where to run policy in the pipeline
- Detecting and classifying drift
- Reverting or adopting drift

## What to enforce

Good policies are specific and explainable: storage must be encrypted, only approved regions and instance sizes are allowed, public access needs an approval tag, every resource has an owner tag and cost centre. Avoid broad rules that no one can satisfy.

## Policies on a plan

A plan can be exported as JSON, and a policy engine such as Open Policy Agent with Conftest evaluates rules against it. Each rule returns a message that says what is wrong and how to fix it. Write tests for the policies themselves, with examples that pass and fail.

## In the pipeline

Run policy on every pull request so the author sees failures early, and run it again before apply. Warnings for new rules and hard failures for established rules let teams adapt. An exemption process with an owner and an expiry avoids silent bypasses.

## Detecting drift

Drift happens when someone changes a resource in the console or another tool. A scheduled plan, with no changes expected, reports differences. Classify drift: a harmless tag change, a risky security group change or an emergency fix that should become code.

## Revert or adopt

If the change was wrong, apply the code to revert it and find out why access allowed it. If it was a valid emergency fix, copy it into code through a pull request so the next apply does not undo it. Reduce console write access to cut drift at the source.

```diagram
title: Policy as code and drift detection
node: plan | Plan JSON | 0 | 1 | Proposed changes. | Unreviewed. | process
node: pol | Policy engine | 1 | 1 | Evaluates rules. | Weak rules. | security
node: apply | Apply | 2 | 1 | Creates changes. | Bypass. | service
node: drift | Drift check | 3 | 1 | Scheduled plan. | Ignored report. | observe
edge: plan | pol
edge: pol | apply
edge: apply | drift
```

## Incident: A security group opened in the console

> **Incident:** During an incident someone opened a port to the internet and never closed it.

```console
$ terraform plan -detailed-exitcode -no-color | tail -5
  # aws_security_group.web will be updated in-place
  ~ ingress {
      + cidr_blocks = ["0.0.0.0/0"]
Plan: 0 to add, 1 to change, 0 to destroy.
(this is a simulated illustration, not a real incident)
```

The nightly drift plan reported the change and a ticket was opened automatically. The team reverted the rule through code, reviewed who could edit security groups in the console and added a policy that denies public ingress without an approved tag.

## Common mistakes

- Policies nobody can explain
- Policies with no tests
- Exemptions without owner or expiry
- Never running a plan against reality
- Fixing drift by hand a second time

```quiz
Q: What does a policy engine read?
+ The plan output as data
- Source code comments :: Not the usual input.
- Logs :: No.
- Dashboards :: No.
> Evaluate the proposed change.

Q: What is drift?
+ Resources changed outside the code
- A slow plan :: No.
- A new module :: No.
- A bigger state :: No.
> Reality differs from code.

Q: How do you detect drift?
+ A scheduled plan expecting no changes
- A manual guess :: Unreliable.
- A larger state :: No.
- More modules :: No.
> Exit code shows changes.

Q: When should drift become code?
+ When it was a valid emergency fix
- Never :: Then it will be undone.
- Always revert :: Loses a needed fix.
- Delete the state :: Dangerous.
> Adopt through a pull request.
```

```cards
Policy as code :: Rules written as code and enforced automatically
OPA :: Open Policy Agent, a general policy engine
Drift :: Differences between code and real resources
Exemption :: An approved exception to a policy
```
