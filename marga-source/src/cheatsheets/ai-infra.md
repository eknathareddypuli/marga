---
title: AI infrastructure
summary: GPU sharing, RAG checks and gateway settings.
module: ai-infra
---

## GPU sharing

| Method | Isolation | Use |
|--------|-----------|-----|
| Whole GPU | Full | Training and large models |
| MIG | Hardware slices | Small, steady services |
| Time slicing | None | Light, bursty dev workloads |

## RAG checks

| Check | Question |
|-------|----------|
| Freshness | When was the index last updated? |
| Recall | Do the right chunks appear in the top k? |
| Grounding | Does the answer cite retrieved text? |

## Gateway settings

| Setting | Purpose |
|---------|---------|
| Rate limit | Protect quotas |
| Cache | Cut repeated cost |
| Fallback | Survive provider errors |
| Budget | Cap spend per team |

## Handy commands

```bash
nvidia-smi
```

```bash
nvidia-smi mig -lgi
```

```bash
kubectl describe node GPU_NODE | grep -A5 nvidia.com/gpu
```

```bash
kubectl top pod -n inference
```

```bash
kubectl get pods -n inference -o wide
```

```bash
curl -s http://INFERENCE_HOST/metrics
```

## Watch out for

> **Warning:** Time slicing gives no memory isolation, so one noisy job can crash its neighbours.

> **Warning:** Quantised or smaller models can change answer quality, so test before you switch.

> **Warning:** A fast index with stale data returns confident wrong answers, so alert on index age.

> **Warning:** Provider fallbacks can hide an outage and raise cost, so alert when fallback traffic grows.
