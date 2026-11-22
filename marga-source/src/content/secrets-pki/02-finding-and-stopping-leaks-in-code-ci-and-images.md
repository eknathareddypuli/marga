---
title: Finding and stopping leaks in code, CI and images
minutes: 13
summary: Find secrets that leaked into repositories, build logs and container images, block new ones with scanners and hooks, and respond correctly when one is found.
---

A secret committed once stays in history for ever, and bots scan public repositories within minutes. Prevention, detection and a calm response are all needed.

## What you will learn

- Where leaks happen in a delivery pipeline
- Pre commit and server side scanning
- Scanning history, not only the latest files
- Build logs, artifacts and image layers
- Responding: revoke first, clean history second

## Where leaks happen

Typical leaks are a key in a configuration file, a token printed in a build log, a credentials file copied into an image layer, a secret pasted into a ticket and an environment dump in a crash report. Each pipeline stage is a possible place, so scan more than the source tree.

## Scanners and hooks

A pre commit hook catches many mistakes before they leave a laptop, but hooks can be skipped. Add a server side scan on every push and pull request that blocks the merge, and use the platform secret scanning and push protection features where they exist. Tune rules to cut false positives, otherwise people learn to ignore them.

## History

Scanning only the current files misses secrets removed in later commits. Run a one time scan over the full history of important repositories and over forks and archives. Remember that removing a file in a new commit does not remove it from history.

## Logs and images

Mask secrets in CI output and never echo them. Scan build logs and artifacts. For container images, build with secret mounts, and not with arguments or copied files, because every layer is kept. Scan images for files such as private keys and credentials before publishing.

## Response

Assume any exposed secret is compromised. Revoke or rotate it first, then check the logs for use, then clean up history if it matters. Rewriting history does not help once copies exist elsewhere. Record what happened and add a control so the same path is closed.

```diagram
title: Finding and stopping leaks in code, CI and images
node: dev | Developer or job | 0 | 1 | Writes code. | Pastes key. | external
node: hook | Hook and scan | 1 | 1 | Blocks push. | Skipped. | security
node: hist | History scan | 2 | 1 | Finds old keys. | Never run. | observe
node: resp | Revoke and review | 3 | 1 | First action. | Late. | process
edge: dev | hook
edge: hook | hist
edge: hist | resp
```

## Incident: A token in a build log

> **Incident:** A token for the package registry appeared in a public build log after a debug flag was turned on.

```console
$ grep -n "npm_" build-4821.log | head -2
214: //registry.example.com/:_authToken=npm_AbCdEf123456
$ echo "token is exposed in a public log"
token is exposed in a public log
(this is a simulated illustration, not a real incident)
```

A developer had enabled verbose output while debugging, and the tool printed its configuration, including the token. The team revoked the token within minutes, checked the registry audit log for downloads and publishes, deleted the log and issued a scoped token stored as a masked variable. They added a log scanner to the pipeline and turned off verbose mode for protected branches.

## Common mistakes

- Relying only on a pre commit hook
- Scanning the latest files but not history
- Passing secrets as build arguments
- Cleaning history before revoking the secret
- Ignoring false positives until the tool is disabled

```quiz
Q: What is the first action after a secret leak?
+ Revoke or rotate the secret
- Rewrite history :: Too slow.
- Wait :: Risky.
- Delete the repository :: Does not revoke.
> Assume it is already copied.

Q: Why scan history?
+ Removed secrets still exist in old commits
- To save disk :: No.
- To speed up builds :: No.
- To rename branches :: No.
> History keeps what was committed.

Q: How should images receive build secrets?
+ Through secret mounts that are not kept in layers
- As build arguments :: Visible in layers.
- As copied files :: Kept in layers.
- In the image name :: No.
> Layers are permanent.

Q: Why add server side scanning to hooks?
+ Hooks can be skipped on a laptop
- Hooks are illegal :: No.
- Servers are faster :: Not the reason.
- Hooks hide logs :: No.
> A central gate cannot be bypassed locally.
```

```cards
Push protection :: A check that blocks a push containing a secret
Secret scanning :: Searching code and logs for exposed secrets
Build secret mount :: A way to use a secret in a build without keeping it
False positive :: An alert for something that is not a secret
```
