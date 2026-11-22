---
title: Scenario: cloud API failures: access denied, quotas and throttling
minutes: 12
summary: Diagnose failures that come from the cloud control plane: access denied and its causes, quota and capacity limits, API throttling and eventual consistency.
---

Many outages are a control plane saying no. The message is usually precise, and the audit log tells you who asked for what.

## What you will learn

- Reading an access denied properly
- Quotas, limits and capacity errors
- Throttling and retry with backoff
- Eventual consistency after creating resources
- Using the audit log to find the call

## Access denied

An access denied can come from the identity policy, a resource policy, a permission boundary, an organisation level deny, a missing condition such as region or tag, or an expired credential. The error often names the action and the resource. Use the policy simulator or the provider troubleshooting tool, and find which layer denied it.

## Quotas and capacity

Accounts have limits on instances, addresses, rules and API rates, and these are per region. An error such as limit exceeded means a quota, while insufficient capacity means the provider has no more of that type in that zone right now. Request a quota increase early, and design to try another type or zone.

## Throttling

Cloud APIs rate limit callers and return errors such as too many requests. A loop that calls list or describe for every item can hit limits. Add exponential backoff with jitter, cache results, use batch calls and spread work. Do not retry instantly in a tight loop, as that makes the throttling worse for everyone.

## Eventual consistency

Some services need a short time before a new resource or policy is visible everywhere. A script that creates a role and uses it at once may fail with not found or no permission, and then work a minute later. Wait and retry with a limit, or use the wait operations that the tools provide.

## Audit log

Search the audit log for the failing call around the time of the error. It shows the caller identity, the action, the source address and the error code. This turns a vague failure into a precise one, and it also shows unexpected callers, which matters for security.

```diagram
title: Scenario: cloud API failures: access denied, quotas and throttling
node: call | API caller | 0 | 1 | Identity. | Expired. | service
node: pol | Policies | 1 | 1 | Allow or deny. | Hidden deny. | security
node: lim | Quotas and rates | 2 | 1 | Per region. | Exceeded. | process
node: aud | Audit log | 3 | 1 | Who and what. | Not read. | observe
edge: call | pol
edge: pol | lim
edge: lim | aud
```

## Incident: The deploy that failed only in one region

> **Incident:** A pipeline deployed successfully in two regions and failed in the third with an authorisation error.

```console
$ aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=RunInstances --max-results 1 --query "Events[0].CloudTrailEvent" --output text | head -c 200
{"errorCode":"UnauthorizedOperation","errorMessage":"explicit deny in a service control policy","awsRegion":"eu-south-2"}
(this is a simulated illustration, not a real incident)
```

The audit event named an explicit deny in an organisation policy that allowed only approved regions, and the third region was not on the list. The pipeline role itself was correct, so editing it would never have helped. The team asked the platform owners to approve the region through the normal process, and added the region list to the pipeline checks so that the error appears at plan time.

## Common mistakes

- Editing the identity policy when a higher layer denies
- Retrying instantly after throttling
- Requesting quota increases only during an incident
- Assuming a new resource is usable at once
- Not looking at the audit log

```quiz
Q: Where can an access denied come from?
+ Identity, resource or organisation policies and more
- Only the user policy :: Too narrow.
- Only DNS :: No.
- Only the CPU :: No.
> Use the audit log to see which.

Q: What is the right way to handle throttling?
+ Backoff with jitter and fewer calls
- Retry at once :: Makes it worse.
- Ignore it :: Failures continue.
- Delete the account :: No.
> Cache and batch.

Q: What does insufficient capacity mean?
+ The provider has none of that type in that zone now
- Your quota is zero :: Different error.
- The key expired :: No.
- The policy is wrong :: No.
> Try another type or zone.

Q: Why use the audit log?
+ It shows the caller, action and error for the failing call
- It fixes the policy :: It informs.
- It speeds the API :: No.
- It adds quota :: No.
> It turns a vague failure into a precise one.
```

```cards
Service control policy :: An organisation level limit on allowed actions
Quota :: A limit on resources or requests per account
Backoff :: Waiting longer after each failed retry
Eventual consistency :: A short delay before changes are visible everywhere
```
