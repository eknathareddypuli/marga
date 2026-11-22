## Green dashboard, angry users
level: mid
Availability shows one hundred percent but checkout is unusable.

```text
$ curl -s -o /dev/null -w "%{http_code} %{time_total}\n" https://shop.example.com/checkout
200 11.482
```
? What is the flaw?
+ The indicator ignores latency and counts a slow success as good
- The server is down
- The DNS is wrong
why: Indicators must reflect what users feel. The matching lesson explains the reasoning in more detail.

## SLO without a policy
level: mid
The team meets its SLO but nothing changes when the budget is low.

```text
$ head -3 slo-policy.md
Status: draft, not yet approved
Owner: unassigned
```
? What is missing?
+ An approved policy with triggers and actions
- More dashboards
- More servers
why: A policy turns the number into decisions.

## Page fatigue
level: junior
Three pages a night for a month.

```text
$ awk -F, 'NR>1 {c[$2]++} END {for (k in c) print c[k], k}' pages.csv | sort -rn | head -2
61 DiskUsageHigh
44 PodRestartedOnce
```
? What do you do?
+ Classify alerts, move non urgent ones to tickets and page on burn rate
- Mute everything
- Add more pages
why: Page only when a human must act now. The matching lesson explains the reasoning in more detail.

## Runbook with a stale host
level: mid
A game day shows the failover step names a deleted host.

```text
$ getent hosts db-old-03.example.internal; echo $?
2
```
? What should follow the exercise?
+ Fix the runbook and add a check that hosts in runbooks resolve
- Blame the responders
- Skip the finding
why: Findings need owners and dates. The matching lesson explains the reasoning in more detail.

## The leak found on day three
level: senior
A service ran out of file descriptors three days after release.

```text
$ ls /proc/$(pgrep -o app)/fd | wc -l
31872
```
? Which test would have found it?
+ A long soak test at steady load
- A ten minute smoke test
- A unit test
why: Slow leaks need long runs. The matching lesson explains the reasoning in more detail.

## Open actions that never close
level: senior
Twenty seven post incident actions are open and four are done.

```text
$ grep -c "status: open" actions.csv
27
```
? What changes the outcome?
+ Owners, reserved roadmap capacity and monthly reporting
- A longer report
- Fewer reviews
why: Unowned actions are never done. The matching lesson explains the reasoning in more detail.
