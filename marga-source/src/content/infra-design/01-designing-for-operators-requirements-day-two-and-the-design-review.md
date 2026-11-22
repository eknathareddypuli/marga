---
title: Designing for operators: requirements, day two and the design review
minutes: 12
summary: Apply system design to infrastructure services: gather requirements from internal users, size with simple numbers, plan day two operations and run a design review that finds failure modes.
---

Infrastructure design differs from product design. The users are engineers, the service is depended on by many teams, and the cost of a bad design is paid during upgrades and outages for years.

## What you will learn

- Requirements from internal customers
- Back of the envelope sizing
- Failure modes and blast radius for shared services
- Day two: upgrades, migrations and ownership
- The design review and decision record

## Requirements

List who uses the service, what they do with it and what they expect. Ask for numbers: how many builds a day, how many nodes, how large the data and how fast it must recover. Separate must have from nice to have, and write down what is out of scope. Requirements from users who are not in the room will otherwise be discovered after launch.

## Sizing

Estimate load, storage and growth with simple arithmetic and state the assumptions. For example, two thousand builds a day at ten minutes each and a peak of five times the average gives the runner capacity. Check the result against a measured pilot. The aim is the right order of magnitude, not false precision.

## Blast radius

A shared service fails for all its users together. Decide how to limit that: separate instances per environment, rings for changes, quotas per tenant so that one cannot take all capacity, and a degraded mode that keeps the critical path working. Write the dependencies, including the ones that the service needs to start itself.

## Day two

Plan upgrades, migrations, backups, capacity growth and on call from the start. Ask how a new version is rolled out and rolled back, how a tenant is moved and how the service is rebuilt from nothing. A design that cannot be upgraded safely will be left on old versions until it fails. Decide the owner and the support model before building.

## Review

Write a short design document with goals, non goals, the proposed design, alternatives and risks, then review it with operators and users. Use a checklist: what fails, how it is detected, how it recovers, what it costs and what is the smallest first version. Record the decision and the reasons in a decision record.

```diagram
title: Designing for operators: requirements, day two and the design review
node: req | Requirements | 0 | 1 | Users and numbers. | Missing users. | process
node: size | Sizing | 1 | 1 | Order of magnitude. | Guess. | process
node: fail | Failure modes | 2 | 1 | Blast radius. | Shared fate. | security
node: day2 | Day two plan | 3 | 1 | Upgrade and own. | Orphaned. | process
edge: req | size
edge: size | fail
edge: fail | day2
```

## Incident: The registry that nobody could upgrade

> **Incident:** A shared registry stayed on a three year old version because upgrading risked every pipeline.

```console
$ kubectl get deploy registry -n infra -o jsonpath="{.spec.template.spec.containers[0].image}"
registry.example.com/registry:2.7.1
$ kubectl get deploy registry -n infra -o jsonpath="{.spec.replicas}"
1
(this is a simulated illustration, not a real incident)
```

The service was built with one replica, no staging copy and no rollback plan, so every team feared an upgrade. A security fix finally forced it, and the upgrade caused two hours of failed builds. The replacement design had two replicas behind a balancer, a staging instance, a documented rollback and a quarterly upgrade rehearsal, and it was reviewed with its users before launch.

## Common mistakes

- No requirements from internal users
- Sizing with no stated assumptions
- One shared instance with no isolation
- No plan for upgrades
- No named owner

```quiz
Q: Why ask internal users for numbers?
+ Sizing and limits depend on real use
- To delay the project :: No.
- To spread blame :: No.
- To buy hardware :: Not the aim.
> Numbers replace guesses.

Q: What does blast radius mean for shared services?
+ How many users fail together when it fails
- The size of a rack :: No.
- The cost :: No.
- The speed :: No.
> Isolation and quotas limit it.

Q: What belongs in day two planning?
+ Upgrades, rollback, backups and ownership
- Logo design :: No.
- Marketing :: No.
- Hiring only :: No.
> Services die from neglected operations.

Q: What does a decision record hold?
+ The decision, alternatives and reasons
- Passwords :: Never.
- Raw logs :: No.
- Invoices :: No.
> It helps the next engineer.
```

```cards
Non goal :: Something the design deliberately does not do
Decision record :: A short note of a design choice and its reasons
Day two :: Operating a service after launch
Tenant :: A team or workload using a shared service
```
