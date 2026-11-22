---
title: Operating cert-manager: issuers, ACME and failures
minutes: 13
summary: Run cert-manager well: issuers and cluster issuers, HTTP-01 and DNS-01 challenges, renewals, rate limits and how to debug a certificate that will not become ready.
---

cert-manager turns certificates into Kubernetes objects that renew themselves. It works quietly until a challenge fails, a rate limit is hit or a webhook is down, so you need to know how to read its objects.

## What you will learn

- The objects: Issuer, Certificate, CertificateRequest, Order and Challenge
- HTTP-01 and DNS-01 and when to use each
- Renewal timing and secret handling
- Rate limits and staging environments
- A debugging path from Certificate to Challenge

## The objects

You define an Issuer or ClusterIssuer that describes the authority, and a Certificate that asks for names. cert-manager creates a CertificateRequest, then for ACME an Order and one Challenge per name, and finally stores the result in a Secret. Each object has status conditions, and the chain shows where it stopped.

## HTTP-01 and DNS-01

HTTP-01 proves control by serving a token over port 80, so it needs the name to be reachable from the internet and cannot issue wildcards. DNS-01 proves control by creating a TXT record, so it works for wildcards and private services, but the controller needs limited permission to edit the DNS zone. Scope that permission to the challenge records.

## Renewal

By default cert-manager renews when about a third of the lifetime remains, and updates the Secret in place. Applications and ingress controllers must reload the new files, so test that they do. Set an alert for certificates that are not ready or are close to expiry, using the metrics that cert-manager exports.

## Rate limits

Public authorities limit how many certificates can be requested for a name in a period. A retry loop in a broken setup can hit the limit and block you for days. Develop against the staging endpoint, avoid issuing many separate certificates for one domain and reuse a wildcard where it makes sense.

## Debugging path

Run describe on the Certificate, then on its CertificateRequest, Order and Challenge, reading the events at each level. Common causes are an ingress that does not route the challenge path, a missing DNS permission, a webhook that is unavailable after an upgrade and a clock or network problem. Fix the cause and delete the failed Challenge to retry.

```diagram
title: Operating cert-manager: issuers, ACME and failures
node: cert | Certificate | 0 | 1 | Names wanted. | Not ready. | service
node: ord | Order and Challenge | 1 | 1 | Proof of control. | Pending. | process
node: iss | Issuer and CA | 2 | 1 | Signs. | Rate limit. | external
node: sec | Secret and ingress | 3 | 1 | Serves it. | No reload. | service
edge: cert | ord
edge: ord | iss
edge: iss | sec
```

## Incident: A certificate that stayed pending for a day

> **Incident:** A new service had no certificate after the deployment and the ingress served a default one.

```console
$ kubectl describe challenge -n shop | grep -E "State|Reason"
State:   pending
Reason:  Waiting for HTTP-01 challenge propagation: wrong status code '404', expected '200'
(this is a simulated illustration, not a real incident)
```

The ingress rule for the service forced a redirect and a rewrite that sent the challenge path to the application, which returned 404. The team allowed the challenge path through, deleted the failed Challenge so that it retried, and the certificate became ready in a minute. They added a test that requests a certificate in staging for every new ingress pattern.

## Common mistakes

- Using the production endpoint while testing
- Granting DNS edit rights to the whole zone
- Not reloading applications after renewal
- Ignoring the Challenge events
- Issuing many certificates for one domain

```quiz
Q: Which challenge supports wildcard names?
+ DNS-01
- HTTP-01 :: Cannot do wildcards.
- Ping :: Not a challenge.
- SMTP :: No.
> It proves control with a TXT record.

Q: Where do you start debugging a pending certificate?
+ Describe the Certificate and follow to the Challenge
- Reboot nodes :: Not useful.
- Delete the cluster :: No.
- Change the CPU :: No.
> The chain of objects shows where it stopped.

Q: Why use the staging endpoint?
+ To avoid hitting production rate limits while testing
- It is slower :: Not the point.
- It is cheaper :: Not the point.
- It signs more names :: No.
> Rate limit blocks last for days.

Q: What must applications do on renewal?
+ Reload the updated certificate files
- Nothing :: May serve an old one.
- Rename the host :: No.
- Disable TLS :: No.
> Updating the Secret is not enough.
```

```cards
ClusterIssuer :: A cluster wide definition of a certificate authority
Challenge :: A step proving control of a name
HTTP-01 :: A challenge that serves a token over HTTP
DNS-01 :: A challenge that publishes a DNS TXT record
```
