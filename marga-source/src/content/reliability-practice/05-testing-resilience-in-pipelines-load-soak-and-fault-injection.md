---
title: Testing resilience in pipelines: load, soak and fault injection
minutes: 13
summary: Put reliability checks in the delivery pipeline: load and soak tests, dependency failure tests, fault injection in staging and production, and release gates based on SLO signals.
---

Reliability that is only tested in production is tested by users. Many failure modes can be found earlier with repeatable tests that run for every release.

## What you will learn

- What each test type finds
- Load tests with realistic traffic shapes
- Soak tests for leaks and slow decay
- Fault injection: latency, errors and dependency loss
- Release gates and canary analysis

## Test types

A load test shows how the service behaves at expected and peak traffic. A stress test finds the breaking point. A soak test runs for hours or days to find leaks and slow decay. A fault injection test breaks a dependency or adds latency to check that fallbacks work. Each answers a different question, so choose by the risk.

## Load tests

Use traffic that resembles production in mix and shape, not a single endpoint at constant rate. Replay anonymised traffic or model the real mix, including bursts. Measure latency percentiles and errors, as well as resource use, and compare against the last release. A trend over releases finds regressions early.

## Soak tests

Run the service at steady load for a long time and watch memory, file descriptors, connection counts and latency over time. A slow rise points to a leak. Soak tests also catch problems with log rotation, certificate renewal and scheduled jobs that appear only after hours.

## Fault injection

Add delay or errors to a dependency call, stop a replica, or block a network path, and check that timeouts, retries, circuit breakers and fallbacks do what the design says. Begin in staging, then run small experiments in production with a clear stop condition. Record the hypothesis, the result and the fix.

## Gates and canaries

Use the SLO signals as gates: a canary release receives a small share of traffic, and the pipeline compares its error rate and latency with the baseline. If it is worse, the release stops or rolls back automatically. Keep the gate fast and the thresholds simple, so that people trust it and do not bypass it.

```diagram
title: Testing resilience in pipelines: load, soak and fault injection
node: ci | Pipeline | 0 | 1 | Every release. | Skipped. | process
node: load | Load and soak | 1 | 1 | Shape and time. | Unrealistic. | observe
node: fault | Fault injection | 2 | 1 | Break a dependency. | No fallback. | security
node: gate | Canary gate | 3 | 1 | SLO comparison. | Bypassed. | service
edge: ci | load
edge: load | fault
edge: fault | gate
```

## Incident: The leak that only showed on day three

> **Incident:** A service that passed every test ran out of file descriptors three days after release.

```console
$ ls /proc/$(pgrep -o app)/fd | wc -l
31872
$ ulimit -n
32768
(this is a simulated illustration, not a real incident)
```

The tests ran for ten minutes and the leak of one descriptor per slow request needed days to show. A soak test of twelve hours at steady load, which the team added to the nightly pipeline, found the same growth within hours on the next release candidate. The team fixed the missing close call and added an alert on descriptor use above seventy percent.

## Common mistakes

- Load tests with unrealistic traffic
- No long running tests
- Fault injection without a stop condition
- Gates that are slow and bypassed
- Testing only the happy path

```quiz
Q: What does a soak test find?
+ Leaks and slow decay over time
- Typos :: No.
- Colour problems :: No.
- Licence issues :: No.
> Long runs reveal slow growth.

Q: What is fault injection?
+ Deliberately adding failures to test the response
- Adding features :: No.
- Deleting logs :: No.
- Raising prices :: No.
> It checks fallbacks and timeouts.

Q: What should a canary gate compare?
+ The new version SLO signals against the baseline
- Code length :: No.
- Developer count :: No.
- File names :: No.
> Worse signals stop the release.

Q: Why use realistic traffic in load tests?
+ Real mixes and bursts expose real limits
- It is cheaper :: Not the reason.
- It hides errors :: No.
- It saves time only :: No.
> Unrealistic tests give false confidence.
```

```cards
Load test :: A test at expected traffic
Soak test :: A long test at steady load
Fault injection :: Deliberate failure to test resilience
Canary :: A release to a small share of traffic first
```
