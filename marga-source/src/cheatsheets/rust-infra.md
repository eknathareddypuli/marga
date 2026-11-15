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
