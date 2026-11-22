## How do you start designing an infrastructure service?
level: mid
I list the users and their numbers, set goals and non goals, size with simple arithmetic and stated assumptions, then plan failure modes, upgrades, backups and ownership before drawing boxes.

## How do you design a CI platform?
level: senior
A queue, a scheduler and ephemeral runners with a warm pool and scaling on queue wait, caches keyed by content, isolation and short lived credentials for untrusted code, limits per job and quotas per team.

## How do you design a registry?
level: senior
Stateless servers in front of durable object storage with metadata in a database, regional replicas and pull through caches, immutable tags with deploy by digest, safe retention and an offline plan for upgrades.

## How do you patch a large fleet?
level: senior
Build tested images, roll out in rings with health gates and an automatic stop, track the version of every host, chase stragglers with deadlines and give exceptions an owner and end date.

## How do you design the front door?
level: mid
A layer 4 tier ahead of layer 7 proxies, TLS termination with automated certificates, useful health checks, draining, limits, spare capacity for a lost zone and staged configuration rollout with route checks.

## How do you know backups work?
level: senior
Agree recovery objectives per tier, keep immutable copies in a separate account, alert on missing and tiny backups and run automated restore tests with data checks and timing.
