---
title: Networking: VPC, VNet, peering and hybrid connectivity
minutes: 13
summary: Design networks that work on both clouds: address planning, peering and transit, private endpoints, DNS, and links between clouds and to on premises.
---

Networking is where multi-cloud designs succeed or fail. Overlapping addresses, missing routes and DNS gaps cost days of debugging.

## What you will learn

- Address planning without overlap
- VPC and VNet building blocks
- Peering, transit and hub and spoke
- Private endpoints and DNS
- Cross cloud and on premises links

## Address planning

Choose non overlapping CIDR ranges for every network in every cloud and on premises before anything is built. Keep a register of allocations. Overlaps cannot be fixed by routing alone and often need address translation or a rebuild.

## Building blocks

An AWS VPC has subnets in availability zones, route tables, security groups and network ACLs. An Azure VNet has subnets, route tables, network security groups and user defined routes. Security groups are stateful in both. Azure subnets span zones, while AWS subnets live in one zone.

## Peering and transit

VPC peering and VNet peering connect two networks but are not transitive. For many networks use a hub: AWS Transit Gateway or Azure Virtual WAN and hub VNets with a firewall. Hub and spoke keeps routing and inspection in one place.

## Private endpoints and DNS

Private endpoints give a service a private address inside your network. They only work if DNS returns that address, so link private DNS zones to the right networks and forward queries between clouds. Most private endpoint failures are DNS failures.

## Cross cloud links

Connect clouds with site to site VPN for modest traffic, or private circuits through a provider for steady, high volume traffic. Plan bandwidth, latency, failover paths and egress costs, because data leaving a cloud is billed.

```diagram
title: Networking: VPC, VNet, peering and hybrid connectivity
node: a | AWS network | 0 | 1 | VPC and transit. | Overlap. | service
node: hub | Hub and firewall | 1 | 1 | Central routing. | Single path. | process
node: z | Azure network | 2 | 1 | VNet and hub. | Missing route. | service
node: dns | Private DNS | 3 | 1 | Resolves endpoints. | Wrong zone. | process
edge: a | hub
edge: hub | z
edge: z | dns
```

## Incident: A private database that nobody could reach

> **Incident:** After moving to private endpoints, the application resolved the public address and timed out.

```console
$ nslookup orders-db.postgres.database.azure.com
Name:    orders-db.postgres.database.azure.com
Address: 20.50.14.9
(this is a simulated illustration, not a real incident)
```

The private DNS zone was linked to the hub network but not to the spoke where the application ran, so the name resolved to the public address that the firewall blocked. Linking the zone to the spoke fixed it, and the team added a DNS check to the pipeline that creates private endpoints.

## Common mistakes

- Overlapping address ranges
- Expecting peering to be transitive
- Private endpoints without private DNS
- A single link between clouds
- Ignoring egress costs

```quiz
Q: Why plan addresses early?
+ Overlaps are hard to fix later
- Addresses are free :: Not the reason.
- DNS needs them :: No.
- Firewalls need them :: No.
> Keep a register.

Q: Is VPC peering transitive?
+ No
- Yes :: No.
- Only in Azure :: Also not transitive.
- Only with DNS :: No.
> Use a hub for many networks.

Q: What usually breaks a private endpoint?
+ DNS resolving the wrong address
- The disk :: No.
- The password only :: Not usually.
- The region name :: No.
> Check the private DNS zone link.

Q: How should critical cross cloud links be built?
+ With more than one path
- A single VPN :: Single point of failure.
- No link :: Not possible.
- Public internet only :: Not private.
> Plan failover. Review the matching section of this lesson if it is unclear.
```

```cards
CIDR :: An address range written with a prefix length
Transit Gateway :: AWS hub connecting many networks
Private endpoint :: A private address for a cloud service
Hub and spoke :: Central network with spokes
```
