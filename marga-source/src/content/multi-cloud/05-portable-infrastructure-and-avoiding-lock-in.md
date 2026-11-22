---
title: Portable infrastructure and avoiding lock in
minutes: 12
summary: Decide what to make portable and what to accept as cloud specific: Kubernetes, Terraform modules, open data formats and a thin abstraction layer.
---

Complete portability is expensive and rarely needed. Choose a few seams where moving would be possible, and use cloud services without guilt everywhere else.

## What you will learn

- Lock in is a cost, not a sin
- Portable layers: containers, Kubernetes, open standards
- Terraform across clouds: shared patterns, separate modules
- Data gravity and egress cost
- A decision record for each dependency

## Lock in as a cost

Every managed service saves effort now and costs flexibility later. Measure both. A queue that could be swapped in a week is cheap lock in. A proprietary database used by forty services is expensive lock in. Decide on purpose, not by accident.

## Portable layers

Containers and Kubernetes run in both clouds with the same manifests. Open protocols such as PostgreSQL, Kafka and OpenTelemetry keep data and telemetry movable. Keep application code free of cloud SDK calls by hiding them behind a small interface.

## Terraform

A single Terraform language does not make the resources portable, because AWS and Azure resources are different. Share structure, naming, tagging and testing patterns, and keep one module per capability per cloud behind a common set of inputs. Pretending an S3 bucket and an Azure storage account are the same resource usually creates a bad abstraction.

## Data gravity

Data is the hardest thing to move. Large datasets take time and money to copy out, and applications that read them become tied to their location. Place compute near the data and move results, not raw data, between clouds.

## Decision records

For every significant cloud specific service write a short record: why chosen, the exit path and the estimated cost to leave. Review them each year. When the exit path is unknown, that is the finding.

```diagram
title: Portable infrastructure and avoiding lock in
node: app | Application code | 0 | 1 | Small interface. | SDK calls everywhere. | process
node: k8s | Kubernetes layer | 1 | 1 | Same manifests. | Cloud specific CRDs. | service
node: data | Open data formats | 2 | 1 | Postgres, Parquet. | Proprietary. | store
node: adr | Decision records | 3 | 1 | Exit path noted. | Not written. | observe
edge: app | k8s
edge: k8s | data
edge: data | adr
```

## Incident: A migration estimate that was off by months

> **Incident:** Moving a service between clouds revealed hundreds of calls to a proprietary API.

```console
$ grep -r --include=*.py -l "boto3" src | wc -l
212
(this is a simulated illustration, not a real incident)
```

Cloud SDK calls were spread through 212 files, so moving the storage layer meant touching nearly every service. The team introduced a small storage interface, moved new code to it first and recorded the exit cost for each proprietary service in a decision record.

## Common mistakes

- Treating all lock in as bad
- Hiding two different resources behind one fake abstraction
- Cloud SDK calls scattered everywhere
- Ignoring egress costs and data gravity
- No exit path for key services

```quiz
Q: Is all lock in bad?
+ No, it is a cost to weigh against benefits
- Yes always :: Too absolute.
- It does not exist :: It does.
- Only for databases :: Not only.
> Decide on purpose.

Q: What makes Kubernetes workloads portable?
+ Standard APIs and manifests that run on both clouds
- One cloud load balancer :: Specific.
- Local disks :: No.
- Manual setup :: No.
> Keep cloud specific parts thin.

Q: Why is data hard to move?
+ Size, time, egress cost and tied applications
- It is secret :: No.
- It is small :: No.
- It is free to copy :: Not true.
> Data gravity. Review the matching section of this lesson if it is unclear.

Q: What goes in a decision record?
+ Why chosen, exit path and cost to leave
- Only a price :: Not enough.
- A logo :: No.
- A password :: No.
> Review yearly. Review the matching section of this lesson if it is unclear.
```

```cards
Lock in :: Cost of moving away from a provider
Data gravity :: Data attracts the applications that use it
Egress :: Data leaving a cloud, usually billed
Abstraction layer :: A small interface hiding provider details
```
