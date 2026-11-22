---
title: Rust for infrastructure
summary: Cargo commands, static builds and error handling choices.
module: rust-infra
---

## Cargo

| Job | Command |
|-----|---------|
| New project | `cargo new tool` |
| Build release | `cargo build --release` |
| Test | `cargo test` |
| Lint | `cargo clippy -- -D warnings` |
| Format | `cargo fmt` |

## Static builds

| Step | Command |
|------|---------|
| Add target | `rustup target add x86_64-unknown-linux-musl` |
| Build | `cargo build --release --target x86_64-unknown-linux-musl` |
| Check | `ldd target/.../tool` should say not a dynamic executable |

## Errors

| Need | Use |
|------|-----|
| Application | `anyhow::Result` and `?` |
| Library | `thiserror` enum |
| Missing value | `Option` and `ok_or` |

## Handy commands

```bash
cargo new tool
```

```bash
cargo build --release
```

```bash
cargo clippy -- -D warnings
```

```bash
cargo test
```

```bash
cargo fmt --check
```

```bash
cargo audit
```

```bash
cargo doc --no-deps
```

## Watch out for

> **Warning:** Do not block inside async code, because one blocked worker delays many tasks.

> **Warning:** unwrap in a service turns a recoverable error into a crash, so return an error instead.

> **Warning:** Holding a lock across an await can deadlock the runtime.

> **Warning:** Release builds differ from debug builds, so test the release binary.
