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
