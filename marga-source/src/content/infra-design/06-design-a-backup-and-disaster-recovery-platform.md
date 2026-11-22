---
title: Design: a backup and disaster recovery platform
minutes: 13
summary: Design backups that really restore: recovery objectives, backup tiers, immutable copies, restore testing at scale and the disaster recovery plan for the platform services themselves.
---

A backup is only proven by a restore. The design starts from how much loss and downtime the business accepts, and ends with regular tests that show it can be met.

## What you will learn

- Recovery objectives per service tier
- Backup methods: snapshots, logical and continuous
- Protecting backups: immutability, separation and access
- Automated restore tests and measuring recovery time
- Failure modes: silent failure, deleted backups and slow restores

## Objectives

For each service tier agree a recovery point objective, how much data may be lost, and a recovery time objective, how long it may be down. A payments ledger may need near zero loss and minutes of downtime, while an internal wiki may accept a day. Objectives decide the method and the cost, and must be agreed with the business owners.

## Methods

Snapshots are fast and suit volumes and cloud databases. Logical backups, such as dumps, are portable and useful for partial restores but slow at scale. Continuous archiving of the transaction log allows recovery to a point in time. Combine them by tier, and remember that application consistency needs a quiesce or a database aware method.

## Protection

Backups are a target for attackers. Keep copies in a separate account or provider with different credentials, make them immutable for a set period, require approval to delete and encrypt them with keys that are also backed up elsewhere. A backup that an administrator of the production environment can delete is not safe from ransomware.

## Restore tests

Automate restores into an isolated environment on a schedule, verify the data with checks such as row counts and application start up, and measure the time taken. Report results per service. Sample large estates so that every service is tested at least once in a period. A failing test is an incident for the backup system.

## Failure modes

Backups can fail silently, so alert on missing runs and on size changes. Retention clean up can delete too much, so protect it with limits. Restore time can exceed the objective as data grows, so track it. Plan how the backup platform itself is restored, including the credentials and keys it needs, which must not depend on the thing that is lost.

```diagram
title: Design: a backup and disaster recovery platform
node: tier | Tiers and objectives | 0 | 1 | RPO and RTO. | Unagreed. | process
node: bk | Backup jobs | 1 | 1 | Method per tier. | Silent fail. | service
node: vault | Isolated copies | 2 | 1 | Immutable. | Deletable. | security
node: test | Restore tests | 3 | 1 | Automated. | Never run. | observe
edge: tier | bk
edge: bk | vault
edge: vault | test
```

## Incident: The backups that could not be restored

> **Incident:** After a storage failure, the team found that the newest backups were empty.

```console
$ aws s3 ls s3://backups-prod/db/ --human-readable | tail -3
2026-11-08 02:00:11    0 Bytes db-20261108.dump
2026-11-09 02:00:09    0 Bytes db-20261109.dump
2026-11-10 02:00:12    0 Bytes db-20261110.dump
(this is a simulated illustration, not a real incident)
```

A credential change had made the dump command fail, but the job still reported success because the script ignored the exit status. Three days of backups were empty, and the restore used an older copy, losing three days of data. The team fixed the script, added size and age checks, started weekly automated restore tests with data verification and made missing or tiny backups page the owner.

## Common mistakes

- Never testing restores
- Backups deletable from production credentials
- Ignoring exit codes in backup scripts
- No alert on backup size or age
- Restore plan that depends on the lost system

```quiz
Q: What is an RPO?
+ How much data may be lost
- How long to restore :: That is RTO.
- Backup size :: No.
- Disk speed :: No.
> It sets backup frequency.

Q: Why keep immutable copies in a separate account?
+ Attackers cannot delete them with production access
- To save space :: No.
- To speed up restores :: No.
- To hide data :: No.
> It defends against ransomware.

Q: How do you prove backups work?
+ Automated restore tests with data checks
- Check the job status only :: Can be wrong.
- Hope :: No.
- Count files :: Not enough.
> Only a restore proves it.

Q: What should alert on backup jobs?
+ Missing runs and unexpected size or age
- Colour of logs :: No.
- Number of users :: No.
- CPU model :: No.
> Silent failures are common.
```

```cards
RPO :: Recovery point objective, the acceptable data loss
RTO :: Recovery time objective, the acceptable downtime
Immutable backup :: A copy that cannot be changed for a period
Restore test :: A rehearsal that recovers data from a backup
```
