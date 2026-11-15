---
title: Cloud and Kubernetes SDKs with safe patterns
minutes: 13
summary: Use cloud and Kubernetes SDKs from Python safely: credentials, pagination, dry runs, tagging, least privilege and audit friendly automation.
---

SDKs make it easy to change a lot of infrastructure with a few lines. Safe patterns keep automation from becoming the largest risk in the estate.

## What you will learn

- Credentials and least privilege
- Listing, filtering and dry run before acting
- Tagging, ownership and audit trails
- Kubernetes client patterns
- Guardrails: limits, approvals and kill switches

## Credentials

Automation should use short lived credentials from a role or workload identity, not long lived keys in files. Give it only the permissions it needs, for example read access for a report and delete access only for one tagged set. Separate roles for read and write tools.

## List, filter, then act

Build the list of targets first, print it and apply filters such as tags and age. Run in dry run mode by default. Only then act, one item at a time with logging, and stop if the count is much larger than expected.

## Tags and audit

Tag everything automation creates with the owner and the tool. Log each action with the account, the resource and the reason, to a place others can read. When something is deleted unexpectedly, the log answers who and why.

## Kubernetes patterns

The official client loads configuration from a kubeconfig or from the service account inside a pod. Use label selectors, handle API errors and watch for changes with a timeout and a resource version rather than polling in a tight loop. Use server side dry run where available.

## Guardrails

Cap how many resources one run may change, require an explicit flag or approval for large changes, check that the account and region are the expected ones, and provide a kill switch such as a feature flag file. Alert when automation changes more than normal.

```diagram
title: Cloud and Kubernetes SDKs with safe patterns
node: role | Scoped role | 0 | 1 | Least privilege. | Admin keys. | security
node: list | List and filter | 1 | 1 | Tags and age. | Wrong filter. | process
node: act | Act with limits | 2 | 1 | Cap and log. | Mass deletion. | service
node: audit | Audit log | 3 | 1 | Who and why. | No record. | observe
edge: role | list
edge: list | act
edge: act | audit
```

## Incident: An automation that tried to delete half the account

> **Incident:** A cleanup script matched far more resources than intended because a tag filter was empty.

```console
$ python cleanup.py --dry-run
matched: 4,812 resources
limit per run: 50
aborting: matched count exceeds the limit
(this is a simulated illustration, not a real incident)
```

An empty tag value matched everything. The run stopped because of the per run limit that the team had added after an earlier near miss. They fixed the filter, added a check that rejects empty values and kept the limit and the dry run default.

## Common mistakes

- Long lived keys in scripts
- Acting before listing and reviewing
- No cap on changes per run
- No tags or audit logs
- Using admin permissions for convenience

```quiz
Q: What credentials suit automation?
+ Short lived role based credentials
- Shared passwords :: Risky.
- Keys in a repo :: Risky.
- None :: Impossible.
> Rotate automatically.

Q: What should a tool do before acting?
+ List targets and apply a dry run
- Delete first :: Unsafe.
- Retry :: No.
- Sleep :: No.
> Review first. Review the matching section of this lesson if it is unclear.

Q: Why cap changes per run?
+ To limit the damage from a wrong filter
- To save CPU :: No.
- To hide logs :: No.
- To speed up :: No.
> A circuit breaker.

Q: Why tag created resources?
+ So owners and tools are traceable
- To make them faster :: No.
- To encrypt :: No.
- For colour :: No.
> Audit and cleanup.
```

```cards
Least privilege :: Granting only the access that is needed
Dry run :: Preview without making changes
Kill switch :: A way to stop automation quickly
Workload identity :: Credentials issued to a running workload
```
