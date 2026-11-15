---
title: Version skew and upgrade strategy
minutes: 12
summary: Learn the supported version skew rules and plan upgrades one minor version at a time with checks before, during and after each step.
---

Kubernetes releases a minor version about every four months, and each is supported for roughly a year. Staying inside the support window means upgrading regularly, and upgrading safely means respecting the skew rules between components.

## What you will learn

- Supported version skew between components
- Why skipping minor versions is not allowed
- The upgrade order
- Pre-flight checks: deprecations, add-ons, backups
- In-place and replace strategies

## Skew rules

The API server is the reference. The controller manager and scheduler may be at most one minor version older than the API server. Kubelets may be up to three minor versions older in recent releases, never newer. kubectl may be one minor version newer or older. kube-proxy must match the kubelet on its node. Check the current policy for your version, since the numbers have changed over time.

## One minor at a time

A cluster must move through each minor version in turn. Upgrading from 1.29 to 1.31 means 1.29 to 1.30, then 1.30 to 1.31. Patch versions can be skipped within a minor. The reason is that API conversion and storage migrations are tested only between adjacent versions.

## The order

Upgrade the control plane first, one node at a time, then the workers. On the first control plane node run `kubeadm upgrade plan` and `kubeadm upgrade apply`. On other control plane nodes run `kubeadm upgrade node`. For every node, drain it, upgrade the kubelet and kubectl packages, restart the kubelet and uncordon.

```bash
sudo kubeadm upgrade plan
sudo kubeadm upgrade apply v1.31.2
kubectl drain cp2 --ignore-daemonsets --delete-emptydir-data
sudo systemctl daemon-reload && sudo systemctl restart kubelet
kubectl uncordon cp2
```

## Before you start

Read the release notes for deprecations and removed APIs. Run a tool such as kubent or pluto, or check apiserver_requested_deprecated_apis, to find manifests that use APIs about to be removed. Confirm that add-ons, the CNI plugin, ingress controller and operators support the target version. Take an etcd snapshot. Check that PodDisruptionBudgets will not block draining.

## In place or replace

In place upgrades update the existing nodes, as above. The replace strategy builds new nodes at the new version, joins them, drains the old ones and deletes them. Replacement is cleaner for workers, especially with autoscaling groups or Cluster API, and gives a fast rollback because the old nodes still exist until you remove them. Control plane nodes with etcd data are usually upgraded in place or replaced one at a time with care.

```diagram
title: Version skew and upgrade strategy
node: plan | Plan and backup | 0 | 1 | Release notes and snapshot. | Skipped. | observe
node: cp | Control plane | 1 | 1 | One node at a time. | Skew breach. | service
node: wk | Workers | 2 | 1 | Drain, upgrade, uncordon. | PDB blocks. | process
node: add | Add-ons | 3 | 1 | Match versions. | Incompatible CNI. | service
node: ver | Verify | 4 | 1 | Nodes and workloads. | No smoke test. | observe
edge: plan | cp
edge: cp | wk
edge: wk | add
edge: add | ver
```

## Incident: A removed API found after the upgrade

> **Incident:** After an upgrade a deployment pipeline began failing on every apply.

```console
$ kubectl apply -f ingress.yaml
error: resource mapping not found for name: "web" namespace: "shop" from "ingress.yaml": no matches for kind "Ingress" in version "extensions/v1beta1"
$ kubectl api-versions | grep networking
networking.k8s.io/v1
(this is a simulated illustration, not a real incident)
```

The manifests still used an API version that had been removed several releases earlier, and the upgrade finally crossed the removal. Scanning manifests and live objects for deprecated APIs before the upgrade would have shown it. Fix the manifests, then add the scan to the release checklist.

## Common mistakes

- Skipping a minor version
- Upgrading workers before the control plane
- Draining without checking PodDisruptionBudgets
- Upgrading without a snapshot
- Ignoring add-on compatibility

```quiz
Q: Which component upgrades first?
+ The control plane
- The workers :: Kubelets must not be newer than the API server.
- kubectl only :: It is not the cluster.
- The CNI plugin :: Check compatibility, but control plane is first.
> The API server is the reference version.

Q: Can you upgrade from 1.29 directly to 1.31?
+ No, go through 1.30
- Yes always :: Skipping minors is unsupported.
- Yes with a flag :: There is no such flag.
- Only on cloud :: The rule applies everywhere.
> Only adjacent minor versions are tested.

Q: Which command shows available target versions?
+ kubeadm upgrade plan
- kubeadm upgrade list :: No such command.
- kubectl version --upgrade :: Not a thing.
- kubelet plan :: No such command.
> It also shows the component versions.

Q: Why drain a node before upgrading its kubelet?
+ To move its pods gracefully
- To save disk :: Not the reason.
- To reset certificates :: Not the reason.
- To rename the node :: Not the reason.
> Draining cordons the node and evicts pods.
```

```cards
Version skew :: The permitted difference between component versions
Deprecated API :: An API version that will be removed in a later release
kubeadm upgrade plan :: A command that shows upgrade options
Drain :: Cordon a node and evict its pods
In place upgrade :: Upgrading existing nodes instead of replacing them
```
