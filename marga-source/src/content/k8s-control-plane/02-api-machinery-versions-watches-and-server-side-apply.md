---
title: API machinery: versions, watches and server-side apply
minutes: 12
summary: Understand API groups and versions, resourceVersion, watches, optimistic concurrency and server-side apply so controllers and tools behave predictably.
---

The API server is a typed, versioned store with a change feed. Controllers, kubectl and operators all rely on the same few ideas: resources have versions, every object has a resourceVersion, and clients can watch for changes instead of polling. This lesson explains those ideas and why they matter for cluster stability.

## What you will learn

- API groups, versions and how conversion keeps old clients working
- resourceVersion, list and watch, and why watches scale
- Optimistic concurrency and 409 conflicts
- Server-side apply and field ownership
- API Priority and Fairness protecting the server

## Groups, versions and deprecation

Resources live in API groups such as `apps/v1` or `networking.k8s.io/v1`. A resource can be served in several versions at once, and the server converts between them. Stored objects use one storage version. Kubernetes deprecates versions on a published schedule, and `kubectl api-resources` and `kubectl api-versions` show what your cluster serves. Before an upgrade, check manifests and controllers for removed versions, because a removed version fails at apply time.

## resourceVersion, list and watch

Each object carries a resourceVersion that comes from etcd revisions. A client lists a resource type once, remembers the resourceVersion of the list, then opens a watch from that point. The server streams add, modify and delete events, so thousands of controllers can follow changes without polling. If a client falls too far behind, the watch returns an error saying the version is too old, and the client must list again. Informers in client libraries do this for you and keep a local cache.

## Optimistic concurrency

Updates include the resourceVersion the client last saw. If someone changed the object since, the server answers 409 Conflict and the client must read and retry. This is why two tools editing the same object sometimes collide. It is also why controllers re-read before writing.

## Server-side apply

With server-side apply the server tracks which manager owns each field. `kubectl apply --server-side` sends your intended fields, and the server merges them and reports a conflict if another manager owns a field you are changing. This makes it safe for several controllers to manage different parts of one object, and it is the preferred way for new tooling.

```bash
kubectl api-resources --api-group=apps
kubectl get deploy web -o yaml --show-managed-fields | head -40
kubectl apply --server-side -f deploy.yaml
```

## API Priority and Fairness

The server limits concurrent requests by sorting them into flows with priority levels, so one noisy client cannot starve system controllers. Clients that receive 429 Too Many Requests should back off. Metrics such as apiserver_flowcontrol_rejected_requests_total show when limits are hit.

```diagram
title: API machinery: versions, watches and server-side apply
node: ctl | Controller | 0 | 1 | Lists then watches. | Polling in a loop. | service
node: api | API server | 1 | 1 | Serves and converts versions. | Overloaded. | service
node: apf | Priority and fairness | 2 | 1 | Queues by flow. | Misconfigured levels. | process
node: cache | Watch cache | 3 | 1 | Streams changes. | Client too far behind. | store
node: etcd | etcd | 4 | 1 | Source of revisions. | Slow disk. | store
edge: ctl | api
edge: api | apf
edge: apf | cache
edge: cache | etcd
```

## Incident: A controller that polled instead of watched

> **Incident:** A custom tool listed every pod once a second and slowed the whole API.

```console
$ kubectl get --raw /metrics | grep apiserver_flowcontrol_rejected_requests_total | head -2
apiserver_flowcontrol_rejected_requests_total{flow_schema="catch-all",priority_level="catch-all",reason="queue-full"} 412
$ kubectl get pods --all-namespaces --no-headers | wc -l
2840
(this is a simulated illustration, not a real incident)
```

The tool used a full list every second from a service account that fell into the catch-all flow, so its requests were queued and then rejected, and the extra load made other clients slower. Rewriting it with an informer, which lists once and then watches, cut the request rate by more than ninety percent. Always watch rather than poll, and give important controllers their own flow schema.

## Common mistakes

- Polling the API with repeated list calls
- Ignoring 409 conflicts instead of re-reading
- Applying manifests that use removed API versions
- Mixing client-side and server-side apply on the same fields
- Not backing off after a 429

```quiz
Q: What does a client do to follow changes efficiently?
+ List once, then watch from the returned resourceVersion
- Poll with a list every second :: That loads the API server.
- Read etcd directly :: Clients must use the API.
- Restart the pod regularly :: That does not help.
> Watches stream changes so many clients can stay current cheaply.

Q: What does HTTP 409 Conflict on an update mean?
+ The object changed since the client read it
- The user lacks permission :: That is 403.
- The object is missing :: That is 404.
- The server is overloaded :: That is 429 or 503.
> Optimistic concurrency uses resourceVersion to detect concurrent edits.

Q: What does server-side apply add?
+ Field ownership tracked by the server
- Faster etcd writes :: It does not change storage speed.
- A new kind of Secret :: It is unrelated to Secrets.
- Automatic backups :: It is unrelated to backups.
> The server records which manager owns each field and flags conflicts.

Q: What should you check before an upgrade?
+ That manifests and controllers do not use removed API versions
- That the nodes have enough disk only :: This is not the main API risk.
- That all pods use latest tags :: That is unrelated.
- That RBAC is disabled :: That would be unsafe.
> Removed versions fail at apply time after the upgrade.
```

```cards
resourceVersion :: A value from etcd that identifies an object version for watches and updates
Watch :: A streaming connection that delivers changes to a resource type
Server-side apply :: Merging changes on the server with per-field ownership
API Priority and Fairness :: Request queuing that stops one client starving others
Storage version :: The version in which objects are saved in etcd
```
