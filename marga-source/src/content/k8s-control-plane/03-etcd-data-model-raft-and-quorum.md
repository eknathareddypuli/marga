---
title: etcd: data model, Raft and quorum
minutes: 12
summary: See how Kubernetes stores objects in etcd, how Raft elects a leader and commits writes, and how to size and reason about quorum.
---

etcd is the only stateful part of the control plane. If it is healthy the API server can be replaced freely. If it is lost without a backup, the cluster state is gone. Understanding how it stores data and agrees on writes makes sizing and recovery decisions straightforward.

## What you will learn

- How objects are stored as keys under /registry
- Revisions and MVCC
- Leader election and commit in Raft
- Quorum maths and why odd member counts are used
- What disk and network latency do to the cluster

## Keys and revisions

etcd is a key-value store. The API server writes each object under a key such as `/registry/pods/default/web-1`, as a protobuf encoded value. Every write creates a new revision, a cluster-wide counter, and etcd keeps old revisions until they are compacted. This multi-version design is what makes watches possible, because a client can ask for all changes since a given revision. The resourceVersion you see in objects comes from these revisions.

## Raft in plain words

Members of an etcd cluster elect one leader using the Raft algorithm. All writes go to the leader, which appends them to its write-ahead log and replicates them to followers. A write is committed when a majority of members have stored it. If the leader fails, the followers hold a new election after a timeout. Reads can be served linearizably through the leader, which is what the API server asks for by default.

## Quorum

A majority is floor(n/2) + 1. Three members tolerate one failure, five tolerate two, and seven tolerate three. An even number adds cost without adding tolerance: four members still tolerate one failure. When quorum is lost the cluster cannot commit writes, so the API server cannot change anything, although running pods keep running.

## Latency matters

Every commit waits for a disk sync on a majority of members, so slow disks directly slow the whole cluster. Use fast local SSD storage for etcd, keep members close in network terms, and avoid sharing the disk with noisy workloads. Slow fsync shows up as wal_fsync_duration warnings in the logs and as leader changes.

```python
def tolerated(members):
    quorum = members // 2 + 1
    return members - quorum

for n in (1, 2, 3, 4, 5, 7):
    print(n, "members tolerate", tolerated(n), "failure(s)")
```

## Look at it

```bash
ETCDCTL_API=3 etcdctl endpoint status -w table --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key
```
The table shows the leader, the database size and the raft term for each member.

```diagram
title: etcd: data model, Raft and quorum
node: api | API server | 0 | 1 | Writes objects. | Cannot reach etcd. | service
node: lead | Leader | 1 | 1 | Orders and replicates writes. | Slow disk causes elections. | store
node: f1 | Follower | 2 | 0 | Stores the log. | Lagging member. | store
node: f2 | Follower | 2 | 2 | Stores the log. | Lost member. | store
node: wal | WAL on disk | 3 | 1 | Synced before commit. | High fsync latency. | store
edge: api | lead
edge: lead | f1
edge: lead | f2
edge: lead | wal
```

## Incident: Two of three members down

> **Incident:** Two etcd members failed in a single maintenance window and the API became read only in practice.

```console
$ etcdctl endpoint health --endpoints=https://10.0.0.1:2379,https://10.0.0.2:2379,https://10.0.0.3:2379
https://10.0.0.1:2379 is healthy: successfully committed proposal: took = 8.2ms
https://10.0.0.2:2379 is unhealthy: failed to commit proposal: context deadline exceeded
https://10.0.0.3:2379 is unhealthy: failed to commit proposal: context deadline exceeded
(this is a simulated illustration, not a real incident)
```

With one of three members left there was no quorum, so no writes could be committed and kubectl changes hung. Running pods were unaffected. The recovery was to bring at least one member back with its data, restoring quorum, then replace the other. If both members had lost their data, a snapshot restore would have been needed. Do maintenance one member at a time and check health between steps.

## Common mistakes

- Running an even number of members
- Putting etcd on slow or shared disks
- Taking down two members at once for maintenance
- Stretching members across high-latency links
- Treating etcd as a database for application data

```quiz
Q: How many failures does a five member etcd cluster tolerate?
+ Two
- One :: Five members tolerate two.
- Three :: Quorum is three, so two may fail.
- Five :: Quorum would be lost.
> Quorum is three of five, so two members can fail.

Q: When is a write committed?
+ When a majority of members have stored it
- When the leader receives it :: Followers must have it too.
- When all members have it :: Only a majority is needed.
- When the API server returns :: Commit is an etcd concept.
> Raft commits on majority acknowledgement.

Q: What happens to running pods when etcd loses quorum?
+ They keep running, but no cluster changes can be committed
- They are deleted :: Kubelets keep running pods.
- They restart :: Not by themselves.
- They move to another cluster :: That is not a feature.
> The data plane keeps working while the control plane cannot write.

Q: Why is disk latency important for etcd?
+ Each commit waits for a disk sync on a majority of members
- It only affects backups :: It affects every write.
- It only affects reads from cache :: Commits need a disk sync.
- It changes the pod count :: It does not.
> Slow fsync slows every write and can trigger elections.
```

```cards
Raft :: The consensus algorithm etcd uses to agree on writes
Quorum :: A majority of members needed to commit
Revision :: A cluster-wide counter that increases with every write
WAL :: The write-ahead log synced to disk before commit
Leader :: The member that orders and replicates writes
```
