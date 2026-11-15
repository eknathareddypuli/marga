---
title: LLM gateways: routing, caching and rate limits
minutes: 12
summary: Put a gateway in front of model providers for routing, fallbacks, caching, quotas and key management, and understand its failure modes.
---

When many teams call model APIs directly, keys leak, costs surprise and outages spread. A gateway gives one place for policy, visibility and resilience.

## What you will learn

- What a gateway does
- Routing and fallback between models and providers
- Caching: exact and semantic
- Rate limits, quotas and budgets
- Keys, logging and privacy

## Functions

A gateway exposes one API to applications and forwards to providers or self hosted models. It holds the provider keys, authenticates callers, records usage per team and applies limits. Applications switch models by changing a name in configuration, not code.

## Routing and fallback

Route simple requests to cheaper, faster models and hard ones to stronger models. Fall back to a second provider on errors or timeouts, with a retry budget so retries do not multiply load. Test that fallback models give acceptable answers, because behaviour differs.

## Caching

An exact cache returns a stored answer for an identical request, which is safe for deterministic calls. A semantic cache returns an answer for a similar request, which saves more but can return a wrong answer for a question that differs in a small, important detail. Use it only where mistakes are cheap and set a similarity threshold carefully.

## Limits and budgets

Limit requests and tokens per minute per team and per key, and set monthly budgets with alerts. Limit the maximum output length to stop runaway generations. Return clear errors with a retry time so clients can back off.

## Keys, logs and privacy

Never give provider keys to applications. Log metadata such as model, tokens, latency and cost for every call. Logging prompts and outputs is useful for debugging but may contain personal data, so redact it, restrict access and set a short retention period.

```diagram
title: LLM gateways: routing, caching and rate limits
node: app | Applications | 0 | 1 | Call one API. | Direct keys. | external
node: gw | Gateway | 1 | 1 | Auth, limits, routing. | Single point of failure. | process
node: cache | Cache | 2 | 1 | Saves calls. | Wrong semantic hit. | store
node: prov | Model providers | 3 | 1 | Generate text. | Outage. | service
edge: app | gw
edge: gw | cache
edge: gw | prov
```

## Incident: A retry storm during a provider outage

> **Incident:** When a provider slowed down, retries from every service tripled the load and the gateway fell over.

```console
$ curl -s localhost:4000/metrics | grep -E 'requests_total|retries_total' | head -3
gateway_requests_total{status="429"} 18420
gateway_retries_total 52211
(this is a simulated illustration, not a real incident)
```

Each client retried three times and the gateway retried again, multiplying traffic. A shared retry budget, exponential backoff with jitter, a circuit breaker that failed fast to the fallback provider and per team limits stopped the next incident from spreading.

## Common mistakes

- Provider keys inside applications
- Fallback to a model nobody tested
- Semantic cache for exact answers such as prices
- Unlimited output length
- Logging full prompts with personal data forever

```quiz
Q: Why use a gateway?
+ One place for keys, limits, routing and usage
- To avoid APIs :: No.
- To train models :: No.
- To store data forever :: No.
> Central policy.

Q: What is a risk of semantic caching?
+ Returning an answer for a similar but different question
- Slower answers :: Usually faster.
- Higher cost :: Usually lower.
- No logs :: No.
> Use a threshold.

Q: What should limits include?
+ Requests, tokens and budgets per team
- Only CPU :: No.
- Only disk :: No.
- Nothing :: Costs grow.
> Prevent runaway costs.

Q: How do you avoid retry storms?
+ Retry budgets, backoff with jitter and circuit breakers
- More retries :: Worse.
- Longer prompts :: No.
- Bigger nodes :: No.
> Fail fast. Review the matching section of this lesson if it is unclear.
```

```cards
LLM gateway :: A proxy that manages access to model APIs
Fallback :: Switching to another model when one fails
Semantic cache :: A cache that matches similar requests
Token budget :: A limit on tokens that can be used
```
