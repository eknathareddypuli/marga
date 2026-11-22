---
title: Landing zones: accounts, subscriptions and guardrails
minutes: 12
summary: Structure accounts and subscriptions, apply guardrails with organisation policies, and give teams a safe and fast way to start in each cloud.
---

A landing zone is the prepared ground teams build on. When it is good, a new team gets a secure account in an hour. When it is missing, every team invents its own rules.

## What you will learn

- Hierarchy: organisation, accounts, subscriptions
- Separating environments and workloads
- Guardrails: SCP, Azure Policy and tagging
- Logging, security and networking baselines
- Vending new accounts with code

## Hierarchy

AWS uses an organisation with organisational units and accounts. Azure uses management groups, subscriptions and resource groups. An account or subscription is a strong boundary for permissions, quotas, cost and blast radius, so use many of them rather than one big shared one.

## Separation

Separate production from non production and sensitive workloads from general ones, usually into different accounts or subscriptions. Put shared services such as networking, logging and identity in their own accounts managed by the platform team.

## Guardrails

Service control policies in AWS and Azure Policy with management group assignments set rules that no one in a child account can undo: allowed regions, required encryption, blocked public storage, mandatory tags. Prefer preventive rules for serious risks and detective rules for the rest.

## Baselines

Every new account gets the same baseline: central logging to a protected account, security services enabled, standard network connection, budget alerts and a default set of roles. Baselines are code, versioned and reviewed.

## Account vending

Teams request an account through a pull request or a portal. Automation creates it, applies the baseline, connects the network and assigns the team. The goal is a short time to a safe account, with no manual steps.

```diagram
title: Landing zones: accounts, subscriptions and guardrails
node: org | Organisation | 0 | 1 | OUs and groups. | Flat. | service
node: pol | Guardrail policies | 1 | 1 | Preventive rules. | Too loose. | security
node: base | Account baseline | 2 | 1 | Logging and network. | Manual. | process
node: vend | Account vending | 3 | 1 | Code driven. | Tickets. | process
edge: org | pol
edge: pol | base
edge: base | vend
```

## Incident: A public storage bucket in a new account

> **Incident:** A team created a public bucket in an account that had no guardrail policy.

```console
$ aws s3api get-public-access-block --bucket team-exports
An error occurred (NoSuchPublicAccessBlockConfiguration) when calling the GetPublicAccessBlock operation
(this is a simulated illustration, not a real incident)
```

The new account was created by hand and missed the baseline that blocks public access, so a bucket with customer exports was readable from the internet for a week. The platform team applied an organisation wide policy that denies public buckets, moved account creation to an automated pipeline and added a detective rule for public exposure.

## Common mistakes

- One shared account for everything
- Guardrails that only warn
- Manual account creation
- No central logging account
- No budget alerts per account

```quiz
Q: Why use many accounts or subscriptions?
+ They are strong boundaries for access, cost and blast radius
- They are free :: Not the reason.
- They are faster :: Not the reason.
- They hide data :: No.
> Isolation. Review the matching section of this lesson if it is unclear.

Q: What does a service control policy do?
+ Sets maximum permissions that child accounts cannot exceed
- Creates VMs :: No.
- Stores logs :: No.
- Assigns IPs :: No.
> A preventive guardrail.

Q: What belongs in a baseline?
+ Logging, security services, network connection and budgets
- Only a name :: No.
- Only tags :: Not enough.
- Nothing :: No.
> Same start for every account.

Q: Why automate account vending?
+ A short, repeatable path to a safe account
- To remove reviews :: No.
- To increase tickets :: Opposite.
- To hide cost :: No.
> No manual steps.
```

```cards
Landing zone :: A prepared multi account environment
SCP :: AWS service control policy
Azure Policy :: Rules enforced on Azure resources
Account vending :: Automated creation of new accounts
```
