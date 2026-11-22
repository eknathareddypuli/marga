---
title: Control plane and etcd
summary: The request path, etcd health commands, component checks and what to do when kubectl is down.
module: k8s-control-plane
---

## Request path

| Stage | Symptom of failure |
|-------|--------------------|
| Authentication | 401 Unauthorized |
| Authorization | 403 Forbidden naming the user and verb |
| Mutating and validating admission | Error naming the plugin or webhook |
| Schema validation | Invalid value error naming the field |

## etcd health

| Job | Command |
|-----|---------|
| Member health | `etcdctl endpoint health --cluster` |
| Size and leader | `etcdctl endpoint status -w table` |
| Alarms | `etcdctl alarm list` |
| Compact | `etcdctl compact $REV` |
| Defragment one member | `etcdctl defrag --endpoints=$ONE` |
| Clear alarm | `etcdctl alarm disarm` |

## Component check

| Symptom | Look at |
|---------|---------|
| Pending, no events | kube-scheduler and its lease |
| No scaling, no replacement pods | kube-controller-manager |
| Writes fail or are slow | etcd disk latency and size |
| Node NotReady | kubelet, runtime, node lease |

## When kubectl does not work

| Job | Command |
|-----|---------|
| Containers on the node | `crictl ps -a` |
| Kubelet log | `journalctl -u kubelet --since "10 min ago"` |
| Static pod manifests | `ls /etc/kubernetes/manifests` |

## Handy commands

```bash
kubectl get --raw /readyz?verbose
```

```bash
kubectl get --raw /livez?verbose
```

```bash
ETCDCTL_API=3 etcdctl endpoint health --cluster
```

```bash
ETCDCTL_API=3 etcdctl endpoint status --cluster -w table
```

```bash
kubectl get --raw /livez?verbose
```

```bash
kubectl get validatingwebhookconfigurations
```

```bash
kubectl get lease -n kube-system
```

## Watch out for

> **Warning:** Never restore etcd from a snapshot without stopping the API servers first.

> **Warning:** A failing admission webhook with failurePolicy Fail can block every pod creation.

> **Warning:** Even etcd member counts add risk without adding fault tolerance, so use three or five.

> **Warning:** Compaction frees keys but only defragmentation returns disk space to the file system.
