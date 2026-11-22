## What is your first step in an incident?
level: junior
I write down the symptom precisely, who sees what since when, then ask what changed. That removes most possibilities and points me to a layer before I touch anything.

## How do you localise a failure?
level: mid
I bisect the request path by testing in the middle, for example calling the backend directly. Each test removes half of the chain, and I run one hypothesis and one test at a time and record the results.

## How do you debug a pod that will not start?
level: junior
The status decides. Pending means read the scheduling events, image pull errors mean read the registry message and credentials, and a crash loop means read the exit code and the previous logs, then check probes.

## How do you debug slow DNS?
level: mid
I test resolution from the pod, look at resolv.conf for ndots and search domains, check CoreDNS errors and latency, packet loss and conntrack, and query upstream resolvers directly. A node local cache often helps.

## Why do you get random 502 errors behind a balancer?
level: mid
Often the backend closes idle connections sooner than the balancer, so a reused connection fails. I compare the timeouts, read the balancer and backend status in logs and also check deployments and draining.

## What do you check when an API call is denied?
level: mid
I read the error and the audit log to find the caller, action and denying layer. It may be an identity policy, a resource policy or an organisation level deny, and I do not edit the wrong layer.
