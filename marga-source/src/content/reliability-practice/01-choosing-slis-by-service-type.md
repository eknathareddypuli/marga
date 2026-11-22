---
title: Choosing SLIs by service type
minutes: 12
summary: Pick service level indicators that match what users feel for request services, pipelines, storage and batch jobs, and measure them at the right place with the right denominator.
---

An SLO is only as good as its indicator. A number that is easy to collect but does not match user experience gives false comfort, so choose indicators by asking what a user would call broken.

## What you will learn

- What makes a good SLI
- Indicators for request driven services
- Indicators for data pipelines, storage and batch jobs
- Where to measure: server, balancer, client or probe
- Good events, valid events and the ratio

## What makes a good SLI

A good indicator is a ratio of good events to valid events, correlates with user happiness, and can be measured reliably. It moves when users are hurt and stays still when they are not. CPU use fails that test, because high CPU is often fine. Success rate and latency of real requests pass it.

## Request services

For a request service use availability, the share of valid requests that succeed, and latency, the share served faster than a threshold. Use a threshold at a chosen percentile, such as ninety nine percent of requests under three hundred milliseconds. Count client errors as valid events only where they reflect a failure of the service.

## Pipelines and storage

For a data pipeline use freshness, the share of time that data is newer than a limit, and correctness, the share of records that pass checks. For storage use durability, the share of objects retrievable intact, and read and write success. For batch jobs use the share of runs that finish in time with correct output.

## Where to measure

Server side metrics are easy but miss failures before the request arrives. Load balancer logs see more of the path. Client side or real user measurements see the most but are noisy. Synthetic probes give a steady signal but test only what they call. Combine two sources and prefer the one closest to the user that you trust.

## Good, valid and the ratio

Define which events are valid and which are good in words first. Exclude health checks and known test traffic from valid events. Write the query that counts both sides, and test it with a failure. A clear definition lets everyone calculate the same number and makes disputes short.

```diagram
title: Choosing SLIs by service type
node: user | User journey | 0 | 1 | What feels broken. | Not asked. | external
node: sli | SLI definition | 1 | 1 | Good over valid. | Vague. | process
node: src | Measurement source | 2 | 1 | Balancer or client. | Blind spot. | observe
node: slo | Target | 3 | 1 | Goal over a window. | Too strict. | process
edge: user | sli
edge: sli | src
edge: src | slo
```

## Incident: Green dashboards and angry customers

> **Incident:** The availability dashboard showed one hundred percent while customers could not check out.

```console
$ curl -s -o /dev/null -w "%{http_code} %{time_total}\n" https://shop.example.com/checkout
200 11.482
(this is a simulated illustration, not a real incident)
```

The indicator counted only the share of responses that were not server errors, and the checkout page returned 200 after eleven seconds, so it counted as good. Customers abandoned the page. The team added a latency threshold to the indicator, measured it at the load balancer for the checkout journey and set an alert on the new burn rate. The dashboard then matched the experience.

## Common mistakes

- Using CPU or memory as an SLI
- Counting a slow success as good
- Including health checks in the denominator
- Measuring only inside the service
- Defining indicators without asking users

```quiz
Q: What is a good SLI shape?
+ Good events divided by valid events
- CPU use :: Not user related.
- Number of servers :: No.
- Log volume :: No.
> It maps to user experience.

Q: Which SLI suits a data pipeline?
+ Freshness of the output data
- Disk size :: No.
- Number of jobs :: No.
- Host uptime :: No.
> Users care that data is recent and correct.

Q: Why combine measurement sources?
+ Each source has a blind spot
- To raise cost :: No.
- To hide data :: No.
- To avoid alerts :: No.
> Use the one closest to the user that you trust.

Q: Why write good and valid events in words?
+ So everyone computes the same number
- For marketing :: No.
- For compression :: No.
- For legal reasons :: No.
> It prevents disputes about the data.
```

```cards
SLI :: A measured indicator of service behaviour
Valid event :: An event that counts in the denominator
Freshness :: How recent the data is
Synthetic probe :: A scripted check that simulates a user
```
