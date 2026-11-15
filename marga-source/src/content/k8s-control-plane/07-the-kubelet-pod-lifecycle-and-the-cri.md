---
title: The kubelet: pod lifecycle and the container runtime interface
minutes: 12
summary: Understand what the kubelet does on each node: its sync loop, pod phases and probes, the CRI, CNI and CSI calls, node heartbeats and static pods.
---

The control plane decides, and the kubelet does. It is the agent on every node that turns pod specifications into running containers and reports what is actually happening. Most node level problems, from pods stuck in ContainerCreating to NotReady nodes, are kubelet problems.

## What you will learn

- The sync loop and how the kubelet gets its pods
- The CRI, CNI and CSI calls during pod start
- Pod phases, container states and probes
- Node status, heartbeats and eviction
- Static pods and the kubelet configuration

## Where pods come from

The kubelet watches the API server for pods bound to its node. It also reads static pod manifests from a local directory and optionally an HTTP source. For each pod it runs a sync loop that compares the desired containers with what the runtime reports and takes action to match.

## Starting a pod

The kubelet asks the container runtime, through the Container Runtime Interface, to create a pod sandbox. A CNI plugin then sets up the pod network and assigns an IP. Volumes are mounted, with CSI drivers for dynamic storage. Images are pulled, then containers are created and started in order, init containers first. Each step can fail visibly: ContainerCreating with a network or mount event, ImagePullBackOff, or CrashLoopBackOff.

## Phases, states and probes

A pod phase is Pending, Running, Succeeded, Failed or Unknown. Each container is Waiting, Running or Terminated, with a reason. Startup, liveness and readiness probes let the kubelet decide whether to restart a container or whether to include it in service endpoints. A failing readiness probe removes the pod from endpoints without restarting it.

## Node status and heartbeats

The kubelet updates the node object conditions such as Ready, MemoryPressure and DiskPressure, and renews a Lease in the kube-node-lease namespace as a cheap heartbeat. If the control plane stops seeing heartbeats for the grace period, the node controller marks the node NotReady and later taints it so pods are evicted. Under pressure the kubelet itself evicts pods, lowest priority and highest overuse first.

## Configuration and diagnosis

The kubelet runs as a systemd service on the host, not as a pod. Its settings live in a config file, typically `/var/lib/kubelet/config.yaml`.

```bash
systemctl status kubelet
journalctl -u kubelet --since "10 min ago" | tail -20
crictl ps -a | head
grep staticPodPath /var/lib/kubelet/config.yaml
```

```diagram
title: The kubelet: pod lifecycle and the container runtime interface
node: api | API server | 0 | 1 | Source of pods. | Unreachable. | service
node: kl | kubelet | 1 | 1 | Sync loop. | Stopped service. | service
node: cri | Container runtime | 2 | 0 | Creates containers. | Runtime down. | process
node: cni | CNI plugin | 2 | 1 | Pod network. | Missing config. | process
node: csi | CSI driver | 2 | 2 | Volumes. | Mount error. | store
edge: api | kl
edge: kl | cri
edge: kl | cni
edge: kl | csi
```

## Incident: The node that went NotReady after a reboot

> **Incident:** A worker came back from a reboot as NotReady and its pods were rescheduled.

```console
$ kubectl get nodes
NAME       STATUS     ROLES    AGE   VERSION
worker-2   NotReady   <none>   90d   v1.31.2
$ systemctl is-active containerd kubelet
active
inactive
(this is a simulated illustration, not a real incident)
```

The container runtime started, but the kubelet service was not enabled to start at boot, so no heartbeats reached the control plane. After the grace period the node controller marked the node NotReady and evicted its pods. Starting and enabling the kubelet fixed it. Check the lowest layer first: is the service running, and is it enabled.

## Common mistakes

- Looking in kubectl before checking the kubelet service on a NotReady node
- Forgetting that readiness failures remove endpoints but do not restart
- Confusing the pod phase with the container state
- Editing static pod manifests without a backup
- Not enabling the kubelet and runtime services at boot

```quiz
Q: What does the kubelet use to ask for containers to be created?
+ The Container Runtime Interface
- The scheduler :: The scheduler does not create containers.
- etcd :: It is not involved on the node.
- kube-proxy :: It handles Service rules.
> The CRI is the interface to runtimes such as containerd.

Q: What happens when a readiness probe fails?
+ The pod is removed from service endpoints
- The container is restarted :: That is a liveness failure.
- The node is cordoned :: It is not.
- The pod is deleted :: It is not.
> Readiness controls traffic, liveness controls restarts.

Q: How does the control plane know a node is alive?
+ Through kubelet heartbeats such as node Lease renewals
- It pings every pod :: It does not.
- It reads etcd on the node :: Etcd is not on workers.
- It asks the scheduler :: The scheduler does not track health.
> Lease renewals are cheap heartbeats.

Q: Where does the kubelet run on a kubeadm node?
+ As a systemd service on the host
- As a static pod :: Control plane components are static pods, the kubelet is not.
- As a DaemonSet :: It cannot start itself that way.
- Inside the API server :: It is not.
> It must run before any pod can.
```

```cards
Kubelet :: The node agent that runs pods and reports status
CRI :: The interface the kubelet uses to talk to container runtimes
Pod sandbox :: The shared network and namespace environment of a pod
Readiness probe :: A check that decides whether a pod receives traffic
Node Lease :: A small object renewed as the node heartbeat
```
