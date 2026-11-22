## How do you map AWS and Azure services?
level: mid
I keep a living mapping with notes on limits, defaults and behaviour differences, and check each service documentation instead of assuming parity. I explain the trade-off, give a concrete example from my own work and say how I would check that the change really worked.

## How do you connect many networks?
level: mid
Plan non overlapping addresses, use a hub with Transit Gateway or Virtual WAN, and treat DNS for private endpoints as part of the design. I explain the trade-off, give a concrete example from my own work and say how I would check that the change really worked.

## How do you manage identity across clouds?
level: mid
One identity provider with single sign on, workload identity federation for pipelines, least privilege and regular access reviews. I explain the trade-off, give a concrete example from my own work and say how I would check that the change really worked.

## What is in a landing zone?
level: mid
An account hierarchy, guardrail policies, baseline logging and security, network connection and automated account vending. I explain the trade-off, give a concrete example from my own work and say how I would check that the change really worked.

## Should we avoid lock in?
level: senior
Not at all costs. I weigh the benefit of managed services against exit cost, keep seams at containers and open protocols, and record exit paths.

## When is multi-cloud worth it?
level: senior
When a specific risk or requirement justifies the complexity, and the failover or exit plan has been rehearsed. I explain the trade-off, give a concrete example from my own work and say how I would check that the change really worked.
