---
title: Cluster lifecycle and HA
summary: kubeadm commands, certificate renewal, upgrade order, node replacement and etcd backup.
module: k8s-lifecycle
---

## kubeadm basics

| Job | Command |
|-----|---------|
| New cluster | `kubeadm init --config kubeadm.yaml --upload-certs` |
| Join worker | `kubeadm token create --print-join-command` |
| Reset a node | `kubeadm reset` then clean CNI and iptables |
| Check certificates | `kubeadm certs check-expiration` |
| Renew certificates | `kubeadm certs renew all` |

## Upgrade order

| Step | Command |
|------|---------|
| Plan | `kubeadm upgrade plan` |
| First control plane | `kubeadm upgrade apply v1.xx.y` |
| Other control planes and workers | `kubeadm upgrade node` |
| Drain | `kubectl drain NODE --ignore-daemonsets --delete-emptydir-data` |
| Back in service | `kubectl uncordon NODE` |

## Backup and restore

| Job | Command |
|-----|---------|
| Snapshot | `etcdctl snapshot save FILE` |
| Check | `etcdctl snapshot status FILE -w table` |
| Restore | `etcdctl snapshot restore FILE --data-dir DIR` |

## Rules of thumb

| Rule | Why |
|------|-----|
| One minor version at a time | Skew policy and API removals |
| Odd number of etcd members | Quorum |
| Alert on snapshot age | Silent backup failure |
