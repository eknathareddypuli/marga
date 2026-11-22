## Shared registry never upgraded
level: mid
A one replica registry stays on an old version for years.

```text
$ kubectl get deploy registry -n infra -o jsonpath="{.spec.replicas}"
1
```
? What is the design flaw?
+ No redundancy, staging or rollback plan for upgrades
- The name
- The colour
why: Services that cannot be upgraded safely are left to rot.

## Morning build queue
level: mid
Builds wait forty minutes every morning.

```text
$ kubectl get pods -n runners --no-headers | awk '{print $3}' | sort | uniq -c
 12 Running
 240 Pending
```
? What do you change?
+ Raise limits with a cost cap, add a warm pool and scale on queue wait time
- Ban builds
- Shorten the tests only
why: Match capacity to the demand pattern. The matching lesson explains the reasoning in more detail.

## Pull rate limit during scale up
level: mid
New pods cannot pull base images.

```text
$ kubectl get events -n shop --field-selector reason=Failed | tail -1
Failed to pull image: toomanyrequests: pull rate limit
```
? What is the fix?
+ A pull through cache and mirrored critical images
- More replicas
- A bigger node
why: Registry availability must not depend on upstream limits.

## Kernel patch ring failure
level: senior
Fifty hosts fail to boot after an update.

```text
$ journalctl -b -1 -p err --no-pager | tail -1
dracut: FATAL: no network interface found
```
? What should the rollout have had?
+ A hardware diverse canary ring with a post boot health gate
- More hosts at once
- No reboot
why: Rings limit blast radius. The matching lesson explains the reasoning in more detail.

## Bad edge configuration
level: senior
All routes return 404 after a proxy change.

```text
$ curl -s -o /dev/null -w "%{http_code}\n" https://edge.example.com/api/health
404
```
? What control was missing?
+ Staged rollout with a real route check and automatic rollback
- A syntax check only
- A louder alert
why: Syntax checks do not test behaviour. The matching lesson explains the reasoning in more detail.

## Empty backups
level: senior
The latest three backups have zero bytes.

```text
$ aws s3 ls s3://backups-prod/db/ --human-readable | tail -1
2026-11-10 02:00:12 0 Bytes db-20261110.dump
```
? What should have caught this?
+ Size and age alerts and automated restore tests
- More storage
- A longer retention
why: Only a restore proves a backup. The matching lesson explains the reasoning in more detail.
