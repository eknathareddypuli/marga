---
title: Incident response for a compromised cluster
minutes: 14
summary: Detect, contain, investigate and recover from a compromised pod or node using audit logs, runtime detection and a clear order of actions.
---

When a workload is compromised, the pressure is to delete it. Deleting destroys evidence and may leave the real problem untouched. A short, practised order of actions contains the damage first and investigates second.

## What you will learn

- Signals: audit logs, Falco alerts, network and cost anomalies
- Containment without destroying evidence
- Investigation steps and what to collect
- Eradication and credential rotation
- Lessons and detection improvements

## Detection

Signals come from several places. Falco or another runtime sensor alerts on a shell spawned in a container, writes below /etc, unexpected outbound connections and reads of sensitive files. The audit log shows unusual API calls, such as listing secrets or creating privileged pods from a service account that normally does not. Cost or network graphs may show cryptomining or data exfiltration. Treat an alert as a hypothesis and confirm it.

## Contain first

Limit the blast radius before you investigate. Apply a network policy that isolates the pod, label it so a quarantine policy matches, and cordon the node so nothing new lands there. Revoke or rotate the service account token and any credential the pod could read. Preserve evidence: do not delete the pod yet. Take a snapshot of the node disk if you can, and copy logs.

```bash
kubectl label pod web-7d9 quarantine=true --overwrite
kubectl cordon node-a3
kubectl get pod web-7d9 -o yaml > /secure/evidence/web-7d9.yaml
kubectl logs web-7d9 --all-containers > /secure/evidence/web-7d9.log
```

## Investigate

Find out how the attacker got in, what they touched and whether they moved. Review audit logs for that service account and for the node, list what the pod could access with its permissions, check for new pods, jobs, cron jobs and RBAC objects, inspect the image and the running process tree, and check cloud audit logs for the node role. Build a timeline.

## Eradicate and recover

Remove the cause: patch the vulnerability, rebuild the image, redeploy from a known good source and replace affected nodes instead of cleaning them. Rotate every credential that was reachable: tokens, Secrets, database passwords and cloud keys. Verify with scans and detection that the attacker no longer has access, and watch closely for a while.

## Learn

Write a short blameless review. Add the detection that would have caught the event earlier, close the path that was used, and rehearse the response. Keep a runbook with contacts, decisions about who may isolate production workloads and where evidence is stored.

```diagram
title: Incident response for a compromised cluster
node: det | Detect | 0 | 1 | Falco, audit, graphs. | Not alerting. | observe
node: cont | Contain | 1 | 1 | Isolate and rotate. | Delete too early. | security
node: inv | Investigate | 2 | 1 | Timeline and scope. | Partial view. | observe
node: rec | Recover | 3 | 1 | Rebuild and rotate. | Reused credentials. | process
node: lrn | Learn | 4 | 1 | New detection. | No review. | store
edge: det | cont
edge: cont | inv
edge: inv | rec
edge: rec | lrn
```

## Incident: Deleting the pod and losing the trail

> **Incident:** A suspicious pod was deleted immediately, and the team could not tell what it had accessed.

```console
$ kubectl delete pod web-7d9
pod "web-7d9" deleted
$ kubectl get pods -l app=web
NAME      READY   STATUS    AGE
web-8c1   1/1     Running   4s
$ kubectl logs web-7d9
Error from server (NotFound): pods "web-7d9" not found
(this is a simulated illustration, not a real incident)
```

The replacement pod appeared at once, but the original process tree, files and logs were gone, and its service account token was still valid. The team could not tell what the attacker had read. In a later incident they isolated the pod with a network policy, rotated the token, copied evidence and then replaced it. Contain first, preserve evidence, then remove.

## Common mistakes

- Deleting the workload before collecting evidence
- Not rotating the credentials the pod could reach
- Cleaning a node instead of replacing it
- No runtime detection or audit logs enabled
- No written response runbook

```quiz
Q: What is the first priority after confirming a compromise?
+ Contain it without destroying evidence
- Delete everything :: Loses evidence.
- Reboot the cluster :: Destroys state.
- Ignore it :: No.
> Isolate, then investigate.

Q: How can you isolate a pod quickly?
+ Label it to match a quarantine network policy
- Increase replicas :: No.
- Change DNS :: No.
- Resize it :: No.
> The policy blocks its traffic.

Q: Why replace a node instead of cleaning it?
+ You cannot be sure the host is clean
- It is cheaper :: Not the reason.
- It is faster to type :: Not the reason.
- It saves IPs :: Not the reason.
> Rebuild from a known good image.

Q: Which credentials should be rotated?
+ Everything the compromised workload could reach
- Only the pod name :: No.
- Only the image tag :: No.
- Nothing :: Unsafe.
> Assume anything readable was read.
```

```cards
Quarantine :: Isolating a workload so it cannot communicate
Evidence :: Logs and artifacts needed to understand an incident
Falco :: A runtime security detection tool
Audit log :: A record of API requests
Blast radius :: The extent of damage from a compromise
```
