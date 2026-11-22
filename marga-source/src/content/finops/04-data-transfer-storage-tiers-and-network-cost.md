---
title: Data transfer, storage tiers and network cost
minutes: 13
summary: Understand the costs that surprise teams: data transfer between zones, regions and the internet, NAT gateways, storage classes and lifecycle rules, and how to design to reduce them.
---

Compute is visible, but data movement is billed per gigabyte and hides in plain sight. A design that looks neat on a diagram can send terabytes across a paid boundary every day.

## What you will learn

- What data transfer costs and where
- NAT gateways, endpoints and private paths
- Storage classes and lifecycle rules
- Logs, backups and snapshots that grow quietly
- Designing to keep traffic cheap

## Where transfer is charged

Traffic into a cloud is usually free. Traffic out to the internet is charged per gigabyte. Traffic between regions is charged, and traffic between availability zones is often charged in both directions. Traffic inside a zone is normally free. Learn the rules for your provider, because they differ in detail and change over time.

## NAT and endpoints

A NAT gateway charges per hour and per gigabyte processed, so a service that downloads large files from object storage through it pays twice. Gateway or private endpoints to the storage and registry services avoid that path. Check the flow logs for the biggest talkers before choosing a fix.

## Storage tiers

Object storage has classes for frequent, infrequent and archive access, with lower storage prices but retrieval fees and minimum durations. Lifecycle rules move or expire objects by age or prefix automatically. Use intelligent tiering when access patterns are unknown, and avoid moving tiny objects, where request fees can exceed the saving.

## Quiet growth

Logs, backups and snapshots grow for ever unless something removes them. Set retention for each log group, expire old snapshots with a policy and compress what you keep. Check storage by prefix or bucket each month and look for the one that doubled.

## Design for cheap traffic

Keep chatty services in the same zone when reliability allows, cache at the edge, compress payloads, and put the processing next to the data instead of copying data to the processing. For disaster recovery, replicate only what the recovery objective requires.

```diagram
title: Data transfer, storage tiers and network cost
node: app | Application | 0 | 1 | Sends data. | Chatty. | service
node: nat | NAT or endpoint | 1 | 1 | Per GB charge. | Wrong path. | service
node: store | Object storage | 2 | 1 | Tiers and lifecycle. | No rules. | store
node: net | Internet or region | 3 | 1 | Egress charge. | Unplanned. | external
edge: app | nat
edge: nat | store
edge: store | net
```

## Incident: The NAT gateway that cost more than the servers

> **Incident:** A new data job doubled the network line of the bill within a week.

```console
$ aws ec2 describe-nat-gateways --query "NatGateways[].NatGatewayId" --output text
nat-0abc123
$ aws cloudwatch get-metric-statistics --namespace AWS/NATGateway --metric-name BytesOutToDestination --dimensions Name=NatGatewayId,Value=nat-0abc123 --start-time 2026-11-01T00:00:00Z --end-time 2026-11-08T00:00:00Z --period 86400 --statistics Sum
Sum 9.2e12
(this is a simulated illustration, not a real incident)
```

The job read hundreds of gigabytes a day from object storage in the same region, but through the NAT gateway, which charged for every gigabyte. Adding a gateway endpoint for the storage service sent that traffic over a private path at no processing charge. The team then added a cost check for any new job that moves more than a set volume.

## Common mistakes

- Ignoring cross zone traffic
- Reading object storage through a NAT gateway
- Archive tiers for data that is read often
- No retention on logs and snapshots
- Copying all data to a second region by default

```quiz
Q: How can a job reduce NAT gateway cost?
+ Use a gateway endpoint for storage traffic
- Add more NAT gateways :: Raises cost.
- Disable encryption :: No.
- Use larger instances :: No.
> Private endpoints avoid the per gigabyte NAT charge.

Q: What do lifecycle rules do?
+ Move or expire objects automatically by age or prefix
- Encrypt keys :: No.
- Speed up the CPU :: No.
- Create networks :: No.
> They stop storage growing without limit.

Q: Which traffic is usually free?
+ Traffic into the cloud and inside one zone
- Traffic to the internet :: Charged.
- Between regions :: Charged.
- All traffic :: No.
> Check the provider rules.

Q: Why not archive all data?
+ Retrieval fees and minimum durations can cost more
- Archive is slow to write :: Not the main issue.
- It breaks backups :: No.
- It needs a licence :: No.
> Match the tier to the access pattern.
```

```cards
Egress :: Data leaving a cloud or region
NAT gateway :: A managed service for outbound internet access
Gateway endpoint :: A private path to a provider service
Lifecycle rule :: A rule that moves or deletes objects by age
```
