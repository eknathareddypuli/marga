---
title: Distributed tracing: sampling and correlation
minutes: 12
summary: Use traces to find slow dependencies, choose head and tail sampling sensibly, propagate context across services and link traces to metrics and logs.
---

A trace follows one request across services. It answers where the time went. Done carelessly, it is expensive and incomplete, so sampling and propagation need deliberate choices.

## What you will learn

- Spans, traces and context propagation
- Head sampling versus tail sampling
- Attributes, events and exemplars
- Reading a trace to find the slow hop
- Tracing cost and storage

## Spans and propagation

Each unit of work is a span with a start, a duration and attributes. The trace id travels between services in headers, such as the W3C traceparent header. If one service does not forward it, the trace breaks in two. Check message queues and async hops, which often lose context.

## Head sampling

The decision is made at the start of the request, for example keep one percent. It is cheap and simple, but it keeps few of the rare, slow or failing requests you most want to see.

## Tail sampling

A collector holds the whole trace for a short period and then decides: keep all errors, keep traces slower than a threshold and keep a small share of the rest. It needs memory and all spans of a trace sent to the same collector, but gives far better data per dollar.

## Reading a trace

Look for the longest span on the critical path, repeated spans such as the same query run many times and gaps where no span exists. A gap often means queueing or an uninstrumented hop. Compare a slow trace with a normal one.

## Exemplars and cost

Exemplars attach a trace id to a metric sample so a latency histogram can link to a real slow trace. Control cost with tail sampling, attribute limits and a retention period of days, not months.

```diagram
title: Distributed tracing: sampling and correlation
node: svcA | Service A | 0 | 1 | Starts the trace. | Missing header. | service
node: svcB | Service B | 1 | 1 | Continues context. | Drops context. | service
node: col | Collector | 2 | 1 | Tail sampling. | Memory pressure. | process
node: back | Trace backend | 3 | 1 | Stores and queries. | Cost growth. | store
edge: svcA | svcB
edge: svcA | col
edge: svcB | col
edge: col | back
```

## Incident: Traces that ended at the queue

> **Incident:** Slow checkouts could not be traced past the message queue.

```console
$ kubectl logs deploy/otel-collector | grep -c "orphan span"
1840
$ kubectl logs deploy/checkout | grep traceparent | head -2
no traceparent header found on consumed message
(this is a simulated illustration, not a real incident)
```

The producer did not copy the trace context into the message headers, so the consumer started a new trace. Adding context injection and extraction around the queue joined the traces and revealed the real delay in the payment service.

## Common mistakes

- Sampling one percent at random and missing the slow requests
- Forgetting to propagate context through queues
- Putting unbounded values in span attributes
- Keeping traces for months
- Never linking traces to logs and metrics

```quiz
Q: What carries a trace between services?
+ A trace context header such as traceparent
- The cookie only :: Not standard.
- The DNS name :: No.
- The pod name :: No.
> Services must forward it.

Q: What is the benefit of tail sampling?
+ Keeps errors and slow traces
- It is free :: It needs memory.
- It needs no collector :: It needs one.
- It keeps all traces :: It selects.
> Decision after seeing the trace.

Q: What is an exemplar?
+ A trace id attached to a metric sample
- A log line :: No.
- An alert :: No.
- A dashboard :: No.
> It links metrics to traces.

Q: What does a gap in a trace often mean?
+ Queueing or uninstrumented work
- A faster request :: No.
- A cached result :: Not usually.
- A bug in the UI :: Not likely.
> Look there first.
```

```cards
Span :: One timed unit of work in a trace
Trace context :: The ids propagated between services
Tail sampling :: Choosing traces to keep after they complete
Exemplar :: A link from a metric sample to a trace
```
