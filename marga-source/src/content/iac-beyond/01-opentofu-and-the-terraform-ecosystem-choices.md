---
title: OpenTofu and the Terraform ecosystem choices
minutes: 12
summary: Understand how OpenTofu relates to Terraform, what compatibility to expect, and how to choose and migrate between tools with a safe plan.
---

Terraform and OpenTofu share a language and most providers, but they are separate projects with different licences and release paths. Knowing what is the same and what differs lets you choose on purpose.

## What you will learn

- Why OpenTofu exists and who governs it
- What is compatible: HCL, providers and state
- What differs: features, registry and licence
- A safe migration procedure
- Pinning versions and keeping options open

## Background

OpenTofu is an open source fork of Terraform, hosted by the Linux Foundation, started after Terraform moved to a source available licence. It keeps the HCL language and uses the same provider protocol, so most providers and modules work in both.

## Compatibility

For a given version range, the state format and configuration are largely compatible, which makes switching practical. Features have diverged over time, so check the release notes of both tools. Test your own modules instead of trusting a general claim.

## Differences

Examples are features added in only one project, different default registries and different licence terms for the tool itself. Providers are separate software with their own licences. Check how your vendor, your cloud provider and your compliance team treat each licence.

## A safe migration

Back up the state, pin the current tool version, run a plan with the current tool and save the output. Then run init and plan with the new tool in a copy of the environment and compare. The plan should show no changes. Switch one stack at a time and keep a rollback by restoring the state backup.

## Keep options open

Pin the required version in code, avoid tool specific features in shared modules and run your CI against the versions you support. This reduces the cost of changing later in either direction.

```diagram
title: OpenTofu and the Terraform ecosystem choices
node: code | HCL code | 0 | 1 | Same language. | Tool specific features. | external
node: tool | Terraform or OpenTofu | 1 | 1 | Plans and applies. | Version drift. | process
node: prov | Providers | 2 | 1 | Talk to APIs. | Version mismatch. | service
node: state | State | 3 | 1 | Records resources. | Corrupted or lost. | store
edge: code | tool
edge: tool | prov
edge: tool | state
```

## Incident: A plan that wanted to replace a database

> **Incident:** After switching tools, the first plan showed a destroy and create of a production database.

```console
$ tofu plan -no-color | tail -4
  # aws_db_instance.main must be replaced
-/+ resource "aws_db_instance" "main" {
Plan: 1 to add, 0 to change, 1 to destroy.
(this is a simulated illustration, not a real incident)
```

The provider version was not pinned, so the new tool installed a newer provider that changed a default. The team stopped before applying, pinned the provider to the previous version, saw a clean plan and scheduled the provider upgrade as its own change.

## Common mistakes

- Switching tools and upgrading providers in one step
- Not pinning provider and tool versions
- Applying a plan nobody read
- Assuming every feature exists in both tools
- No state backup before a migration

```quiz
Q: What do OpenTofu and Terraform share?
+ HCL and most provider compatibility
- A single vendor :: They differ.
- A single licence :: They differ.
- A single registry :: They differ.
> The language and protocol.

Q: What should a migration plan show?
+ No changes
- Many replacements :: A problem.
- A destroy :: A problem.
- New providers :: Pin first.
> Same code, same state, same plan.

Q: Why pin provider versions?
+ To avoid surprise changes
- To speed up plans :: No.
- To reduce cost :: No.
- To hide state :: No.
> Upgrade separately.

Q: Where should you test first?
+ A copy of the environment
- Production :: Risky.
- A laptop only :: Not representative.
- Nowhere :: Unsafe.
> Compare plans. Review the matching section of this lesson if it is unclear.
```

```cards
OpenTofu :: An open source fork of Terraform
Provider :: A plugin that manages a platform API
HCL :: HashiCorp Configuration Language
State :: The record of resources a tool manages
```
