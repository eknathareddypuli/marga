---
title: Project structure, packaging and virtual environments
minutes: 12
summary: Lay out an operations tool as a package with pyproject.toml, isolated virtual environments, pinned dependencies and a reproducible install.
---

A script that works only on your laptop is a liability. A small package with an isolated environment and pinned dependencies installs the same way everywhere.

## What you will learn

- A src layout and pyproject.toml
- Virtual environments and why they matter
- Pinning and locking dependencies
- Entry points that become commands
- Reproducible installs in CI and containers

## Layout

Put code in `src/mytool/` with tests in `tests/` and metadata in `pyproject.toml`. The src layout stops tests from importing the working directory by accident, so they test what is installed. Keep a short README that says how to install and run.

## Virtual environments

A virtual environment gives each project its own interpreter and packages, so one tool upgrading a library does not break another. Create it with `python -m venv .venv`, activate it and install into it. Never install project dependencies into the system Python on a server.

## Pinning

A range such as `requests>=2` lets a new release change behaviour overnight. Libraries declare ranges, applications lock exact versions with a tool such as pip-tools, uv or Poetry, and commit the lock file. Update on purpose, run the tests, and read the changelog.

## Entry points

Declare `[project.scripts] mytool = "mytool.cli:main"` and the installer creates a `mytool` command. Operators then run a named command instead of `python path/to/script.py`, and it works from any directory.

## Reproducible installs

In CI and container builds install from the lock file with hashes where possible, use a slim base image, and copy the lock file before the source so the dependency layer is cached. Record the Python version and fail the build if it is different.

```diagram
title: Project structure, packaging and virtual environments
node: src | Source package | 0 | 1 | src/mytool. | Imports from cwd. | process
node: venv | Virtual environment | 1 | 1 | Isolated packages. | System Python. | process
node: lock | Lock file | 2 | 1 | Exact versions. | Unpinned. | store
node: ci | CI and image | 3 | 1 | Installs from lock. | Drift. | service
edge: src | venv
edge: venv | lock
edge: lock | ci
```

## Incident: A tool that broke after a library release

> **Incident:** A scheduled job failed because a dependency released a breaking version overnight.

```console
$ pip list --format=freeze | grep -i requests
requests==3.0.0
$ python -c "print('job failed: unexpected keyword argument')"
(this is a simulated illustration, not a real incident)
```

The requirements file used a loose range, so the next build picked up a new major release. The team locked exact versions, committed the lock file and used a scheduled update job that runs the tests before any bump is merged.

## Common mistakes

- Installing into the system Python
- Loose version ranges in applications
- Not committing the lock file
- Scripts that depend on the current directory
- No pinned Python version

```quiz
Q: Why use a virtual environment?
+ To isolate project dependencies
- To speed up Python :: No.
- To hide code :: No.
- To encrypt packages :: No.
> Separate packages per project.

Q: What does a lock file do?
+ Records exact versions for repeatable installs
- Locks the disk :: No.
- Deletes packages :: No.
- Runs tests :: No.
> Commit it. Review the matching section of this lesson if it is unclear.

Q: What does a console script entry point give?
+ A named command from a function
- A GUI :: No.
- A container :: No.
- A database :: No.
> pyproject scripts.

Q: Why the src layout?
+ Tests import the installed package, not the folder
- Smaller files :: No.
- Faster code :: No.
- Less typing :: No.
> Avoids accidental imports.
```

```cards
venv :: An isolated Python environment
Lock file :: A file of exact dependency versions
pyproject.toml :: Project metadata and build configuration
Entry point :: A function exposed as a command
```
