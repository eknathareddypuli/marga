---
title: Service mapping: compute, storage and databases
minutes: 13
summary: Map AWS and Azure services to each other for compute, storage, databases and messaging, and learn where equivalent names hide different behaviour.
---

Engineers who know one cloud often assume the other works the same way. The names are similar, the defaults are not, and the differences cause most multi-cloud surprises.

## What you will learn

- Compute: EC2, Auto Scaling and Azure VMs, scale sets
- Containers and Kubernetes: EKS and AKS
- Object, block and file storage
- Managed databases and messaging
- Where equivalents differ

## Compute

An EC2 instance maps to an Azure virtual machine, and an Auto Scaling group maps to a virtual machine scale set. Instance families, burst rules, spot and low priority behaviour, and the way disks attach all differ. Learn sizing names for both, and verify quotas in each region.

## Containers

EKS and AKS are managed Kubernetes control planes. Node group handling, default networking plugins, identity integration and upgrade cadence differ. Keep workloads on standard Kubernetes APIs and treat the cloud specific parts, such as load balancers and storage classes, as a thin layer.

## Storage

S3 maps to Azure Blob Storage, EBS to managed disks and EFS to Azure Files. Consistency, tiering names, replication options and request pricing differ. Check durability and redundancy settings explicitly, such as zone redundant or geo redundant storage.

## Databases and messaging

RDS maps to Azure Database services, DynamoDB to Cosmos DB, SQS and SNS to Service Bus and Event Grid, and Kinesis to Event Hubs. APIs and guarantees differ. For example, ordering, delivery and throughput limits are not interchangeable, so check each service documentation before assuming parity.

## Where equivalents differ

Look at limits, default encryption, backup retention, failover behaviour and billing units. A service with the same purpose can have different maximum sizes, different recovery behaviour and a different cost model. Keep a living mapping table with notes on the differences you find.

```diagram
title: Service mapping: compute, storage and databases
node: aws | AWS service | 0 | 1 | EC2, S3, RDS. | Assumed parity. | service
node: map | Mapping table | 1 | 1 | Notes on differences. | Out of date. | store
node: az | Azure service | 2 | 1 | VMs, Blob, SQL. | Different default. | service
node: app | Application | 3 | 1 | Uses a thin layer. | Hard coded. | process
edge: aws | map
edge: map | az
edge: az | app
```

## Incident: A queue that did not behave like the other cloud

> **Incident:** A team moved a worker from SQS to Service Bus and messages arrived twice.

```console
$ az servicebus queue show --resource-group rg-app --namespace-name sb-app --name jobs --query "{lock:lockDuration,maxDelivery:maxDeliveryCount}" -o json
{"lock":"PT1M","maxDelivery":10}
(this is a simulated illustration, not a real incident)
```

The worker took ninety seconds per message and the lock duration was one minute, so the message was delivered again while the first copy was still running. The team raised the lock duration, made the handler idempotent and recorded the difference between visibility timeout and message lock in the mapping table.

## Common mistakes

- Assuming a similar name means the same behaviour
- Ignoring quotas and limits in the second cloud
- Not checking default redundancy settings
- No mapping document
- Rewriting everything instead of choosing a thin layer

```quiz
Q: What does an Auto Scaling group map to in Azure?
+ A virtual machine scale set
- A storage account :: No.
- A key vault :: No.
- A DNS zone :: No.
> Same job, different details.

Q: Why check limits when mapping services?
+ Equivalent services often have different limits and behaviour
- They are identical :: Not true.
- Limits never matter :: They do.
- Only price differs :: Not only price.
> Parity must be verified.

Q: Which storage service is the Azure counterpart of S3?
+ Blob Storage
- Azure Files :: That maps to EFS.
- Managed disks :: That maps to EBS.
- Key Vault :: No.
> Object storage.

Q: How do you keep a mapping useful?
+ Keep notes on differences and update them
- Print it once :: It goes stale.
- Hide it :: No.
- Avoid it :: No.
> A living document.
```

```cards
Scale set :: Azure group of identical virtual machines
Blob Storage :: Azure object storage
Service Bus :: Azure enterprise messaging
Parity :: Same behaviour across services
```
