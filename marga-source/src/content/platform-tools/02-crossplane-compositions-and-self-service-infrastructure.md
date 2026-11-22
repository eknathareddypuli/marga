---
title: Crossplane: compositions and self service infrastructure
minutes: 13
summary: Offer infrastructure as Kubernetes APIs with Crossplane: providers, managed resources, compositions and claims, and how to run it safely.
---

Crossplane lets a platform team publish a simple API such as Database and keep the cloud details behind it. Developers ask for what they need, and the platform decides how it is built.

## What you will learn

- Providers and managed resources
- Composite resource definitions and compositions
- Claims: the developer facing API
- Reconciliation, drift and deletion policy
- Operating Crossplane and choosing it over Terraform

## Providers

A provider is a controller that manages resources in an external system, such as AWS, Azure or Kubernetes. Each external resource appears as a managed resource object in the cluster. The controller creates it, watches it and keeps it matching the spec, which also corrects drift.

## Compositions

A composite resource definition declares a new API with a schema, for example a PostgreSQLInstance with size and region fields. A composition maps that API to concrete managed resources: a database instance, a subnet group, a secret. The platform team owns the composition and can change what runs behind the API.

## Claims

Developers create a claim in their namespace. Crossplane builds the composite resource and the managed resources behind it, and writes connection details to a secret in the same namespace. The developer never needs cloud credentials or knowledge of the underlying resources.

## Drift and deletion

Controllers keep reconciling, so manual changes in the cloud console are reverted or reported. Set the deletion policy deliberately. With Delete the cloud resource is removed when the object is deleted, and with Orphan it is kept. For databases use protective settings, backups and review before deletion.

## Operations

Pin provider versions, test compositions with sample claims and render them before release, monitor reconcile errors and API rate limits, and limit what the provider credentials can do. Choose Crossplane when you want a Kubernetes native API with continuous reconciliation, and Terraform when plan and apply workflows suit the team better.

```diagram
title: Crossplane: compositions and self service infrastructure
node: dev | Developer claim | 0 | 1 | Simple request. | Wrong size. | external
node: xrd | Composite API | 1 | 1 | Schema. | Breaking change. | process
node: comp | Composition | 2 | 1 | Maps to resources. | Untested. | process
node: prov | Provider and cloud | 3 | 1 | Creates resources. | Credentials. | service
edge: dev | xrd
edge: xrd | comp
edge: comp | prov
```

## Incident: A deleted claim that removed a production database

> **Incident:** A developer deleted a namespace and the database behind the claim was deleted with it.

```console
$ kubectl get postgresqlinstance orders-db -n shop -o jsonpath="{.spec.deletionPolicy}"
Delete
(this is a simulated illustration, not a real incident)
```

The composition used the default Delete policy and had no backup or protection. When the namespace was removed, the claim, the composite resource and the cloud database all went with it. The platform team changed the production composition to Orphan with final snapshots, added a policy that blocks namespace deletion when claims exist, and documented the choice in the API.

## Common mistakes

- Default deletion policy for production data
- Changing a composition without tests
- Unpinned provider versions
- Provider credentials with broad access
- Exposing every cloud setting in the claim

```quiz
Q: What does a claim give a developer?
+ A simple namespaced request for infrastructure
- Cloud credentials :: Not given.
- A new cluster :: No.
- A VM image :: No.
> The platform hides the details.

Q: Who owns a composition?
+ The platform team
- Every developer :: No.
- The cloud provider :: No.
- The auditor :: No.
> It defines what runs behind the API.

Q: What does the Orphan deletion policy do?
+ Keeps the cloud resource when the object is deleted
- Deletes everything :: That is Delete.
- Blocks creation :: No.
- Hides secrets :: No.
> Use it for important data.

Q: Why pin provider versions?
+ To avoid surprise behaviour changes
- To save disk :: No.
- To hide errors :: No.
- To speed up :: No.
> Test before upgrading.
```

```cards
Managed resource :: A cloud resource represented in Kubernetes
Composition :: A mapping from a platform API to resources
Claim :: A namespaced request for a composite resource
Deletion policy :: What happens to the cloud resource on delete
```
