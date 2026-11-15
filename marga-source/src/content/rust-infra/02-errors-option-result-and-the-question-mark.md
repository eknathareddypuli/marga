---
title: Errors: Option, Result and the question mark
minutes: 12
summary: Handle missing values and failures with Option and Result, propagate errors with the question mark operator and design error types for tools.
---

Rust has no exceptions and no null. Missing values and failures are ordinary values that the compiler makes you handle, which is why tools written in Rust rarely crash on bad input.

## What you will learn

- Option for values that may be missing
- Result for operations that may fail
- The question mark operator
- Error types with thiserror and anyhow
- Panics versus errors

## Option

`Option<T>` is either `Some(value)` or `None`. A map lookup returns an Option, because the key may be absent. You must say what to do for None, using `match`, `if let`, or helpers such as `unwrap_or` and `map`. There is no null pointer to forget.

## Result

`Result<T, E>` is either `Ok(value)` or `Err(error)`. Reading a file returns a Result, because it may fail. The error type says why, for example the file was missing or permission was denied. Ignoring a Result gives a compiler warning.

## The question mark

Inside a function that returns a Result, `?` after an expression returns early with the error if there was one, and otherwise gives the Ok value. It replaces long chains of match statements and keeps the happy path readable.

## Error types

For libraries, define an error enum with the `thiserror` crate, so callers can match on the cause. For applications and command line tools, `anyhow::Result` carries any error and lets you add context with `.context("reading config")`. Good context turns a message such as No such file into a useful report.

## Panics

A panic stops the thread and is for bugs, such as an impossible state. Do not use `unwrap` on input from users or files. In tools that run unattended, prefer returning errors and a clear exit code.

```diagram
title: Errors: Option, Result and the question mark
node: in | Input or file | 0 | 1 | May be missing. | Bad data. | external
node: res | Result | 1 | 1 | Ok or Err. | Ignored. | process
node: q | Question mark | 2 | 1 | Propagates errors. | No context. | process
node: out | Exit code and message | 3 | 1 | Clear failure. | Panic. | service
edge: in | res
edge: res | q
edge: q | out
```

## Incident: A panic at three in the morning

> **Incident:** A cleanup tool crashed on an unexpected file name and left a job half done.

```console
$ ./cleanup --dir /data/tmp
thread 'main' panicked at src/main.rs:31:46:
called `Result::unwrap()` on an `Err` value: Os { code: 13, kind: PermissionDenied }
$ echo $?
101
(this is a simulated illustration, not a real incident)
```

The code used unwrap on a file operation. It was changed to return a Result with context that names the path, the tool now reports the error and continues with the next file, and the exit code distinguishes partial failure from success.

## Common mistakes

- unwrap on user input and files
- Errors with no context
- Using panic for expected failures
- Returning strings as errors
- Ignoring Results with let underscore

```quiz
Q: What is Option used for?
+ Values that may be missing
- Errors :: That is Result.
- Threads :: No.
- Loops :: No.
> Some or None. Review the matching section of this lesson if it is unclear.

Q: What does the question mark do?
+ Returns early with the error or gives the Ok value
- Panics :: No.
- Ignores errors :: No.
- Logs :: No.
> Cleaner error flow.

Q: Which crate gives easy application errors with context?
+ anyhow
- serde :: Serialisation.
- clap :: Arguments.
- tokio :: Async.
> Use context. Review the matching section of this lesson if it is unclear.

Q: When is a panic appropriate?
+ For a bug or impossible state
- Bad user input :: Return an error.
- Missing file :: Return an error.
- Network timeout :: Return an error.
> Errors are values.
```

```cards
Option :: A value that is either present or absent
Result :: A value that is either success or an error
anyhow :: A crate for flexible application errors
panic :: An unrecoverable failure that stops the thread
```
