---
title: The secret lifecycle: inventory, ownership and rotation
minutes: 12
summary: Treat every secret as something with an owner, a purpose, an expiry and a way to replace it: build an inventory, rank by blast radius and plan rotation before a leak forces it.
---

Most secret incidents are not clever attacks. They are old passwords nobody remembers owning, copied into places nobody tracked. A lifecycle view turns a pile of strings into a managed set of assets.

## What you will learn

- What counts as a secret and where they hide
- Building an inventory with owners
- Ranking by blast radius
- Rotation: scheduled, on demand and automatic
- Revocation and the leak response plan

## What counts as a secret

Passwords, API keys, tokens, private keys, signing keys, database credentials, webhook URLs with tokens and cloud access keys are all secrets. They hide in environment variables, CI settings, old chat messages, wiki pages, shell history, backup files and container image layers. Search for them as a routine task.

## Inventory and owners

For each secret record what it protects, who owns it, where it is stored, who can read it and when it was last changed. An owner is a team that can decide to rotate it. A secret with no owner is a risk by definition, because in an incident nobody can tell if replacing it is safe.

## Blast radius

Rank secrets by what an attacker could do with them. A read only token for one test service is low. A cloud administrator key or a signing key for releases is critical. Spend effort in that order, and aim to replace the highest ranked long lived secrets with short lived credentials.

## Rotation

Scheduled rotation limits how long a stolen secret works. On demand rotation answers a leak. Automatic rotation, done by the secret store or the database, removes the human step. A design that supports two valid versions at once makes rotation safe, because clients can switch without a gap.

## Revocation and response

Write the leak plan before it is needed: who is called, how the secret is revoked, how the new one is deployed, how to check the access logs for misuse and how to tell affected people. Practise it on a low risk secret so that the first real attempt is not the first attempt.

```diagram
title: The secret lifecycle: inventory, ownership and rotation
node: inv | Inventory | 0 | 1 | Owner and purpose. | Missing. | store
node: rank | Blast radius ranking | 1 | 1 | Critical first. | Equal effort. | process
node: rot | Rotation | 2 | 1 | Two versions. | Outage. | process
node: rev | Revoke and review | 3 | 1 | Logs checked. | Forgotten. | security
edge: inv | rank
edge: rank | rot
edge: rot | rev
```

## Incident: A key that nobody dared to rotate

> **Incident:** A cloud access key was found in a public repository and nobody knew which systems used it.

```console
$ aws iam list-access-keys --user-name deploy-bot --query "AccessKeyMetadata[].[AccessKeyId,CreateDate,Status]" --output text
AKIAEXAMPLE0001 2022-03-14T09:12:00Z Active
(this is a simulated illustration, not a real incident)
```

The key was over four years old, had broad permissions and had no recorded owner. The team feared that disabling it would break production, so it stayed active for two days while they searched. They then disabled it, watched what failed and created a scoped replacement. Afterwards they built an inventory, set a maximum key age and moved the pipeline to short lived credentials.

## Common mistakes

- No owner for a secret
- One shared credential for many systems
- Rotation that needs downtime
- Never testing the leak response
- Keeping long lived admin keys for convenience

```quiz
Q: What should an inventory record for each secret?
+ Purpose, owner, location, readers and last change
- Only the value :: Dangerous to store.
- Only the colour :: Meaningless.
- Nothing :: Cannot manage it.
> You manage what you can describe.

Q: Why support two valid versions during rotation?
+ Clients can switch without an outage
- It doubles security :: Not the aim.
- It avoids logging :: No.
- It saves storage :: No.
> Overlap removes the gap.

Q: How do you rank secrets?
+ By what an attacker could do with them
- By length :: Not a risk measure.
- By age only :: Incomplete.
- Alphabetically :: Meaningless.
> Blast radius sets priority.

Q: When should the leak plan be tested?
+ Before a real leak, on a low risk secret
- During the leak only :: Too late.
- Never :: Untested plans fail.
- After an audit only :: Too slow.
> Practice makes it reliable.
```

```cards
Secret :: A value that grants access if known
Blast radius :: The damage a compromised item can cause
Rotation :: Replacing a secret with a new value
Revocation :: Making a credential stop working
```
