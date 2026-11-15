---
title: CLI tools with clap, serde and files
minutes: 12
summary: Build a command line tool with clap for arguments, serde for configuration and JSON, and good exit codes and output for use in scripts.
---

A command line tool is the classic first Rust project for operations engineers. Clap and serde provide the hard parts, which leaves you free to focus on the task.

## What you will learn

- Project layout and Cargo
- Arguments and subcommands with clap
- Reading JSON and YAML with serde
- Output formats and exit codes
- Testing a CLI

## Layout

`cargo new tool` creates a binary crate. Keep `main.rs` small, put logic in a library module and add dependencies with `cargo add clap serde serde_json anyhow`. A library crate with a thin binary is easy to test.

## Clap

With the derive feature, a struct describes the command line and clap generates parsing, help text and error messages. Subcommands are an enum, such as `check`, `apply` and `list`. Add `--output json` and `--dry-run` flags early, because operators expect them.

## Serde

Define a struct for the configuration and derive Deserialize. Reading a file with `serde_yaml` or `serde_json` either gives a typed value or an error that names the field. Use `#[serde(deny_unknown_fields)]` to catch typos in config files, and defaults for optional fields.

## Output and exit codes

Print results to standard output and diagnostics to standard error, so pipes work. Offer machine readable JSON for scripts. Exit with zero on success and distinct non zero codes for usage errors, partial failure and total failure, and document them.

## Testing

Unit test the library functions with ordinary tests. For the binary use the `assert_cmd` crate, which runs it and checks output and exit code. Test the error paths, such as a missing file and invalid configuration, since that is where operators meet your tool.

```diagram
title: CLI tools with clap, serde and files
node: args | clap arguments | 0 | 1 | Subcommands and flags. | Bad usage. | external
node: cfg | serde config | 1 | 1 | Typed settings. | Typos. | process
node: core | Library logic | 2 | 1 | Testable core. | Logic in main. | service
node: out | Output and exit code | 3 | 1 | JSON and codes. | Always zero. | service
edge: args | cfg
edge: cfg | core
edge: core | out
```

## Incident: A tool that always exited zero

> **Incident:** A CI check built in Rust passed every build because it exited with zero on errors.

```console
$ ./check-config bad.yaml; echo "exit=$?"
error: unknown field `replicas_count`, expected one of `replicas`, `image`
exit=0
(this is a simulated illustration, not a real incident)
```

The main function printed the error and returned normally. Changing it to return a Result from main made the process exit with a non zero code. The team added a CLI test that asserts the exit code for invalid input.

## Common mistakes

- Printing errors but exiting zero
- Mixing logs and results on standard output
- No dry run for changing commands
- Config files with no field validation
- Logic in main that cannot be tested

```quiz
Q: What does clap generate from a struct?
+ Parsing, help text and error messages
- Binaries for all systems :: No.
- Tests :: No.
- Docs sites :: No.
> Use derive. Review the matching section of this lesson if it is unclear.

Q: Why use deny_unknown_fields?
+ To catch typos in configuration
- To speed up parsing :: No.
- To hide fields :: No.
- To allow any field :: Opposite.
> Fail early. Review the matching section of this lesson if it is unclear.

Q: Where should diagnostics go?
+ Standard error
- Standard output :: Breaks pipes.
- A file only :: Not standard.
- Nowhere :: Hard to debug.
> Keep results clean.

Q: Which crate tests the compiled binary?
+ assert_cmd
- serde :: No.
- tokio :: No.
- anyhow :: No.
> Check output and exit code.
```

```cards
Cargo :: Rust build tool and package manager
clap :: A library for command line parsing
Subcommand :: A named action of a command line tool
Exit code :: The number a process returns to its caller
```
