---
title: Workload identity, SPIFFE and key management
minutes: 13
summary: Replace stored secrets with identity: OIDC federation for pipelines and pods, SPIFFE identities for services, and envelope encryption with a key management service.
---

The safest secret is the one that never exists. If a workload can prove who it is, a system can give it a short lived credential without any password being stored.

## What you will learn

- Identity instead of stored secrets
- OIDC federation for CI and Kubernetes service accounts
- SPIFFE and SPIRE for service identity
- Key management services and envelope encryption
- Key rotation, access policy and audit

## Identity instead of secrets

A workload presents a signed token that says who it is and where it runs, and the receiving system maps that to permissions. No long lived password is created, copied or leaked. This is the direction of most modern platforms, and it also makes audits clearer, because access is tied to a named workload.

## OIDC federation

A pipeline or a pod receives a short lived signed token from its platform. A cloud role is configured to trust that issuer and to accept only tokens with a specific subject, such as one repository and branch. The workload exchanges the token for temporary cloud credentials. Restrict the conditions tightly, because a broad trust lets other workloads assume the role.

## SPIFFE and SPIRE

SPIFFE defines a standard identity name for a workload and a format for proving it, usually an X.509 certificate or a signed token. SPIRE is an implementation that attests workloads using properties of the node and the pod and then issues short lived identities. Services use them for mutual TLS without managing certificates by hand.

## Key management

A key management service stores master keys in hardware backed storage and never reveals them. Envelope encryption uses a data key to encrypt data and the master key to encrypt the data key, so large data stays local and only small requests go to the service. Policies decide which identities can use each key.

## Rotation and audit

Rotate master keys on a schedule, which usually keeps old versions for decrypting existing data. Limit key administration and key use to different roles, and send every key use to an audit log. Alert on unusual decrypt volume, since mass decryption is a sign of theft.

```diagram
title: Workload identity, SPIFFE and key management
node: wl | Workload | 0 | 1 | Gets a token. | Broad trust. | service
node: idp | Token issuer | 1 | 1 | Signs identity. | Wrong subject. | security
node: role | Role or policy | 2 | 1 | Temporary access. | Over broad. | security
node: kms | Key service | 3 | 1 | Envelope keys. | Unaudited. | store
edge: wl | idp
edge: idp | role
edge: role | kms
```

## Incident: A role that any repository could assume

> **Incident:** A federation trust accepted tokens from any repository in the organisation.

```console
$ aws iam get-role --role-name deploy-prod --query "Role.AssumeRolePolicyDocument.Statement[0].Condition"
{"StringLike": {"token.actions.githubusercontent.com:sub": "repo:example-org/*"}}
(this is a simulated illustration, not a real incident)
```

The role trusted every repository in the organisation, so a test repository with weak review could obtain production deploy rights. A review found it before misuse. The team limited the condition to one repository and one protected environment, added a policy test that rejects wildcards in the subject, and logged every assumption of the role.

## Common mistakes

- Wildcard subjects in a federation trust
- Keeping long lived keys beside the federation
- Storing data keys unencrypted
- Same role for key admin and key use
- No alert on unusual decrypt activity

```quiz
Q: What does OIDC federation remove?
+ The need to store long lived cloud keys in the pipeline
- The need for code :: No.
- Logs :: No.
- Networks :: No.
> Tokens are short lived and issued on demand.

Q: What is envelope encryption?
+ A data key encrypts data and the master key encrypts the data key
- Encrypting an envelope :: Not meant.
- A password hash :: No.
- A DNS record :: No.
> Only small requests go to the key service.

Q: What does SPIFFE define?
+ A standard identity for workloads
- A database format :: No.
- A cloud region :: No.
- A package manager :: No.
> SPIRE issues short lived identities.

Q: Why restrict the token subject?
+ So only the intended workload can assume the role
- To shorten logs :: No.
- To speed up login :: No.
- To change DNS :: No.
> A wildcard widens who can get access.
```

```cards
OIDC federation :: Trusting tokens from an identity provider
SPIFFE :: A standard for workload identity names
Envelope encryption :: Encrypting data keys with a master key
KMS :: A service that holds and uses master keys
```
