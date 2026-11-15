---
title: etcd operations: health, compaction and defragmentation
minutes: 12
summary: Keep etcd healthy: check status and alarms, understand compaction and defragmentation, and recover from a space quota alarm.
---

Most etcd incidents are boring and preventable: a database that grew past its quota, a slow disk, or a member that fell behind. This lesson covers the routine checks and the exact steps to recover from the most common failure, the space quota alarm.

## What you will learn

- Reading endpoint status, health and alarms
- Why the database grows and what compaction does
- Defragmentation and when it is safe
- The space quota alarm and how to clear it
- Metrics worth alerting on

## Routine checks

Run three commands regularly, with the same endpoint and certificate flags you use for backups. `endpoint health` tests that each member can commit. `endpoint status` shows database size, leader and raft index for each member. `alarm list` shows any active alarm.

```bash
export ETCDCTL_API=3
E="--endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key"
etcdctl $E endpoint health
etcdctl $E endpoint status -w table
etcdctl $E alarm list
```

## Why the database grows

Because etcd keeps old revisions, the data file grows with every change, and objects that change often, such as leases and events, create many revisions. Compaction discards revisions older than a chosen one. The API server compacts automatically on a schedule, by default every five minutes, so growth normally stays bounded.

## Compaction is not defragmentation

Compaction marks old revisions as free, but the file on disk does not shrink. Free space inside the file is reused for new data. Defragmentation rewrites the file to give space back to the filesystem. It blocks the member while it runs, so defragment one member at a time, and not the leader first.

```bash
etcdctl $E defrag --endpoints=https://127.0.0.1:2379
```

## The space quota alarm

etcd has a backend quota, 2 GiB by default and commonly raised to 8 GiB. If the data file reaches it, etcd raises a NOSPACE alarm and rejects writes, with the error "mvcc: database space exceeded". Recovery is: find the current revision, compact to it, defragment each member, then disarm the alarm.

```bash
REV=$(etcdctl $E endpoint status -w json | grep -o '"revision":[0-9]*' | head -1 | cut -d: -f2)
etcdctl $E compact $REV
etcdctl $E defrag
etcdctl $E alarm disarm
```

## What to alert on

Alert on database size close to the quota, on a rising rate of leader changes, on high wal_fsync and backend_commit latency, and on failed proposals. Also watch the number of objects, since a runaway controller that creates many events or secrets is the usual cause of growth.

```diagram
title: etcd operations: health, compaction and defragmentation
node: chk | Health and status | 0 | 1 | Weekly checks. | Skipped. | observe
node: grow | Database growth | 1 | 1 | Revisions pile up. | Hot objects. | store
node: comp | Compaction | 2 | 1 | Frees old revisions. | Not run. | process
node: defrag | Defragmentation | 3 | 1 | Returns disk space. | Run on all at once. | process
node: alarm | NOSPACE alarm | 4 | 1 | Rejects writes. | Not disarmed. | observe
edge: chk | grow
edge: grow | comp
edge: comp | defrag
edge: defrag | alarm
```

## Incident: Database space exceeded

> **Incident:** Cluster changes started failing with an etcd space error after a noisy controller created millions of events.

```console
$ kubectl create namespace test
Error from server: etcdserver: mvcc: database space exceeded
$ etcdctl alarm list
memberID:8e9e05c52164694d alarm:NOSPACE
(this is a simulated illustration, not a real incident)
```

The data file had reached its quota and etcd had gone into protection mode. The team compacted to the current revision, defragmented members one at a time, disarmed the alarm and then fixed the controller that created the events. Raising the quota alone would only have delayed the next alarm. Always find and fix the writer.

## Common mistakes

- Defragmenting every member at once
- Raising the quota without finding the cause
- Forgetting to disarm the alarm after cleaning up
- Not checking health after maintenance
- Ignoring growth until writes fail

```quiz
Q: What does compaction do?
+ Discards old revisions so their space can be reused
- Shrinks the file on disk immediately :: That is defragmentation.
- Backs up the data :: It does not make a backup.
- Restarts etcd :: It does not.
> Compaction frees revisions inside the file.

Q: What does defragmentation do?
+ Rewrites the data file to return free space to the filesystem
- Deletes objects :: It keeps live data.
- Elects a new leader :: It does not.
- Creates a snapshot :: It does not.
> It blocks the member while it runs, so do one at a time.

Q: What is the sequence to recover from the NOSPACE alarm?
+ Compact, defragment, then disarm the alarm
- Disarm the alarm only :: Writes would fail again.
- Delete the data directory :: That destroys the cluster state.
- Reboot all nodes :: That does not free etcd space.
> Free the space first, then clear the alarm.

Q: Why find the cause of growth?
+ Otherwise the database will fill again
- Quota cannot be changed :: It can be raised.
- Compaction is disabled forever :: It runs regularly.
- It is required by the API :: It is good practice.
> A runaway writer will refill any quota.
```

```cards
NOSPACE alarm :: An etcd state where writes are rejected because the quota is reached
Compaction :: Removing old revisions from the store
Defragmentation :: Rewriting the file to release free space to disk
Backend quota :: The maximum size of the etcd data file
Endpoint status :: An etcdctl view of size, leader and index per member
```
