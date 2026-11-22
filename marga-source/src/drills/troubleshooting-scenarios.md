## Pod stays Pending
level: junior
A new pod has no node.

```text
$ kubectl describe pod web-7d9 -n shop | grep -A3 Events
Warning FailedScheduling 0/6 nodes are available: 6 Insufficient memory
```
? What is the cause?
+ No node has enough free memory for the request
- The image is missing
- DNS is wrong
why: The scheduler message names the cause. The matching lesson explains the reasoning in more detail.

## Restart every minute
level: mid
A container restarts and its current logs are empty.

```text
$ kubectl describe pod orders-6f7 -n shop | grep -E "Reason|Exit Code"
Reason: OOMKilled
Exit Code: 137
```
? What do you do?
+ Read previous logs and raise or fix memory use
- Delete the namespace
- Change the DNS
why: Exit code 137 with OOMKilled means a memory kill.

## Five second delays
level: mid
One in twenty calls to an external host takes five seconds.

```text
$ kubectl exec deploy/checkout -n shop -- cat /etc/resolv.conf
options ndots:5
```
? What is a likely cause?
+ Extra suffix queries and a lost UDP query before retry
- The database is slow
- A full disk
why: ndots five adds queries for external names.

## Random 502 responses
level: mid
A small share of requests fail with no backend status.

```text
$ grep -E "keepalive_timeout|idle_timeout" app.conf lb.conf
app.conf: keepalive_timeout 5s;
lb.conf: idle_timeout 60s;
```
? What is the fix?
+ Make the backend keep alive longer than the balancer idle timeout
- Raise the CPU
- Disable the balancer
why: The balancer reuses a connection that was already closed.

## Tail latency tripled
level: senior
A release changed only cache keys.

```text
$ curl -s localhost:9090/metrics | grep -E "cache_(hits|misses)_total"
cache_hits_total 1204
cache_misses_total 98233
```
? What happened?
+ The hit rate collapsed and the database became the queue
- The network is faster
- The disk was upgraded
why: Check hit rate after key changes. The matching lesson explains the reasoning in more detail.

## Denied in one region only
level: senior
A deploy works in two regions and fails in the third.

```text
$ aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=RunInstances --max-results 1
errorCode UnauthorizedOperation: explicit deny in a service control policy
```
? What should you do?
+ Ask the owners of the organisation policy to approve the region
- Edit the role policy
- Retry in a loop
why: A higher layer denied it. The matching lesson explains the reasoning in more detail.
