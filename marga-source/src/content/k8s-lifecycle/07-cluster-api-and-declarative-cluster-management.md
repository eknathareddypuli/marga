---
title: Cluster API and declarative cluster management
minutes: 12
summary: See how Cluster API treats clusters, machines and control planes as Kubernetes objects, and when declarative lifecycle management beats scripts.
---

Scripts that build clusters tend to drift, and each cluster becomes a one-off. Cluster API takes the same approach Kubernetes uses for apps: describe the cluster you want as objects and let controllers make it so, including upgrades and replacement.

## What you will learn

- The idea of a management cluster and workload clusters
- Cluster, Machine, MachineDeployment and control plane objects
- How an upgrade becomes a version bump
- Providers and what they do
- When it is worth the complexity

## Management and workload clusters

Cluster API runs in a management cluster, which can be a small dedicated cluster. It creates and manages workload clusters, on clouds, on virtual machines or on bare metal, through infrastructure providers. The management cluster holds the desired state of every workload cluster, so protecting it with backups matters.

## The objects

A Cluster object ties the pieces together. A control plane object, commonly a KubeadmControlPlane, describes control plane machines and their kubeadm settings. A MachineDeployment is like a Deployment for worker nodes, with a template and a replica count, and a MachineSet and Machines beneath it. Infrastructure templates describe the cloud specific machine shape.

```yaml
apiVersion: cluster.x-k8s.io/v1beta1
kind: MachineDeployment
metadata:
  name: pool-a
spec:
  clusterName: prod
  replicas: 5
  template:
    spec:
      clusterName: prod
      version: v1.31.2
```

## Upgrades as edits

To upgrade workers, change the version in the MachineDeployment template. The controller creates new machines at that version and removes the old ones, a rolling replacement. For the control plane, change the version in the control plane object, and it replaces control plane machines one at a time, keeping etcd quorum. Scaling is changing a replica count.

## Providers

Providers do the cloud specific work: bootstrap providers create the kubeadm configuration for a machine, infrastructure providers create the virtual machine or server, and control plane providers manage control plane machines. Choose providers that match your platform and check their maturity.

## Is it worth it

For one small cluster, kubeadm and a runbook are simpler. With many clusters, frequent upgrades or a platform team offering clusters as a service, the declarative approach removes drift, makes replacement routine and gives an audit trail through version control. The trade is operating a management cluster and learning its failure modes.

```diagram
title: Cluster API and declarative cluster management
node: mgmt | Management cluster | 0 | 1 | Holds desired state. | Unbacked. | service
node: cluster | Cluster object | 1 | 1 | Describes a cluster. | Wrong version. | store
node: cp | Control plane object | 2 | 0 | Control plane machines. | Quorum risk. | service
node: md | MachineDeployment | 2 | 2 | Worker machines. | Bad template. | process
node: infra | Infrastructure provider | 3 | 1 | Creates machines. | Quota. | external
edge: mgmt | cluster
edge: cluster | cp
edge: cluster | md
edge: md | infra
```

## Incident: A template change that replaced every worker

> **Incident:** A small edit to a machine template rolled all worker nodes at once.

```console
$ kubectl get machines -n prod
NAME            PHASE          VERSION
pool-a-abc12    Provisioning   v1.31.2
pool-a-def34    Provisioning   v1.31.2
pool-a-ghi56    Deleting       v1.30.5
(this is a simulated illustration, not a real incident)
```

A change to a machine template triggers a rolling replacement, and the rollout settings allowed too many machines to be replaced at once for a workload with strict capacity needs. The fix was to set maxUnavailable to one and add PodDisruptionBudgets. Declarative tools make big changes easy, so rollout limits matter more, not less.

## Common mistakes

- Not backing up the management cluster
- Treating machines as pets and editing them by hand
- Setting rollout limits too wide
- Choosing immature providers without testing
- Using it for one small cluster where it adds little

```quiz
Q: Where does Cluster API run?
+ In a management cluster
- Inside each workload node only :: It is separate.
- On the load balancer :: Not there.
- In etcd only :: It runs as controllers.
> It manages workload clusters from outside.

Q: How do you upgrade workers with Cluster API?
+ Change the version in the MachineDeployment template
- SSH to each node :: That defeats the point.
- Delete the cluster :: Too destructive.
- Edit kube-proxy only :: Not the method.
> A rolling replacement follows.

Q: What is a MachineDeployment like?
+ A Deployment for worker nodes
- A Service for control plane :: No.
- A Secret :: No.
- A ConfigMap :: No.
> It has a template and replicas.

Q: What does a provider do?
+ Handles platform specific work such as creating machines
- Provides images only :: Too narrow.
- Provides DNS :: Not its role.
- Provides RBAC :: Not its role.
> Infrastructure and bootstrap providers split the work.
```

```cards
Management cluster :: The cluster that runs Cluster API controllers
Workload cluster :: A cluster managed by Cluster API
MachineDeployment :: A declarative group of worker machines
KubeadmControlPlane :: A control plane object using kubeadm
Provider :: A plugin for infrastructure, bootstrap or control plane work
```
