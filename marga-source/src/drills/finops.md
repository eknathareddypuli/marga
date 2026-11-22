## The bill rose thirty percent
level: junior
Finance asks why last month cost much more.

```text
$ aws ce get-cost-and-usage --time-period Start=2026-10-01,End=2026-11-01 --granularity MONTHLY --metrics UnblendedCost
Total 121400 (previous month 93200)
```
? What should you check first?
+ Cost per unit of traffic and the services whose cost changed most
- Delete the largest resource
- Ask finance to wait
why: Comparing cost with a business measure shows whether the rise is growth or waste.

## Untagged spend
level: junior
A report shows a large share of cost with no owner.

```text
$ aws ce get-cost-and-usage --time-period Start=2026-10-01,End=2026-11-01 --granularity MONTHLY --metrics UnblendedCost --group-by Type=TAG,Key=owner
owner$ 52000
```
? What is the lasting fix?
+ Enforce required tags at creation and report untagged spend weekly
- Tag everything once by hand
- Hide the report
why: Controls at creation keep new resources owned.

## Idle load balancers
level: mid
A clean up finds balancers with no traffic.

```text
$ aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:eu-west-1:111122223333:targetgroup/old/abc
TargetHealthDescriptions: []
```
? What do you do before deleting?
+ Tag as a candidate, notify the owner and stop or snapshot first
- Delete at once
- Resize it
why: A staged process keeps an undo path. The matching lesson explains the reasoning in more detail.

## A surprise network line
level: mid
The network cost doubled after a new data job.

```text
$ aws ec2 describe-nat-gateways --query "NatGateways[].NatGatewayId" --output text
nat-0abc123
```
? What likely caused it?
+ Traffic to storage flowing through the NAT gateway
- The CPU model
- A DNS change
why: Gateway endpoints avoid the per gigabyte NAT charge.

## Low commitment utilisation
level: senior
The savings plan report shows weak use.

```text
$ aws ce get-savings-plans-utilization --time-period Start=2026-10-01,End=2026-11-01 --query Total.Utilization.UtilizationPercentage
61.4
```
? What do you change?
+ Buy flexible plans in steps and review utilisation monthly
- Buy more of the same
- Cancel all discounts
why: Utilisation under target means paid but unused commitment.

## The forgotten experiment
level: mid
A test cluster ran for three weeks.

```text
$ aws ce get-anomalies --date-interval StartDate=2026-10-01,EndDate=2026-10-31
No anomaly monitors are configured for this account
```
? What should exist?
+ Anomaly monitors with alerts to the owning team
- A longer monthly report
- A bigger budget
why: Daily detection limits the loss. The matching lesson explains the reasoning in more detail.
