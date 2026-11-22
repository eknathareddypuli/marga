---
title: Secrets, PKI and certificates
summary: Secret lifecycle, certificate commands, delivery options and expiry alerts.
module: secrets-pki
---

## Secret lifecycle

| Step | Question |
|------|----------|
| Inventory | Who owns it and where is it? |
| Rank | What is the blast radius? |
| Rotate | Can two versions overlap? |
| Revoke | Who does it and how fast? |

## Useful commands

| Job | Command |
|-----|---------|
| Certificate expiry | `openssl x509 -noout -enddate` |
| Live certificate | `openssl s_client -connect HOST:443 -servername HOST` |
| Kubernetes certificate state | `kubectl describe certificate NAME` |
| Challenge state | `kubectl describe challenge -n NAMESPACE` |

## Delivery options

| Option | Strength | Watch for |
|--------|----------|-----------|
| Native Secret | Simple | Encode only |
| External Secrets Operator | Source outside cluster | Values copied into Secrets |
| CSI driver | Files from a store | Store must be reachable |
| SOPS | Encrypted files in repository | Key management |

## Expiry alerts

| Days left | Action |
|-----------|--------|
| 30 | Ticket to owner |
| 14 | Page owner channel |
| 7 | Escalate |

## Handy commands

```bash
echo | openssl s_client -connect HOST:443 -servername HOST 2>/dev/null | openssl x509 -noout -enddate
```

```bash
kubectl describe certificate NAME -n NAMESPACE
```

```bash
kubectl describe challenge -n NAMESPACE
```

```bash
kubectl get externalsecret -A
```

```bash
openssl x509 -in cert.pem -noout -subject -issuer -dates
```

```bash
kubectl get certificaterequests -A
```

## Watch out for

> **Warning:** Assume any exposed secret is copied, so revoke first and clean history after.

> **Warning:** Base64 is not encryption, so enable encryption at rest and limit who can read Secrets.

> **Warning:** Probe the live endpoint, because the certificate in a store may not be the one served.

> **Warning:** A federation trust with a wildcard subject lets any repository assume the role.
