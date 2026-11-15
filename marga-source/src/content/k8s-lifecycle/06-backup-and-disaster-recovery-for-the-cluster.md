---
title: Backup and disaster recovery for the cluster
minutes: 13
summary: Back up etcd and the other state you need, set recovery objectives, test restores and plan for loss of one control plane node or the whole cluster.
---

High availability keeps a cluster running through a node failure. It does not help when data is deleted, corrupted or when the whole site is lost. Those cases need backups, written recovery steps and rehearsals.

## What you will learn

- What state needs backing up
- Choosing RPO and RTO
- Automating etcd snapshots and storing them safely
- Restoring one member and restoring a whole cluster
- Rehearsing and measuring recovery

## What to back up

The essential item is etcd, which holds every object. Also keep `/etc/kubernetes/pki` and the kubeadm configuration, since certificates and the control plane endpoint matter for a rebuild. Application data in persistent volumes needs its own backups, with volume snapshots or an application-aware tool. Manifests should live in version control so that a fresh cluster can be rebuilt from them.

## RPO and RTO

The recovery point objective is how much data you can afford to lose, which sets the snapshot frequency. The recovery time objective is how long the cluster can be down, which sets how automated and rehearsed the recovery must be. An hourly snapshot gives a one hour RPO. Write both numbers down, and measure them in a rehearsal.

## Automate snapshots

Run snapshots from a scheduled job on a control plane node, copy them off the node to separate storage, encrypt them because they contain Secrets, and keep several generations. Alert if a snapshot is missing or its size drops sharply.

```bash
ETCDCTL_API=3 etcdctl snapshot save /var/backups/etcd-$(date +%F-%H%M).db --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key
etcdutl snapshot status /var/backups/etcd-latest.db -w table
```

## Restore scenarios

Losing one member of a healthy cluster is routine: remove the dead member with `etcdctl member remove`, add a new one and let it sync. Losing quorum, or the whole cluster, means a restore from a snapshot. Restore the same snapshot on every member, with a new cluster token and the initial cluster list, or restore on one node and rebuild the others by joining them. After the restore, pods that were created after the snapshot will be missing and objects deleted since will have returned, so reconcile.

## Rehearse

A backup that was never restored is a hope. Schedule a drill in a scratch environment that restores a recent snapshot into a new cluster, checks that namespaces and workloads appear, and records how long it took. Update the runbook with what you learned.

```diagram
title: Backup and disaster recovery for the cluster
node: etcd | etcd | 0 | 1 | Live state. | Corruption. | store
node: snap | Snapshot job | 1 | 1 | Scheduled saves. | Silent failure. | process
node: off | Off-node storage | 2 | 1 | Encrypted copies. | Same failure domain. | store
node: rest | Restore drill | 3 | 1 | Rebuild and time it. | Never rehearsed. | observe
edge: etcd | snap
edge: snap | off
edge: off | rest
```

## Incident: The backups that stopped in March

> **Incident:** During a recovery the newest snapshot was eight months old.

```console
$ ls -lt /var/backups/etcd-*.db | head -3
-rw------- 1 root root 41943040 Mar  3 02:00 /var/backups/etcd-2026-03-03-0200.db
-rw------- 1 root root 41930752 Mar  2 02:00 /var/backups/etcd-2026-03-02-0200.db
$ crontab -l | grep etcd
(no output)
(this is a simulated illustration, not a real incident)
```

A node rebuild had removed the cron entry, and nothing alerted on missing snapshots. The recovery used the March snapshot and lost months of changes, which declarative, repository-driven manifests and runbooks partly recovered. The team added an alert on snapshot age, moved the job into a controller, and scheduled a quarterly restore drill.

## Common mistakes

- Never testing a restore
- Keeping backups only on the control plane node
- Storing snapshots unencrypted
- No alert on missing backups
- Forgetting that persistent volume data is separate

```quiz
Q: What is the most important state to back up for the cluster itself?
+ etcd
- kubelet logs :: Not the essential state.
- Node images :: Can be pulled again.
- kube-proxy rules :: Recreated by kube-proxy.
> etcd holds all objects.

Q: What sets how often to snapshot?
+ The recovery point objective
- The number of nodes :: Not the driver.
- The kubelet version :: Not the driver.
- The number of namespaces :: Not the driver.
> RPO is acceptable data loss.

Q: Why encrypt snapshots?
+ They contain Secrets
- They are very large :: Size is not the reason.
- They expire :: They do not.
- They are public by default :: They are not public.
> etcd stores Secret data.

Q: What proves a backup is usable?
+ A successful restore drill
- A file exists :: It could be empty.
- The job exited 0 :: It could still be bad.
- The disk is not full :: Not proof.
> Only restoring proves it.
```

```cards
RPO :: Recovery point objective, the data loss you can accept
RTO :: Recovery time objective, the downtime you can accept
Snapshot :: A point-in-time copy of etcd
Restore drill :: A rehearsal of recovering from a backup
Volume snapshot :: A point-in-time copy of a persistent volume
```
