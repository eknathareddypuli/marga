---
title: Cost and capacity engineering for inference
minutes: 13
summary: Estimate inference cost per request, size capacity from tokens per second, use batching, quantisation and caching, and choose between hosted and self hosted models.
---

Inference cost grows with traffic and context length. A clear cost model lets you decide where to optimise and when running your own GPUs beats an API.

## What you will learn

- Cost per request: tokens in, tokens out
- Capacity from throughput and latency targets
- Batching, quantisation and caching
- Autoscaling GPU workloads
- Hosted API versus self hosted

## Cost per request

API prices are quoted per million input and output tokens. Output tokens usually cost several times more. Long prompts, large retrieved context and chat histories dominate cost, so trimming them is often the biggest saving.

## Capacity

Throughput is measured in tokens per second per GPU, and it depends on the model size, precision, batch size and context length. Divide your peak tokens per second by the throughput of one GPU to estimate the count, add headroom for failures and test with realistic prompts, since benchmark numbers rarely match your traffic.

## Optimisation

Continuous batching serves many requests together and raises utilisation. Quantisation to eight or four bits cuts memory and increases speed with a small quality loss that you must measure. Prefix caching reuses the computed prompt start, which helps when many requests share a long system prompt.

## Autoscaling

GPU nodes take minutes to start and models take more minutes to load, so reactive scaling is slow. Scale on queue depth or tokens per second, keep a warm minimum, pre-pull images and weights and schedule scale ups before known peaks.

## Hosted or self hosted

Hosted APIs have no fixed cost and no operations, and suit low or spiky traffic. Self hosting pays off at steady high volume or for data control, but you carry staff time, spare capacity and upgrades. Compare total cost per million tokens at your real utilisation.

```diagram
title: Cost and capacity engineering for inference
node: req | Requests | 0 | 1 | Tokens in and out. | Long context. | external
node: batch | Batching and cache | 1 | 1 | Raises throughput. | Cold cache. | process
node: gpu | GPU replicas | 2 | 1 | Tokens per second. | Slow start. | service
node: cost | Cost model | 3 | 1 | Per million tokens. | Low utilisation. | observe
edge: req | batch
edge: batch | gpu
edge: gpu | cost
```

## Incident: A self hosted model that cost more than the API

> **Incident:** A team bought GPUs to save money and found the cost per token was three times higher.

```console
$ curl -s localhost:9090/api/v1/query --data-urlencode 'query=avg(DCGM_FI_DEV_GPU_UTIL)' | head -c 150
{"status":"success","data":{"result":[{"value":[1731700000,"15"]}]}}
$ curl -s localhost:9090/api/v1/query --data-urlencode 'query=sum(increase(tokens_served_total[30d]))/1e6' | head -c 150
{"status":"success","data":{"result":[{"value":[1731700000,"980"]}]}}
(this is a simulated illustration, not a real incident)
```

Two GPUs at about three dollars an hour served 980 million tokens a month at fifteen percent utilisation, which cost more per million tokens than the hosted price. The team moved light traffic to the API, kept the GPUs for steady high volume jobs and raised utilisation with batching before buying more.

## Common mistakes

- Benchmarking with unrealistic prompts
- No headroom for node failures
- Self hosting at low utilisation
- Ignoring context length in cost
- Scaling on CPU instead of queue depth

```quiz
Q: What dominates request cost?
+ Input and output tokens, especially long context
- Pod name :: No.
- Label count :: No.
- Disk name :: No.
> Trim context. Review the matching section of this lesson if it is unclear.

Q: How do you estimate GPU count?
+ Peak tokens per second divided by one GPU throughput, plus headroom
- Users times two :: Not accurate.
- RAM divided by CPU :: No.
- Pod count :: No.
> Test with real prompts.

Q: What does continuous batching do?
+ Serves many requests together to raise utilisation
- Adds latency always :: Often balanced.
- Reduces tokens :: No.
- Removes GPUs :: No.
> Higher throughput.

Q: When does self hosting pay off?
+ High, steady volume or strict data control
- Low spiky traffic :: Hosted is better.
- No staff :: Hosted is better.
- Tiny volume :: Hosted is better.
> Compare at real utilisation.
```

```cards
Token :: A unit of text processed by a model
Throughput :: Tokens generated per second
Prefix cache :: Reuse of the computed start of a prompt
Quantisation :: Reducing numeric precision to save memory
```
