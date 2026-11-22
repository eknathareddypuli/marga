## Catalog with no owners
level: mid
During an outage nobody could find the owner.

```text
$ yq ".spec.owner" catalog-info.yaml
group:default/team-that-left
```
? What would prevent it?
+ A check that every owner resolves and a report of orphaned entries
- More plugins
- A new theme
why: Accurate metadata builds trust. The matching lesson explains the reasoning in more detail.

## Database deleted with a namespace
level: mid
Deleting a claim removed a production database.

```text
$ kubectl get postgresqlinstance orders-db -n shop -o jsonpath="{.spec.deletionPolicy}"
Delete
```
? What do you change?
+ Use the Orphan policy with snapshots and block namespace deletion with claims
- Delete more
- Nothing
why: Protect important data from accidental deletion.

## Bad change hit forty clusters
level: senior
One merge synced everywhere.

```text
$ argocd app list --sync-status OutOfSync -o name | wc -l
40
```
? What is the fix?
+ Roll out in rings with health gates and a pause on degraded apps
- Faster syncs
- Fewer clusters
why: Fleets need progressive rollout. The matching lesson explains the reasoning in more detail.

## Upgrade stalled halfway
level: mid
A control plane machine never became ready.

```text
$ kubectl get machines -n fleet
prod-eu-cp-1 Provisioning
```
? What do you check?
+ Machine conditions, image availability and quotas in the region
- The dashboard
- The logo
why: Pre checks avoid stalled upgrades. The matching lesson explains the reasoning in more detail.

## Preview bill keeps growing
level: mid
Old previews were never removed.

```text
$ kubectl get ns -l type=preview --no-headers | wc -l
312
```
? What helps?
+ Time to live labels, a reaper job and quotas
- Longer lifetimes
- More previews
why: Delete by default. The matching lesson explains the reasoning in more detail.

## Teams ranked by deploy count
level: senior
Teams split changes to raise the number.

```text
$ echo "deploys up, lead time unchanged"
deploys up, lead time unchanged
```
? What should change?
+ Use metrics to learn, show all four together and stop ranking
- Rank harder
- Hide data
why: Targets get gamed. The matching lesson explains the reasoning in more detail.
