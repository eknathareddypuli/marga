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
