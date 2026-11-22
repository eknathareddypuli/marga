## The query that scanned a petabyte
module: data-platform
level: Advanced
minutes: 7
lesson: data-platform/governance-cost-and-reliability-of-data-platforms
summary: One analyst query cost more than the team monthly budget. Find the gaps and fix them.
intro: A finance alert says the data platform bill jumped ten times overnight. One query scanned the raw events table, which has no partitions.

### s1
text: What do you do first? Choose the best next step.
- Find the query and the user, cancel it if running and check the platform cost report => s2 | 2 | Stop the spend and find the source. Example: The query is cancelled and the owner is contacted.
- Delete the raw table => s2 | 1 | Destroys data. Example: A reporting job fails.
- Wait for the invoice => end-fail | 0 | Cost keeps growing. Example: Another run starts.

### s2
text: How do you prevent a repeat on this table?
- Partition by date and require a partition filter => s3 | 2 | Queries read only needed data. Example: A query without a filter is rejected.
- Ask analysts to be careful => s3 | 1 | No control. Example: The next query is the same.
- Buy a bigger cluster => end-fail | 0 | More spend. Example: The bill grows.

### s3
text: How do you protect users in general? Choose the best next step.
- Show dry run estimates and set per user scan limits => s4 | 2 | Visible cost and a hard cap. Example: A tool warns before a large scan.
- Remove access for everyone => s4 | 1 | Stops legitimate work. Example: Analysts cannot work.
- Share one account => end-fail | 0 | No accountability. Example: Nobody knows who ran it.

### s4
text: How do you keep cost visible? Choose the best next step.
- Report cost per team and set budgets with alerts => end-win | 2 | Owners see their spend. Example: A team gets a weekly report.
- Hide costs => end-ok | 1 | No feedback. Example: Nobody changes behaviour.
- Report yearly => end-fail | 0 | Too late. Example: Overspend repeats.

### end-win
end: win
text: The query was stopped, the table partitioned, scan limits set and each team sees its cost.
takeaway: Partition, require filters, cap scans and show cost to owners.

### end-ok
end: ok
text: The spend stopped but the table or limits are still unprotected.
takeaway: Add partitioning and limits. Review the lesson and try again.

### end-fail
end: fail
text: The data was lost or the cause left in place, so the bill will repeat.
takeaway: Do not delete data or wait. Review the lesson and try again.
