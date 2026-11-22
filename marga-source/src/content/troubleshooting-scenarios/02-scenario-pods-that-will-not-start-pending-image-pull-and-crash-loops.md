---
title: Scenario: pods that will not start: Pending, image pull and crash loops
minutes: 13
summary: Work through the three common Kubernetes start failures with the events and commands that separate scheduling, image and application problems.
---

A pod can fail before it is placed, before the image arrives or after the process starts. Each state points to a different owner, so the status tells you where to look.

## What you will learn

- Pending: reading scheduling events
- ImagePullBackOff and ErrImagePull
- CrashLoopBackOff: exit codes and previous logs
- Probes that kill healthy pods
- A decision table from status to next command

## Pending

A Pending pod has been accepted but not placed or started. Run describe and read the events. The message names the cause: insufficient CPU or memory, no node matching a selector or affinity, taints without a toleration, an unbound volume claim or a quota. Fix the request, add capacity, correct the rule or bind the volume.

## Image pull errors

ErrImagePull means the node could not fetch the image, and ImagePullBackOff means it is waiting before retrying. The events show the registry message: not found for a wrong name or tag, unauthorized for missing pull credentials, or a timeout for a network or rate limit problem. Test with the same credentials from the node or with a debug pod.

## Crash loops

CrashLoopBackOff means the container starts and exits repeatedly. Read the last state in describe for the exit code and reason. Code 1 is an application error, 137 is a kill signal that often means out of memory, and 143 is a normal termination. Use logs with the previous flag to read the output of the crashed run.

## Probes

A liveness probe that fails restarts the container. A probe that is too strict, has too short a timeout or starts before the application is ready causes restarts that look like crashes. A readiness probe removes the pod from service without restarting it. Use a startup probe for slow starting applications.

## Decision table

Pending leads to describe events. ImagePull leads to the registry message and credentials. CrashLoop leads to the exit code and previous logs. Running but not ready leads to the readiness probe and its endpoint. Write the status next to the command in your runbook, so that it can be followed under pressure.

```diagram
title: Scenario: pods that will not start: Pending, image pull and crash loops
node: pend | Pending | 0 | 1 | Scheduling events. | Resources. | process
node: img | Image pull | 1 | 1 | Registry message. | Credentials. | external
node: crash | Crash loop | 2 | 1 | Exit code. | Probe or OOM. | service
node: ready | Ready pod | 3 | 1 | Serves traffic. | Probe fails. | service
edge: pend | img
edge: img | crash
edge: crash | ready
```

## Incident: The deployment that kept restarting

> **Incident:** A new version restarted every minute and the logs were empty after each restart.

```console
$ kubectl describe pod orders-6f7 -n shop | grep -A6 "Last State"
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
$ kubectl logs orders-6f7 -n shop --previous | tail -1
starting cache warm up
(this is a simulated illustration, not a real incident)
```

The previous logs showed that the container was loading a large cache at start. The pod had a memory limit lower than the cache size, so the kernel killed it each time, and exit code 137 with OOMKilled confirmed it. The team raised the memory limit, made the warm up lazy and added a startup probe so that slow starts were not treated as failures.

## Common mistakes

- Reading current logs of a restarted container only
- Ignoring the events section of describe
- Liveness probes without start up allowance
- Setting limits below real peak use
- Retrying the same image tag blindly

```quiz
Q: Where do you find why a pod is Pending?
+ In the events from kubectl describe
- In the image :: No.
- In the DNS zone :: No.
- In the registry :: No.
> The scheduler message names the cause.

Q: What does exit code 137 often mean?
+ The container was killed, often for memory
- Normal exit :: That is zero.
- Config typo :: Not necessarily.
- Network failure :: No.
> Check the reason OOMKilled.

Q: How do you read logs of the crashed run?
+ Use the previous flag on kubectl logs
- Restart the node :: No.
- Delete the namespace :: No.
- Scale to zero :: No.
> The current run may be empty.

Q: What does a failing readiness probe do?
+ Removes the pod from service without restarting it
- Restarts it :: That is liveness.
- Deletes it :: No.
- Builds it :: No.
> Liveness restarts, readiness routes.
```

```cards
Pending :: A pod accepted but not yet placed or started
ImagePullBackOff :: Waiting before retrying an image fetch
CrashLoopBackOff :: Repeated start and exit of a container
Startup probe :: A probe that protects slow starting containers
```
