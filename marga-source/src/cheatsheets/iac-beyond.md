---
title: IaC beyond Terraform
summary: Refactoring, checks and layout for infrastructure code.
module: iac-beyond
---

## Safe refactoring

| Task | Tool |
|------|------|
| Rename a resource | `moved { from = A  to = B }` |
| Adopt an existing resource | `import { to = ADDR  id = ID }` |
| Move between states | `terraform state mv` after a backup |
| Remove from state only | `removed { from = ADDR lifecycle { destroy = false } }` |

## Checks

| Check | Command |
|-------|---------|
| Validate | `tofu validate` |
| Plan exit code | `tofu plan -detailed-exitcode` |
| Test | `tofu test` |
| Policy scan | `checkov -d .` |

## Layout

| Level | Holds |
|-------|-------|
| modules/ | Versioned reusable code |
| envs/ | Inputs per environment |
| state | One per environment and account |

## Handy commands

```bash
tofu validate
```

```bash
tofu plan -detailed-exitcode
```

```bash
tofu test
```

```bash
checkov -d .
```

```bash
terraform state list
```

```bash
terraform fmt -check -recursive
```

```bash
terraform state show ADDRESS
```

```bash
terraform apply -refresh-only
```

## Watch out for

> **Warning:** A rename without a moved block is planned as destroy and create, which can delete a database.

> **Warning:** State files can hold secrets in plain text, so encrypt the backend and restrict access.

> **Warning:** Do not mix tool versions on one state, because newer formats cannot always be read back.

> **Warning:** Applying without reading the plan is how production resources get replaced by accident.
