---
title: CKA: cluster setup with kubeadm and upgrades
minutes: 14
summary: Practise the cluster architecture tasks: prepare nodes, bootstrap a control plane and join workers with kubeadm, install a network plugin, upgrade a cluster one minor version, and manage nodes safely.
---

Cluster architecture, installation and configuration is about a quarter of the CKA. The tasks are procedural and well documented, which makes them good points for a prepared candidate. The Kubernetes module covers the concepts of the control plane and upgrades. This lesson turns them into the exact sequences you type, and what to check after each.

## What you will learn

- Preparing nodes and bootstrapping with kubeadm
- Joining workers and installing a pod network
- Upgrading a cluster by one minor version
- Draining, cordoning and basic high availability concepts

## Prepare the nodes

kubeadm expects a Linux host with a container runtime, the kubelet, kubeadm and kubectl installed. Before initialising, the usual preparation is: swap disabled, required kernel modules loaded, sysctl values for bridged traffic and IP forwarding set, unique hostnames and MAC addresses, and open ports between nodes. A task may give you nodes that are partly prepared; check each of these rather than assuming.

```bash
swapoff -a
lsmod | grep br_netfilter
sysctl net.ipv4.ip_forward
systemctl status containerd
```

## Bootstrap the control plane

```bash
kubeadm init --pod-network-cidr=10.244.0.0/16 --kubernetes-version=v1.31.0
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
kubectl get nodes
```

The pod network range must match what your network plugin expects. After init, the node shows `NotReady` until a network plugin is installed. Apply the plugin's manifest following its documentation. Then check `kubectl get pods -n kube-system` until system pods are running.

## Join workers

The init output prints a join command with a token and a CA certificate hash. If it has expired or you lost it, create a new one on the control plane:

```bash
kubeadm token create --print-join-command
```

Run the printed command as root on the worker. Then `kubectl get nodes` on the control plane should list it, and it becomes `Ready` once the network plugin is running there. For a highly available control plane, kubeadm supports additional control plane nodes behind a stable endpoint, using `--control-plane-endpoint` at init and `--control-plane` on join. Know the idea, and follow the docs for the exact flags.

## Upgrade one minor version

Kubernetes supports upgrading one minor version at a time. Never skip a minor version. The documented order is control plane first, then workers, node by node. On the first control plane node:

```bash
apt-get update
apt-cache madison kubeadm | head
apt-mark unhold kubeadm
apt-get install -y kubeadm='1.31.1-*'
apt-mark hold kubeadm
kubeadm version
kubeadm upgrade plan
kubeadm upgrade apply v1.31.1
```

Then upgrade the kubelet and kubectl on that node, after draining it:

```bash
kubectl drain cp1 --ignore-daemonsets
apt-mark unhold kubelet kubectl
apt-get install -y kubelet='1.31.1-*' kubectl='1.31.1-*'
apt-mark hold kubelet kubectl
systemctl daemon-reload
systemctl restart kubelet
kubectl uncordon cp1
```

On each worker, run `kubeadm upgrade node` after installing the new kubeadm, then drain, upgrade the kubelet, restart it and uncordon. Version numbers above are only an example; use the versions given in the task. On extra control plane nodes, use `kubeadm upgrade node` instead of `apply`.

## Drain, cordon and uncordon

`kubectl cordon` marks a node unschedulable but leaves running pods. `kubectl drain` cordons and also evicts pods, respecting disruption budgets; it needs `--ignore-daemonsets` because daemon set pods cannot be evicted, and `--delete-emptydir-data` when pods use emptyDir volumes. `kubectl uncordon` makes the node schedulable again. Remember to uncordon after maintenance; leaving a node cordoned is a common lost point.

## Other configuration tasks

The curriculum also covers managing role-based access (next lessons), using Helm and Kustomize to install cluster components, understanding extension interfaces such as CNI, CSI and CRI, and working with custom resource definitions and operators. Practise a basic Helm install and upgrade and a Kustomize overlay, because short tasks appear around them.

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install web bitnami/nginx -n web --create-namespace --set replicaCount=2
helm list -A
kubectl kustomize ./overlays/prod
kubectl apply -k ./overlays/prod
```

## Check what you did

After any cluster change, verify: nodes Ready, system pods Running, and a test workload schedules and can reach a service. Certificates created by kubeadm expire after a year unless upgraded, and `kubeadm certs check-expiration` lists them.

```python
nodes = {"cp1": "1.31.1", "w1": "1.31.0", "w2": "1.31.0"}
target = "1.31.1"
todo = [n for n, v in nodes.items() if v != target]
print("nodes still to upgrade:", todo)
# upgrade order: control plane first, then workers one at a time
order = ["cp1", "w1", "w2"]
print([n for n in order if n in todo])
```

```diagram
title: Upgrading one minor version
node: plan | kubeadm upgrade plan | 0 | 1 | Shows available versions and checks. | Planning a jump across minors. | observe
node: cp | Control plane node | 1 | 1 | upgrade apply, then kubelet. | Skipping the drain. | process
node: drain | Drain a worker | 2 | 0 | Evict pods, respect budgets. | Forgetting ignore-daemonsets. | process
node: wk | Upgrade worker | 3 | 0 | upgrade node, kubelet restart. | Wrong package version. | process
node: un | Uncordon | 4 | 1 | Make it schedulable again. | Left cordoned. | service
node: chk | Verify | 3 | 2 | Nodes Ready, pods Running. | No post-check. | observe
edge: plan | cp
edge: cp | drain
edge: drain | wk
edge: wk | un
edge: un | chk
```

## Incident: The worker that stayed cordoned

> **Incident:** After an upgrade task, a worker node stayed unschedulable, and a later task's pods stayed Pending.

```console
$ kubectl get nodes
NAME   STATUS                     ROLES           AGE   VERSION
cp1    Ready                      control-plane   30d   v1.31.1
w1     Ready,SchedulingDisabled   <none>          30d   v1.31.1
(this is a simulated illustration, not a real incident)
```

The candidate had drained the worker, upgraded it, and forgot the final uncordon. Pods that needed to schedule had nowhere to go. The status text `SchedulingDisabled` is the clue. A habit of ending every maintenance sequence with `kubectl get nodes` catches it.

## Common mistakes

- Skipping a minor version during an upgrade
- Forgetting the daemon set flag when draining
- Not uncordoning after maintenance
- Using a join token that has expired
- Applying a network plugin whose pod range differs from the init setting

```quiz
Q: In what order should a cluster be upgraded?
+ Control plane first, then workers, one minor version at a time
- Workers first :: The control plane must not be older than nodes.
- All nodes at once :: Risky and unsupported by the documented process.
- Skip two minor versions :: Not supported.
> Follow the documented order to keep the cluster consistent.

Q: How do you get a fresh worker join command?
+ kubeadm token create --print-join-command
- kubectl join :: Not a command.
- kubeadm reset :: That wipes the node.
- kubelet join :: Not a command.
> The token and hash are printed ready to run on the worker.

Q: What does kubectl drain do beyond cordon?
+ It evicts the pods from the node
- It deletes the node :: Not what drain does.
- It upgrades the kubelet :: Not related.
- It formats the disk :: Not related.
> Drain prepares a node for maintenance.

Q: Why does a new kubeadm node stay NotReady?
+ A pod network plugin has not been installed or is not running
- Swap is on :: That would prevent the kubelet starting.
- The cluster has too many pods :: Unrelated.
- The token expired :: That affects join, not readiness after joining.
> Nodes need the network plugin to report Ready.
```

```cards
kubeadm :: The tool that bootstraps and upgrades Kubernetes clusters
Join token :: A short-lived credential workers use to join a cluster
Cordon :: Marking a node unschedulable without evicting pods
Drain :: Cordoning a node and evicting its pods safely
Minor version :: The middle number of a version, which clusters upgrade one at a time
```
