---
title: Multi-cloud
summary: AWS and Azure service map, identity and checks.
module: multi-cloud
---

## Service map

| Need | AWS | Azure |
|------|-----|-------|
| VM | EC2 | Virtual Machines |
| Scale group | Auto Scaling group | VM scale set |
| Kubernetes | EKS | AKS |
| Object storage | S3 | Blob Storage |
| Queue | SQS | Service Bus |
| Hub network | Transit Gateway | Virtual WAN |

## Identity

| Task | AWS | Azure |
|------|-----|-------|
| Grant access | IAM policy | Role assignment at a scope |
| Guardrail | SCP | Azure Policy |
| Pipeline identity | OIDC role | Federated credential |

## Checks

| Check | Why |
|-------|-----|
| Address ranges | No overlaps |
| Private DNS links | Endpoints resolve |
| Egress estimate | Avoid surprise bills |

## Handy commands

```bash
aws sts get-caller-identity
```

```bash
az account show
```

```bash
aws ec2 describe-vpcs --query 'Vpcs[].CidrBlock'
```

```bash
az network vnet list --query '[].addressSpace.addressPrefixes'
```

```bash
aws ec2 describe-transit-gateways --query 'TransitGateways[].TransitGatewayId'
```

```bash
az network vnet peering list --resource-group RG --vnet-name VNET
```

## Watch out for

> **Warning:** Overlapping address ranges cannot be peered or routed later without renumbering.

> **Warning:** Wildcard federation subjects let any workload assume the role.

> **Warning:** Private endpoints need private DNS linked to every network that calls them.

> **Warning:** A failover that was never rehearsed is a guess, so run a game day each quarter.
