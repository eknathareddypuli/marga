---
title: Cluster API and fleet lifecycle
minutes: 12
summary: Manage the lifecycle of many Kubernetes clusters declaratively with Cluster API: management clusters, machine templates, upgrades and day two operations.
---

Creating a cluster is easy. Keeping fifty of them patched, consistent and replaceable is the real work. Cluster API treats clusters themselves as Kubernetes objects.

## What you will learn

- Management cluster and workload clusters
- Providers and machine templates
- Upgrades and rolling replacement
- Cluster classes and consistent fleets
- Backup, recovery and day two operations

## Management and workload clusters

A management cluster runs the Cluster API controllers. It creates and manages workload clusters on a chosen infrastructure through provider controllers for clouds or bare metal. Protect the management cluster, back it up and keep it small, because it holds the desired state of the whole fleet.

## Providers and templates

A Cluster object points to a control plane object and an infrastructure object. Machine templates describe the size and image of nodes, and a MachineDeployment keeps a number of machines running. Changing the template creates new machines and replaces the old ones in a rolling way.

## Upgrades

To upgrade, change the Kubernetes version on the control plane object, wait for it to roll, then update the machine deployments. Upgrades replace machines rather than patch them in place. Test on a canary cluster first, check workload disruption budgets and skip no more than the supported number of minor versions.

## Cluster classes

A ClusterClass defines a reusable cluster shape with variables. Clusters created from it stay consistent, and a change to the class can be rolled out to many clusters. This avoids a fleet where every cluster is slightly different.

## Day two

Plan backups of the management cluster, certificate renewal, node health checks with automatic remediation and a runbook for replacing a failed control plane member. Monitor machine and cluster conditions, not only Kubernetes metrics.

```diagram
title: Cluster API and fleet lifecycle
node: mgmt | Management cluster | 0 | 1 | Desired state. | Lost. | service
node: cls | ClusterClass | 1 | 1 | Shared shape. | Drift. | store
node: md | Machine deployments | 2 | 1 | Rolling nodes. | Stuck. | process
node: wl | Workload clusters | 3 | 1 | Run apps. | Unpatched. | service
edge: mgmt | cls
edge: cls | md
edge: md | wl
```

## Incident: An upgrade that stalled halfway

> **Incident:** A control plane upgrade stopped after the first machine and left the cluster mixed.

```console
$ kubectl get machines -n fleet -l cluster.x-k8s.io/cluster-name=prod-eu
NAME            PHASE        VERSION
prod-eu-cp-0    Running      v1.31.2
prod-eu-cp-1    Provisioning v1.32.1
(this is a simulated illustration, not a real incident)
```

The new machine could not start because the machine image for the new version was not available in the region, so the rollout waited. The team found the image error in the machine conditions, published the image, and added a pre upgrade check that confirms images and quotas exist in every region before a rollout.

## Common mistakes

- A management cluster with no backup
- Clusters that differ from each other
- Upgrading production first
- Skipping minor versions
- No pre checks for images and quotas

```quiz
Q: What does a management cluster do?
+ Runs Cluster API controllers and stores desired state of clusters
- Runs user apps :: Not its job.
- Stores images :: No.
- Replaces DNS :: No.
> Protect it. Review the matching section of this lesson if it is unclear.

Q: How are nodes upgraded in Cluster API?
+ By replacing machines with new ones
- Patching in place :: Not the approach.
- Rebooting :: Not enough.
- Deleting the cluster :: No.
> Rolling replacement.

Q: What is a ClusterClass for?
+ A reusable cluster shape that keeps a fleet consistent
- A container image :: No.
- A secret :: No.
- A dashboard :: No.
> Avoid drift. Review the matching section of this lesson if it is unclear.

Q: What should be checked before an upgrade?
+ Images, quotas and disruption budgets
- Colour themes :: No.
- Nothing :: Risky.
- Only cost :: Not enough.
> Fail early. Review the matching section of this lesson if it is unclear.
```

```cards
Cluster API :: Kubernetes API for managing clusters
MachineDeployment :: A set of machines kept at a count
ClusterClass :: A template for consistent clusters
Remediation :: Automatic replacement of an unhealthy machine
```
