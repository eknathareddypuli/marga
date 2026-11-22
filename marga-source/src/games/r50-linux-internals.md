## Slow with idle CPUs
module: linux-internals
level: Advanced
minutes: 7
lesson: linux-internals/cgroup-v2-controllers-cpu-throttling-and-memory-limits
summary: A service is slow while the node is idle. Find the kernel limit behind it.
intro: Latency for one service doubled, yet the node shows forty percent idle CPU. The service runs with a CPU limit of one core and sixteen threads.

### s1
text: Where do you look first? Choose the best next step.
- The cgroup cpu.stat for the container and its throttling counters => s2 | 2 | Throttling is per cgroup and invisible on the node. Example: nr_throttled is high.
- Only the node CPU graph => s2 | 1 | It hides the cgroup quota. Example: The graph looks fine and the search stalls.
- Reboot the node => end-fail | 0 | Changes nothing and loses evidence. Example: The problem returns.

### s2
text: What does the data tell you? Choose the best next step.
- The threads use the quota early in each period and are paused => s3 | 2 | Many threads burn the budget in a few milliseconds. Example: More than seventy percent of periods are throttled.
- The disk is slow => s3 | 1 | The data shows CPU quota use. Example: The wrong fix is tried.
- DNS is slow => end-fail | 0 | Unrelated to throttling counters. Example: Time is wasted.

### s3
text: What do you change? Choose the best next step.
- Raise or remove the limit and match worker threads to the CPU request => s4 | 2 | Removes the pauses and the cause. Example: Latency returns to normal.
- Add more nodes => s4 | 1 | The same limit applies per pod. Example: Cost rises and nothing improves.
- Add RAM => end-fail | 0 | Memory is not the issue. Example: No effect.

### s4
text: How do you catch this earlier? Choose the best next step.
- Alert on the throttled ratio and review limits for multi threaded services => end-win | 2 | Throttling becomes visible. Example: The alert fires before users complain.
- Watch node CPU only => end-ok | 1 | Misses the cause. Example: Next time is the same.
- Ignore it => end-fail | 0 | Latency stays high. Example: Customers notice first.

### end-win
end: win
text: The throttling was found, fixed and now alerts, and the latency is back to normal.
takeaway: Read cpu.stat, match threads to quota and alert on throttling.

### end-ok
end: ok
text: The latency improved but throttling is still not monitored.
takeaway: Add the alert. Review the lesson and try again.

### end-fail
end: fail
text: The wrong cause was chased or the evidence was lost.
takeaway: Read the cgroup counters first. Review the lesson and try again.
