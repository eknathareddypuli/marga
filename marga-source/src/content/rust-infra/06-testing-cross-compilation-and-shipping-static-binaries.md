---
title: Testing, cross compilation and shipping static binaries
minutes: 12
summary: Test Rust code, run clippy and fmt in CI, cross compile to static musl binaries, keep images small and sign and publish releases.
---

A big advantage of Rust is the artifact: one small binary with no runtime. Testing and release engineering make sure that artifact is trustworthy and easy to deploy everywhere.

## What you will learn

- Unit, integration and doc tests
- Clippy, fmt and cargo audit in CI
- Cross compiling and static linking with musl
- Release profiles and binary size
- Containers, signing and provenance

## Tests

Unit tests live next to the code in a `#[cfg(test)]` module and integration tests in the `tests` directory. Doc tests run the examples in comments. `cargo test` runs all of them, and property testing with `proptest` finds edge cases you did not think of.

## CI checks

Run `cargo fmt --check`, `cargo clippy -- -D warnings` and `cargo test` on every change. `cargo audit` checks dependencies against the advisory database, and `cargo deny` can enforce licence and source rules. Cache the build directory to keep CI fast.

## Cross compiling

Add a target with `rustup target add x86_64-unknown-linux-musl` and build with `--target`. The musl target links statically, so the binary runs on any Linux without a matching libc. Tools such as `cross` or `cargo zigbuild` handle linkers and C dependencies for other platforms.

## Release profile

Set `opt-level`, `lto = true`, `codegen-units = 1` and `strip = true` in the release profile to shrink and speed up the binary at the cost of build time. Measure the size, since a few megabytes is normal and tens of megabytes means unneeded dependencies.

## Containers and signing

Copy the static binary into a scratch or distroless image for a very small container with little to attack. Generate an SBOM, sign the artifacts and publish checksums. Pin the Rust toolchain version in `rust-toolchain.toml` so builds are repeatable.

```diagram
title: Testing, cross compilation and shipping static binaries
node: test | cargo test and clippy | 0 | 1 | Quality gate. | Skipped. | process
node: build | Release build | 1 | 1 | LTO, strip. | Slow build. | process
node: musl | Static musl target | 2 | 1 | No libc needed. | C dependencies. | service
node: img | Scratch image and signature | 3 | 1 | Small and verifiable. | Unsigned. | security
edge: test | build
edge: build | musl
edge: musl | img
```

## Incident: A binary that would not start on the server

> **Incident:** A tool built on a developer laptop failed on an older server with a missing library version.

```console
$ ./agent --version
./agent: /lib64/libc.so.6: version `GLIBC_2.34' not found (required by ./agent)
$ ldd ./agent | head -3
	linux-vdso.so.1
	libc.so.6 => /lib64/libc.so.6
(this is a simulated illustration, not a real incident)
```

The binary was linked dynamically against a newer libc than the server had. Building for the musl target in CI produced a static binary that ran everywhere, and the pipeline now tests the artifact in a container with an old distribution.

## Common mistakes

- Building releases on laptops
- Dynamic linking to a newer libc
- No dependency audit
- Unpinned toolchain
- Huge binaries from unused features

```quiz
Q: What does the musl target give?
+ A statically linked binary
- A faster compiler :: No.
- A GUI :: No.
- A debugger :: No.
> Runs on any Linux.

Q: What does cargo audit check?
+ Dependencies against known advisories
- Code style :: That is fmt.
- Speed :: No.
- Binary size :: No.
> Run it in CI. Review the matching section of this lesson if it is unclear.

Q: Which flag treats clippy warnings as errors?
+ -D warnings
- --quiet :: No.
- --release :: No.
- --offline :: No.
> Keeps quality up.

Q: Why pin the toolchain?
+ Repeatable builds
- Smaller code :: No.
- Faster tests :: No.
- Free hosting :: No.
> rust-toolchain.toml.
```

```cards
musl :: A small C library that allows static linking
LTO :: Link time optimisation across crates
clippy :: A linter for Rust code
cargo audit :: A tool that checks dependencies for known vulnerabilities
```
