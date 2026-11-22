## The cluster that ran for three weeks
module: finops
level: Intermediate
minutes: 7
lesson: finops/budgets-anomalies-forecasts-and-cost-culture
summary: A forgotten test cluster cost more than a month of production. Stop the spend and stop it happening again.
intro: Finance sees a large spike in cloud cost. A training cluster created for an experiment has been running for three weeks and nobody owns it.

### s1
text: What do you do first? Choose the best next step.
- Find the owner and the cluster, snapshot what matters and stop it => s2 | 2 | Stop the spend without losing work. Example: The cluster is stopped after a snapshot.
- Wait for the monthly review => s2 | 1 | The cost continues every day. Example: Another week is added to the bill.
- Delete the whole account => end-fail | 0 | Destroys everything and breaks other work. Example: Production goes down.

### s2
text: How do you find out how it was missed? Choose the best next step.
- Check the tags, the budget alerts and the cost reports for gaps => s3 | 2 | The cause is in the controls. Example: No anomaly alert and no owner tag existed.
- Ask people to be more careful => s3 | 1 | No control changes. Example: It happens again next quarter.
- Blame the engineer => end-fail | 0 | People hide mistakes after blame. Example: Future spend is hidden.

### s3
text: How do you prevent a repeat? Choose the best next step.
- Require owner and expiry tags, add an auto stop for experiments and set anomaly alerts => s4 | 2 | Preventive and detective controls together. Example: An untagged cluster is stopped after a day.
- Add a monthly email => s4 | 1 | Too slow. Example: The next cluster runs for weeks.
- Ban experiments => end-fail | 0 | Stops useful work. Example: Teams find workarounds.

### s4
text: How do you keep teams engaged? Choose the best next step.
- Show each team its cost weekly and celebrate savings without blame => end-win | 2 | Visible data and a fair tone. Example: A team shares how it halved its cost.
- Charge teams a penalty => end-ok | 1 | Creates fear and hidden spend. Example: Teams stop reporting problems.
- Hide the numbers => end-fail | 0 | No feedback. Example: Nobody changes behaviour.

### end-win
end: win
text: The spend was stopped, controls now catch forgotten resources within a day and teams see their own cost.
takeaway: Stop first, then add tags, expiry, anomaly alerts and team reports.

### end-ok
end: ok
text: The cluster was stopped but the controls are still weak.
takeaway: Add expiry, tags and alerts. Review the lesson and try again.

### end-fail
end: fail
text: The spend continued or healthy systems were destroyed.
takeaway: Do not wait or delete everything. Review the lesson and try again.
