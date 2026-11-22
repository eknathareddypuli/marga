## What is Backstage?
level: mid
A framework for a developer portal with a software catalog, templates and plugins. It needs a team to build and run it, and its value depends on accurate metadata.

## Why Crossplane?
level: mid
It gives developers Kubernetes native APIs such as Database, with the platform team owning the composition, and keeps resources reconciled. I choose it when continuous reconciliation and self service matter.

## How do you scale Argo CD to many clusters?
level: senior
ApplicationSets with generators, rollout rings by cluster label, scoped projects, external secrets and a plan for the availability of the hub. I explain the trade-off, give a concrete example from my own work and say how I would check that the change really worked.

## What is Cluster API for?
level: mid
Declarative lifecycle of many clusters: creation, rolling upgrades, consistent shapes with ClusterClass and automated remediation of machines. I explain the trade-off, give a concrete example from my own work and say how I would check that the change really worked.

## How do preview environments stay cheap?
level: mid
Namespaces or virtual clusters, time to live, quotas, scale to zero when idle and a reaper job that deletes expired environments. I explain the trade-off, give a concrete example from my own work and say how I would check that the change really worked.

## How do you measure a platform?
level: senior
DORA metrics as trends, developer surveys, adoption of golden paths, time to first deploy and toil, used for learning and not for ranking. I explain the trade-off, give a concrete example from my own work and say how I would check that the change really worked.
