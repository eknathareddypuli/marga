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
