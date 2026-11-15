---
title: Terragrunt, modules and multi-environment structure
minutes: 12
summary: Structure infrastructure repositories with reusable modules, environment folders and Terragrunt, keeping configuration dry without hiding the blast radius.
---

Copying a Terraform folder for each environment works until the fifth copy. Good structure separates reusable modules from environment configuration and limits the size of each state.

## What you will learn

- Modules versus environments
- Small states and blast radius
- What Terragrunt adds
- Dependencies between stacks
- Versioning modules and promoting changes

## Modules and environments

A module is a reusable unit such as a network or a database. An environment folder calls modules with its own values. Modules live in a separate repository or directory and are versioned, so that production can use version 1.4 while dev tests 1.5.

## Blast radius

One huge state means every plan reads everything and a mistake can touch everything. Split by lifecycle and risk: network, data, compute and applications each have their own state. A failure or a lock affects only that part.

## Terragrunt

Terragrunt is a thin wrapper that generates backend and provider configuration, passes inputs from a hierarchy of files and runs several stacks in order. It removes repeated backend blocks and keeps the folder tree consistent. It also adds a layer that people must learn, so use it when repetition is a real problem.

## Dependencies

A stack often needs outputs from another, such as the network id. Terragrunt dependency blocks read those outputs and define an order. Mock outputs let plans run before the dependency exists, but they must never be used in an apply.

## Promotion

Change a module in a branch, release a tag, then update the version in dev, then staging and then production, reading the plan each time. A short, boring pipeline with a manual approval for production is better than a fast pipeline with surprises.

```diagram
title: Terragrunt, modules and multi-environment structure
node: mod | Module repo | 0 | 1 | Versioned modules. | Unpinned refs. | external
node: env | Environment folders | 1 | 1 | Inputs per environment. | Copy and paste. | process
node: tg | Terragrunt | 2 | 1 | Backends and order. | Hidden magic. | process
node: st | Separate states | 3 | 1 | Small blast radius. | One big state. | store
edge: mod | env
edge: env | tg
edge: tg | st
```

## Incident: A single apply that touched everything

> **Incident:** A change to a tag in a shared network stack planned changes for 400 resources.

```console
$ terragrunt run-all plan --terragrunt-non-interactive 2>&1 | grep -c "will be updated in-place"
412
$ git diff --stat | tail -1
 1 file changed, 1 insertion(+)
(this is a simulated illustration, not a real incident)
```

All environments pointed to the unversioned main branch of the module, so a one line change affected every stack at once. The team pinned module versions by tag, promoted them through dev and staging and split the network stack so a change touches fewer resources.

## Common mistakes

- Pointing modules at a branch instead of a tag
- One state for the whole company
- Mock outputs used in an apply
- Copying folders for each environment
- No review of the plan for each environment

```quiz
Q: Why version modules?
+ So environments adopt changes on purpose
- To save disk :: No.
- To speed plans :: No.
- To hide code :: No.
> Pin and promote.

Q: What limits blast radius?
+ Smaller states split by lifecycle
- A larger state :: Increases it.
- Longer names :: No.
- More providers :: No.
> Separate network, data and apps.

Q: What does Terragrunt remove?
+ Repeated backend and provider configuration
- State :: No.
- Providers :: No.
- Planning :: No.
> It generates them.

Q: When are mock outputs acceptable?
+ For plans before a dependency exists
- For applies :: Dangerous.
- For production :: Dangerous.
- For state :: No.
> Never apply with mocks.
```

```cards
Module :: A reusable unit of infrastructure code
Blast radius :: How much a mistake can affect
Terragrunt :: A wrapper that organises Terraform and OpenTofu stacks
Promotion :: Moving a change through environments in order
```
