---
title: State, secrets and safe migrations
minutes: 12
summary: Protect state files and secrets, use remote backends with locking, and restructure code with moved, import and removed blocks without recreating resources.
---

State is the memory of your infrastructure tool, and it often contains secrets. Refactoring code without telling the tool what moved leads to destroy and create. Safe procedures avoid both problems.

## What you will learn

- Remote state, locking and access control
- Secrets in state and in code
- Moving resources with moved blocks
- Importing existing resources
- Removing from state without destroying

## Remote state

Store state in a remote backend such as an object store with versioning, encryption and a lock table, so only one apply runs at a time and you can roll back a bad write. Limit read access, because state may contain passwords and keys.

## Secrets

Do not put secrets in code or variable files in the repository. Read them at run time from a secrets manager, mark outputs as sensitive and be aware that sensitive values are still stored in state. Prefer resources that generate and store secrets in the manager without exposing them to the tool.

## Moved blocks

When you rename a resource or move it into a module, the tool sees a delete and a create. A `moved` block tells it the old address and the new address so the real resource is kept. Review the plan: it should show moves and no replacements.

## Import

To bring an existing resource under management, write the resource block and use an `import` block or the import command with its id. Run a plan until it shows no changes, adjusting the code to match reality. Import in small steps and keep a backup of state.

## Removing safely

To stop managing something without deleting it, use a `removed` block with `lifecycle { destroy = false }` or the state remove command. Use `prevent_destroy` on critical resources such as databases so a mistaken plan fails loudly.

```diagram
title: State, secrets and safe migrations
node: code | Refactored code | 0 | 1 | New addresses. | Renames. | external
node: mv | Moved and import blocks | 1 | 1 | Map old to new. | Missing blocks. | process
node: lock | Remote backend and lock | 2 | 1 | One apply at a time. | Stuck lock. | store
node: res | Real resources | 3 | 1 | Kept intact. | Recreated. | service
edge: code | mv
edge: mv | lock
edge: lock | res
```

## Incident: A rename that planned to delete the database

> **Incident:** A refactor into modules changed resource addresses and the plan showed a destroy.

```console
$ terraform plan -no-color | grep -E "destroyed|created" | head -3
  # aws_db_instance.main will be destroyed
  # module.data.aws_db_instance.main will be created
Plan: 1 to add, 0 to change, 1 to destroy.
(this is a simulated illustration, not a real incident)
```

The code moved the resource into a module without a moved block. The team added a moved block from the old to the new address, the next plan showed only a move, and prevent_destroy was added to the database as a guard.

## Common mistakes

- Renaming resources without moved blocks
- State in a local file or a repository
- Secrets in tfvars files
- Applying with no lock
- No prevent_destroy on databases

```quiz
Q: What does a moved block do?
+ Maps an old address to a new one so the resource is kept
- Deletes a resource :: No.
- Copies state :: No.
- Locks state :: No.
> It avoids replacement.

Q: Why use a lock?
+ Only one apply may change state at a time
- To speed up :: No.
- To hide state :: No.
- To encrypt :: Separate.
> It prevents corruption.

Q: Are sensitive outputs removed from state?
+ No, they are only hidden in output
- Yes always :: They remain.
- Only in plans :: No.
- Only in logs :: No.
> Protect state access.

Q: How do you guard a database from deletion?
+ prevent_destroy in its lifecycle
- A longer name :: No.
- A tag :: No.
- A comment :: No.
> A plan will fail.
```

```cards
Backend :: Where a tool stores its state
Lock :: A mechanism that allows one change at a time
Import :: Bringing an existing resource under management
Moved block :: Declares that a resource address has changed
```
