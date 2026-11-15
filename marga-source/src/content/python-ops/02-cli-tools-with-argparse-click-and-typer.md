---
title: CLI tools with argparse, click and typer
minutes: 12
summary: Build operations tools with clear arguments, exit codes, dry run modes and machine readable output, using argparse from the standard library.
---

Operators run your tool at bad moments. Clear arguments, safe defaults, a dry run and honest exit codes make it trustworthy.

## What you will learn

- Arguments, subcommands and help
- Exit codes and error messages
- Dry run and confirmation for dangerous actions
- Machine readable output
- Choosing argparse, click or typer

## Arguments

A good tool has subcommands such as `mytool backup run` and `mytool backup list`, options with defaults and help text for each. `argparse` in the standard library handles this without dependencies, which suits tools installed on servers.

## Exit codes

Return 0 on success and a non zero code on failure so scripts and schedulers can react. Print errors to standard error, and make messages say what failed and what to do next. Do not print a stack trace for an expected problem such as a missing file.

## Dry run

Destructive tools need a `--dry-run` that prints what would change, and often a required `--yes` or a typed confirmation for production. Default to the safe option, and show the target environment in the output so mistakes are visible.

## Output

Provide `--output json` for scripts alongside readable text for people. Write results to standard output and logs to standard error, so piping into other tools works. Keep field names stable, because other tools will depend on them.

## Libraries

`argparse` is enough for most tools. `click` and `typer` give less boilerplate, nicer help and testing helpers, at the cost of a dependency. Pick one per team and wrap your logic in plain functions so the CLI layer stays thin and easy to test.

```diagram
title: CLI tools with argparse, click and typer
node: args | Parse arguments | 0 | 1 | Validate input. | Unclear help. | process
node: plan | Plan and dry run | 1 | 1 | Show changes. | Skipped. | process
node: act | Apply | 2 | 1 | Do the work. | Wrong target. | service
node: out | Exit code and output | 3 | 1 | Report result. | Always zero. | observe
edge: args | plan
edge: plan | act
edge: act | out
```

## Incident: A cleanup tool that ran against production

> **Incident:** An engineer meant to test a cleanup in staging, but the default target was production.

```console
$ mytool cleanup --older-than 30d
target: production
deleted 1,204 objects
$ echo $?
0
(this is a simulated illustration, not a real incident)
```

The tool defaulted to production and had no dry run, so the first run was real. The team made the environment a required argument, added --dry-run as the default behaviour for destructive commands and printed the target in the first line of output.

## Common mistakes

- Defaulting to production
- Always returning exit code zero
- Mixing logs and results on standard output
- Giant functions inside the CLI layer
- No help text

```quiz
Q: What should a failing tool return?
+ A non zero exit code
- Zero :: Wrong.
- Nothing :: Wrong.
- A blank line :: Wrong.
> Callers rely on it.

Q: What does a dry run do?
+ Shows what would change without changing it
- Deletes faster :: No.
- Skips logging :: No.
- Encrypts :: No.
> Safe preview. Review the matching section of this lesson if it is unclear.

Q: Where should results and logs go?
+ Results to stdout, logs to stderr
- Both to stdout :: Breaks pipes.
- Both to a file :: Not standard.
- Nowhere :: No.
> Keeps pipes clean.

Q: Why keep logic outside the CLI layer?
+ It is easier to test
- It is shorter :: Not the point.
- It is hidden :: No.
- It is faster :: No.
> Thin wrapper. Review the matching section of this lesson if it is unclear.
```

```cards
argparse :: Standard library argument parser
Exit code :: Number returned to signal success or failure
Dry run :: Preview mode that makes no changes
stdout :: Standard output stream
```
