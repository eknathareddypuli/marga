---
title: Platform APIs with Crossplane and operators
minutes: 14
summary: Use the Kubernetes control plane pattern to offer your own infrastructure APIs: a developer files a small resource, a controller reconciles it into cloud resources, and the platform keeps it correct over time.
---

A form or a pipeline creates things once. A control plane keeps them right. Kubernetes popularised the idea: you declare the state you want, and controllers continuously work to make reality match. Platform teams reuse that pattern to offer their own APIs, such as `Database` or `Environment`, and let controllers do the work behind them.

## What you will learn

- Why a declarative API suits infrastructure
- How Crossplane compositions map a simple request to cloud resources
- When to write an operator or controller instead
- How to keep the abstraction honest

## Declare, then reconcile

In an imperative script, you tell the system what steps to run. In a declarative API, you say what should exist, and a controller compares desired state with actual state and acts on the difference. It repeats forever, so drift is corrected and failures are retried. The same loop that restarts a crashed pod can recreate a deleted bucket or resize a database.

This gives platforms three useful properties: a single source of truth for what was asked, automatic repair, and an API that other tools can read, such as the catalog or a pipeline.

## Crossplane in outline

Crossplane extends Kubernetes so that cloud resources are managed as Kubernetes objects. The core ideas are:

- **Providers** that know how to talk to a cloud or service and expose its resources as managed resources
- **Composite resource definitions** that define your own API, with a schema
- **Compositions** that map one of your API objects onto several managed resources and decide the defaults

A developer writes a short object. The platform team has already decided what it expands into.

```yaml
apiVersion: platform.example.org/v1alpha1
kind: Database
metadata:
  name: orders
  namespace: team-payments
spec:
  engine: postgres
  size: small
  environment: dev
```

Behind that, a composition might create a database instance, a subnet group, a backup schedule and a secret holding the connection details, with the size mapped to concrete instance classes. Crossplane's APIs and recommended structure have changed between versions, so use the documentation for the version you run when you write real definitions.

## Why not give people the cloud API directly?

Cloud APIs are wide and powerful. A developer who wants "a small Postgres" would have to choose among dozens of options, any of which might violate policy, cost too much or lack backups. A platform API narrows the choices to the ones the company supports, bakes in encryption, backups, tags and network placement, and gives each request a clear owner and namespace. It also lets you change the implementation, for example moving from one instance type to another, without every team rewriting its configuration.

## When to write an operator

Compositions cover the common case of mapping one object to several resources. When you need custom logic, such as running a step-by-step migration, calling an internal system or managing a stateful workload, a custom controller or operator is the tool. Frameworks such as Kubebuilder help. Prefer composition when it is enough, because a custom controller is code you must test, run and upgrade.

## Keep the abstraction honest

Abstractions leak. Decide in advance what the user can see and change, and what they cannot. Show the status of the underlying resources in the object's status, with clear conditions such as `Ready` and a message when something fails. Document the escape hatch for needs the abstraction does not cover. Version the API and plan migrations, because teams will depend on it.

## Check a request against supported sizes

Here is a small stand-in for the logic a composition applies: map a friendly size to concrete settings and refuse anything outside the supported set.

```python
SIZES = {
    "small": {"cpu": 2, "memory_gb": 8, "storage_gb": 50},
    "medium": {"cpu": 4, "memory_gb": 16, "storage_gb": 200},
}
ENGINES = {"postgres", "mysql"}

def expand(spec):
    if spec["engine"] not in ENGINES:
        raise ValueError("engine not supported: " + spec["engine"])
    if spec["size"] not in SIZES:
        raise ValueError("size not supported: " + spec["size"])
    plan = dict(SIZES[spec["size"]])
    plan.update(engine=spec["engine"], backups=True, encrypted=True, tags={"env": spec["environment"]})
    return plan

print(expand({"engine": "postgres", "size": "small", "environment": "dev"}))
```

## Operate the control plane like a product

The controllers are production software. Monitor reconcile errors and queue depth. Alert on resources stuck not-ready. Back up the control plane state. Plan upgrades of the controllers and providers, and test them against a copy of real resources first. A broken provider upgrade can stall changes everywhere.

```diagram
title: A request becomes cloud resources
node: req | Database object | 0 | 1 | A short request in the team's namespace. | Free-form options that bypass policy. | service
node: api | Platform API | 1 | 1 | Schema, defaults and validation. | Breaking changes without versions. | process
node: comp | Composition | 2 | 1 | Maps the request to managed resources. | Hidden defaults nobody documented. | process
node: prov | Provider | 3 | 1 | Calls the cloud API. | Credentials with too much access. | security
node: cloud | Cloud resources | 4 | 1 | Instance, backup, subnets and secret. | Drift from manual changes. | store
node: stat | Status | 2 | 3 | Conditions reported back to the user. | Errors hidden in controller logs. | observe
edge: req | api
edge: api | comp
edge: comp | prov
edge: prov | cloud
edge: cloud | stat
edge: stat | req | visible to user
```

## Incident: Ready, but not really

> **Incident:** A team created a Database object, saw it as "created", and began deploying. The instance never came up because of a quota limit, and the application failed for an hour.

```console
$ kubectl get database orders -n team-payments
NAME     READY   SYNCED   AGE
orders   False   True     41m
(this is a simulated illustration, not a real incident)
```

The object had been accepted, but the readiness condition was false because the provider hit a quota error that only appeared in controller logs. The platform team surfaced the cloud error message in the object's status, added an alert for resources not ready after ten minutes, and wrote the quota check into the pre-request validation.

## Common mistakes

- Exposing the full cloud API instead of a narrow, supported one
- Writing a custom controller when a composition would do
- Hiding underlying errors from users
- Changing an API without versioning and a migration path
- Giving the provider far more cloud permissions than the APIs need

```quiz
Q: What does a controller do in a declarative system?
+ It compares desired and actual state and acts on differences, repeatedly
- It runs a script once and exits :: That is imperative.
- It stores logs only :: Logging is separate.
- It replaces the need for an API :: It acts on the API's objects.
> The reconcile loop is what keeps resources correct over time.

Q: What is the role of a Crossplane composition?
+ To map a simple platform object onto several managed cloud resources with defaults
- To store container images :: That is a registry.
- To scan code for secrets :: That is a scanner.
- To replace Kubernetes :: It runs on Kubernetes.
> Compositions encode the platform team's decisions behind a simple API.

Q: When is a custom operator a better choice than a composition?
+ When you need custom logic such as ordered migrations or calls to internal systems
- Whenever possible, because it is simpler :: It is more code to maintain.
- Never, they are identical :: They differ in flexibility and cost.
- Only for static websites :: Unrelated.
> Use code when mapping resources is not enough.

Q: Why report underlying errors in the object's status?
+ So users can see why a request is not ready without reading controller logs
- To make the status longer :: Length is not the aim.
- To hide the cloud :: The goal is visibility.
- To avoid alerts :: Alerts are still useful.
> Good status conditions turn a black box into something users can act on.
```

```cards
Declarative API :: An interface where you state the desired result and a system works to reach it
Reconcile loop :: A controller's repeated comparison of desired and actual state
Composite resource :: A user-facing object that expands into several managed resources
Composition :: The mapping that turns a composite resource into concrete resources
Operator :: A custom controller that manages an application or service on Kubernetes
```
