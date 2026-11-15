---
title: Why Rust: ownership, borrowing and the mental model
minutes: 13
summary: Understand why infrastructure teams choose Rust, and learn ownership, borrowing and lifetimes well enough to read the compiler errors instead of fighting them.
---

Rust gives the speed of C with memory safety checked at compile time. The price is a stricter way of thinking about who owns each value. Once that model clicks, the compiler becomes a reviewer.

## What you will learn

- Where Rust fits in infrastructure work
- Ownership: one owner, moved on assignment
- Borrowing: shared and mutable references
- Lifetimes in plain terms
- Reading compiler errors

## Where Rust fits

Rust suits tools that must be fast, small and safe: command line utilities, agents that run on every host, proxies, parsers and controllers. A single static binary with no runtime is easy to ship. Go or Python is often simpler for glue scripts, so choose Rust where its guarantees pay off.

## Ownership

Every value has one owner, and the value is dropped when the owner goes out of scope. Assigning a String to another variable moves it, and the first variable can no longer be used. Simple types such as integers are copied instead. This rule removes use after free and double free bugs without a garbage collector.

## Borrowing

You can lend a value with a reference. Any number of shared references `&T` may exist, or exactly one mutable reference `&mut T`, never both at once. This prevents data races and surprising changes while someone else reads the value.

## Lifetimes

A reference must not outlive the value it points to. Usually the compiler infers this. When a function returns a reference, you may need a lifetime annotation such as `&'a str` to say which input it borrows from. If lifetimes feel hard, clone a value or return an owned String first and optimise later.

## Compiler errors

Rust errors are detailed and often suggest the fix. Read the first error fully, since later errors are often caused by it. The common ones are use of a moved value, a borrow that lives too long and a mutable borrow while a shared one exists. Restructure to shorten borrows.

```diagram
title: Why Rust: ownership, borrowing and the mental model
node: own | Owner | 0 | 1 | Holds the value. | Moved away. | service
node: ref | Borrow | 1 | 1 | Shared or mutable. | Conflicting borrows. | process
node: comp | Compiler checks | 2 | 1 | Ownership rules. | Error to read. | security
node: bin | Static binary | 3 | 1 | Safe and fast. | Large debug build. | store
edge: own | ref
edge: ref | comp
edge: comp | bin
```

## Incident: The value used after it moved

> **Incident:** A first Rust tool failed to compile after a variable was passed to a function and used again.

```console
$ cargo build 2>&1 | head -6
error[E0382]: borrow of moved value: `config`
  --> src/main.rs:9:20
   |
 6 |     let config = load();
 8 |     run(config);
(this is a simulated illustration, not a real incident)
```

The function took ownership of config, so it could not be used afterwards. Passing a reference instead, `run(&config)`, kept the owner in main. The engineer learned to ask whether a function needs to own, borrow or mutate a value.

## Common mistakes

- Cloning everything to silence the compiler
- Fighting the borrow checker instead of changing the design
- Ignoring the first error message
- Using unsafe to avoid a design problem
- Choosing Rust for a ten line script

```quiz
Q: How many owners does a Rust value have?
+ One
- Two :: Ownership is single.
- Any number :: Not so.
- None :: Always one.
> Moved on assignment.

Q: What may exist at the same time?
+ Many shared references or one mutable reference
- Many mutable references :: Not allowed.
- One of each :: Not allowed.
- Neither :: Allowed.
> Prevents data races.

Q: What does moving a String do?
+ Transfers ownership so the old variable cannot be used
- Copies it :: Not for String.
- Deletes the file :: No.
- Locks it :: No.
> The compiler enforces it.

Q: What is a simple fix for lifetime trouble?
+ Return an owned value
- Use unsafe :: Not simple.
- Remove the function :: No.
- Ignore it :: Will not compile.
> Optimise later.
```

```cards
Ownership :: The rule that each value has one owner
Borrow :: A temporary reference to a value
Lifetime :: How long a reference is valid
Move :: Transferring ownership of a value
```
