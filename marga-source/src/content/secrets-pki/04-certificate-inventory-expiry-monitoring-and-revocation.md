---
title: Certificate inventory, expiry monitoring and revocation
minutes: 12
summary: Know every certificate you depend on, alert long before expiry, understand what revocation really does in practice and why short lifetimes are the best control.
---

Expired certificates cause some of the most avoidable outages, because the date is known months ahead. The hard part is not the renewal command but knowing that the certificate exists.

## What you will learn

- Where certificates hide
- Building an inventory from several sources
- Expiry alerts that reach a person who can act
- How revocation works: CRL, OCSP and stapling
- Short lifetimes as the main defence

## Where they hide

Public sites, internal services, load balancers, mail servers, VPN gateways, databases, client certificates, code signing certificates and certificates embedded in appliances. Many are issued by different teams and renewed by hand once a year, which is exactly how they get forgotten.

## Inventory sources

Combine several views: certificate transparency logs for public names, cloud certificate manager listings, Kubernetes certificate objects, scans of your address ranges for TLS endpoints and the issuance logs of your internal CA. Record the owner, the names, the issuer, the expiry and how it is renewed.

## Alerts

Probe the real endpoint and read the certificate that clients see, because the one in a store may not be the one deployed. Alert at thirty, fourteen and seven days, and route to the owning team. Add a check on the renewal process itself, such as a failed automatic renewal, since that appears weeks before the expiry.

## Revocation

A certificate authority can revoke a certificate and publish that in a revocation list or answer status queries with OCSP. In practice many clients do not check, or fail open if the check fails. Stapling lets the server attach a fresh signed status. Because revocation is unreliable, design so that a stolen key becomes useless soon.

## Short lifetimes

Certificates valid for days or weeks limit the damage from a stolen key and force automation to work. Public certificate lifetimes are being shortened across the industry, so manual renewal will not survive. Automate issuance and renewal with ACME or an internal CA, and treat a manual step as a defect.

```diagram
title: Certificate inventory, expiry monitoring and revocation
node: find | Discovery | 0 | 1 | Logs and scans. | Gaps. | observe
node: inv | Inventory | 1 | 1 | Owner and expiry. | Stale. | store
node: mon | Expiry monitor | 2 | 1 | Probe endpoints. | Wrong source. | observe
node: auto | Automated renewal | 3 | 1 | Short lifetime. | Manual. | process
edge: find | inv
edge: inv | mon
edge: mon | auto
```

## Incident: The certificate on the forgotten gateway

> **Incident:** A partner integration failed at night because a certificate on an old gateway expired.

```console
$ echo | openssl s_client -connect gw.example.com:443 -servername gw.example.com 2>/dev/null | openssl x509 -noout -enddate
notAfter=Nov 10 23:59:59 2026 GMT
(this is a simulated illustration, not a real incident)
```

The gateway was set up three years earlier by a team that had since moved, and its certificate was renewed by hand each year. It was not in any inventory and no alert covered it. Engineers replaced the certificate that night. Afterwards they scanned all address ranges for TLS endpoints, built an inventory with owners and moved the gateway to automatic renewal with an expiry probe.

## Common mistakes

- Trusting a store listing instead of the live endpoint
- Alerting only a shared mailbox
- Relying on revocation to contain a stolen key
- Manual renewal of any certificate
- Not covering client and code signing certificates

```quiz
Q: Why probe the live endpoint?
+ It shows the certificate that clients actually receive
- It is cheaper :: Not the reason.
- It signs the certificate :: No.
- It changes DNS :: No.
> The deployed one may differ from the stored one.

Q: What is OCSP stapling?
+ The server attaches a fresh signed revocation status
- A way to encrypt disks :: No.
- A load balancer mode :: No.
- A DNS record :: No.
> It avoids client lookups.

Q: Why are short lifetimes good?
+ A stolen key stops working soon
- They look nice :: No.
- They remove logs :: No.
- They avoid DNS :: No.
> They also force automation.

Q: What gives early warning of expiry problems?
+ Alerts on failed renewals as well as on dates
- Waiting for users :: Too late.
- Yearly reviews :: Too slow.
- Guessing :: No.
> Renewal failures show up weeks earlier.
```

```cards
Certificate transparency :: Public logs of issued certificates
CRL :: A list of revoked certificates
OCSP :: A protocol to check certificate status
Stapling :: Attaching a signed status to the handshake
```
