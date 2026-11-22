---
title: Scenario: intermittent 502, 503 and 504 behind a load balancer
minutes: 13
summary: Separate the causes of gateway errors: idle timeout and keep alive mismatches, unhealthy targets, slow upstreams, connection limits and deployments that drop connections.
---

A few percent of failed requests are harder to find than a total outage. The status code and who produced it tell you which hop is unhappy.

## What you will learn

- What 502, 503 and 504 each suggest
- Who generated the error: client, balancer or backend
- Keep alive and idle timeout mismatches
- Health checks, draining and deployments
- Capacity: connection limits and queues

## The codes

A 502 means the balancer got an invalid or no response from a backend, often because a connection was closed. A 503 means no healthy backend was available or the service was overloaded and refused work. A 504 means the backend did not answer within the timeout. Treat the code as a pointer, not as proof.

## Who produced it

Read the balancer access log fields that show the balancer status, the backend status and the timings. If the balancer status is 502 and the backend status is empty, the backend never answered. If both are present, the backend itself returned the error. Logs on both sides, joined by a request id, remove the guesswork.

## Keep alive

If the balancer reuses a connection that the backend has already closed because of its own idle timeout, the next request fails with a 502 at random. The rule is that the backend idle timeout must be longer than the balancer idle timeout. Check both settings and make the application server follow the rule.

## Health and draining

During a deployment, a pod that is stopped while still in the target list receives requests that fail. Use readiness checks, a preStop delay so that the endpoint is removed first, and connection draining on the balancer. Ask whether the errors line up with deployment times.

## Capacity

A backend that reaches its worker or connection limit queues requests, and the balancer times out. Look at saturation: active connections, thread pool use and queue length. Scale out, add a limit that fails fast with a clear 503 or find the slow dependency that holds the workers.

```diagram
title: Scenario: intermittent 502, 503 and 504 behind a load balancer
node: cl | Client | 0 | 1 | Request id. | Retries. | external
node: lb | Load balancer | 1 | 1 | Idle timeout. | Reuse closed. | service
node: be | Backend pods | 2 | 1 | Keep alive. | Closes early. | service
node: dep | Dependency | 3 | 1 | Slow call. | Holds workers. | service
edge: cl | lb
edge: lb | be
edge: be | dep
```

## Incident: Random 502s every few minutes

> **Incident:** About half a percent of requests returned 502 with no pattern in the application logs.

```console
$ grep ' 502 ' lb-access.log | head -1
2026-11-12T10:14:03Z lb-1 502 - 0.001 backend=10.2.4.17:8080 error=connection closed
$ grep -E "keepalive_timeout|idle_timeout" app.conf lb.conf
app.conf: keepalive_timeout 5s;
lb.conf:  idle_timeout 60s;
(this is a simulated illustration, not a real incident)
```

The application server closed idle connections after five seconds, while the balancer kept them for sixty. Whenever a request was sent on a connection that had just been closed, the balancer logged a 502 with no backend status. The team set the application keep alive to seventy five seconds, longer than the balancer, and the errors stopped. They added the rule to the service template.

## Common mistakes

- Backend idle timeout shorter than the balancer
- Stopping pods before they leave the target list
- No request id across hops
- Retrying without limits
- Treating every 5xx as an application bug

```quiz
Q: What does a 504 usually mean?
+ The backend did not respond within the timeout
- The DNS is wrong :: Not that.
- The cert expired :: Different error.
- The client is offline :: No.
> Check backend latency and timeouts.

Q: Which timeout rule avoids random 502s?
+ Backend idle timeout longer than the balancer idle timeout
- Shorter backend timeout :: Causes closed reuse.
- No timeouts :: Dangerous.
- Equal timeouts :: Race remains.
> The balancer must not reuse closed connections.

Q: Why use a preStop delay?
+ So the pod leaves the target list before it stops
- To encrypt traffic :: No.
- To save CPU :: No.
- To add logs :: No.
> It avoids errors during deployments.

Q: How do you find which hop produced an error?
+ Compare balancer and backend status and timing in logs
- Guess :: Unreliable.
- Restart all :: Hides evidence.
- Wait :: No.
> Use a shared request id.
```

```cards
502 :: Bad gateway, an invalid backend response
504 :: Gateway timeout, no timely backend response
Keep alive :: Reusing a connection for several requests
Connection draining :: Letting active requests finish before removal
```
