---
title: Troubleshooting scenarios
summary: The method, pod status map, gateway errors and cloud denial layers.
module: troubleshooting-scenarios
---

## The method

| Step | Action |
|------|--------|
| 1 | Write the symptom: who, what, since when |
| 2 | Ask what changed |
| 3 | Bisect the request path |
| 4 | One hypothesis, one test, one note |
| 5 | Mitigate, then find the cause |

## Pod status to next command

| Status | Next command |
|--------|-------------|
| Pending | `kubectl describe pod` events |
| ImagePullBackOff | Read the registry message |
| CrashLoopBackOff | `kubectl logs --previous` |
| Running, not ready | Check the readiness probe |

## Gateway errors

| Code | Suggests |
|------|----------|
| 502 | Backend closed or invalid response |
| 503 | No healthy backend or overload |
| 504 | Backend too slow |

## Cloud denials

| Layer | Check |
|-------|-------|
| Identity policy | Policy simulator |
| Resource policy | Resource side policy |
| Organisation policy | Service control policy |
| Quota | Service quotas page |

## Handy commands

```bash
kubectl describe pod POD -n NAMESPACE
```

```bash
kubectl logs POD -n NAMESPACE --previous
```

```bash
kubectl exec POD -- cat /etc/resolv.conf
```

```bash
kubectl get events -n NAMESPACE --sort-by=.lastTimestamp
```

```bash
kubectl get endpoints SERVICE -n NAMESPACE
```

```bash
kubectl describe node NODE
```

## Watch out for

> **Warning:** Change one thing at a time, otherwise no result can be interpreted.

> **Warning:** Save logs and a heap dump before you restart, because the restart removes the evidence.

> **Warning:** Do not edit the identity policy when an organisation level deny is the cause.

> **Warning:** Retrying immediately after throttling makes the throttling worse.
