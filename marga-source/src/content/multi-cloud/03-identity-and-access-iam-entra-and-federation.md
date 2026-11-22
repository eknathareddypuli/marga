---
title: Identity and access: IAM, Entra ID and federation
minutes: 13
summary: Map AWS IAM and Azure RBAC with Entra ID, use federation and workload identity instead of long lived keys, and keep access reviewable across clouds.
---

Identity is the new network edge. Two clouds with separate user lists and long lived keys double the risk. Federation keeps one source of truth.

## What you will learn

- AWS IAM and Azure RBAC models compared
- One identity provider and federation
- Workload identity for pipelines and pods
- Least privilege and permission boundaries
- Access reviews and break glass

## Two models

AWS IAM attaches policies to users, roles and resources and evaluates allow and deny statements. Azure uses role assignments of a role definition to a principal at a scope such as management group, subscription, resource group or resource. Entra ID is the directory behind Azure and can also be the identity source for AWS.

## Federation

Use a single identity provider with single sign on to both clouds. People sign in once, get short lived sessions and lose access in all places when they leave. Avoid creating separate local users in each cloud.

## Workload identity

Pipelines and pods should not store cloud keys. Use OpenID Connect trust: a CI job or a Kubernetes service account presents a signed token and receives short lived cloud credentials. In AWS this is a role with a web identity trust, and in Azure it is a federated credential on a managed identity or app registration.

## Least privilege

Grant the smallest actions on the smallest scope. Use permission boundaries or service control policies in AWS and Azure Policy with deny assignments to stop dangerous actions regardless of role. Review broad roles such as owner and administrator access first.

## Reviews and emergency access

Review who has access on a schedule and remove what is unused. Keep a break glass account with strong controls, monitored use and a documented process, for the day the identity provider is unavailable.

```diagram
title: Identity and access: IAM, Entra ID and federation
node: idp | Identity provider | 0 | 1 | Single sign on. | Outage. | security
node: aws | AWS roles | 1 | 1 | Federated sessions. | Long lived keys. | security
node: az | Azure role assignments | 2 | 1 | Scoped roles. | Owner everywhere. | security
node: wl | Workload identity | 3 | 1 | Token exchange. | Keys in CI. | security
edge: idp | aws
edge: idp | az
edge: az | wl
```

## Incident: A leaked access key in a build log

> **Incident:** A pipeline stored a long lived cloud key and printed it in a failing step.

```console
$ aws iam list-access-keys --user-name ci-deploy --query "AccessKeyMetadata[].[AccessKeyId,CreateDate,Status]" --output text
AKIAEXAMPLEKEY123456	2024-02-10T08:00:00+00:00	Active
(this is a simulated illustration, not a real incident)
```

A deploy user with a key that never expired had broad permissions, and the key appeared in a log that many people could read. The team deactivated it, replaced the pipeline credential with OIDC federation to a narrowly scoped role, and added a scan for keys in logs and repositories.

## Common mistakes

- Long lived keys in pipelines
- Separate local users in each cloud
- Owner or administrator for everyone
- No review of unused access
- No break glass plan

```quiz
Q: What is better than a stored key in CI?
+ OIDC federation giving short lived credentials
- A longer key :: Worse.
- A shared password :: Worse.
- A text file :: Worse.
> Short lived and automatic.

Q: What does an Azure role assignment combine?
+ A principal, a role definition and a scope
- A bucket and a key :: No.
- A VPC and a subnet :: No.
- A region and a size :: No.
> Scope matters. Review the matching section of this lesson if it is unclear.

Q: Why use one identity provider?
+ One place to grant and remove access
- Fewer logs :: Not the point.
- Cheaper VMs :: No.
- Faster disks :: No.
> Leavers lose access everywhere.

Q: What is a break glass account for?
+ Access when the normal identity provider is unavailable
- Daily work :: No.
- Sharing :: No.
- Testing :: No.
> Monitor its use.
```

```cards
Federation :: Trusting an external identity provider
Entra ID :: Microsoft cloud identity directory
OIDC :: OpenID Connect token based sign in
Break glass :: Emergency access account
```
