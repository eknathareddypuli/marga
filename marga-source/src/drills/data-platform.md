## Dashboard shows doubled numbers
level: mid
Revenue is twice the source system value.

```text
$ psql -h warehouse -c "select count(*), count(distinct order_id) from fact_orders where dt = current_date - 1"
 4816 | 2408
```
? What is the likely cause and fix?
+ A retried load appended twice; make the load idempotent and deduplicate
- The dashboard colour
- A slow network
why: Retries must not add rows twice. The matching lesson explains the reasoning in more detail.

## Consumer lag keeps growing
level: mid
Billing events are processed hours late.

```text
$ kafka-consumer-groups.sh --bootstrap-server b1:9092 --describe --group billing
LAG 4800000
```
? What do you check first?
+ Consumer throughput, rebalances and partition count versus consumers
- Delete the topic
- Lower retention only
why: Find why consumers are slower than producers.

## Airflow tasks stuck in queued
level: mid
Hundreds of tasks wait and nothing runs.

```text
$ airflow tasks states-for-dag-run daily_load 2026-11-20 | grep -c queued
312
```
? Where do you look?
+ Worker slots, pools and the scheduler heartbeat
- The dashboard theme
- The table schema
why: Capacity or scheduler problems leave tasks queued.

## Spark stage with one slow task
level: senior
A join stage takes three hours.

```text
$ echo "max task 3h, median task 2s"
max task 3h, median task 2s
```
? What does it indicate?
+ Data skew on the join key
- A network cable fault
- Too little disk
why: Spread the hot key or use adaptive skew handling.

## Schema change broke reports
level: junior
A column was renamed upstream.

```text
$ python -c "print('null share: 100 percent')"
null share: 100 percent
```
? What would have caught it?
+ A contract and a schema or null share check on the producer pipeline
- Nothing
- More dashboards
why: Checks at the boundary stop bad data early.

## Query scanned a petabyte
level: senior
An analyst query cost a month of budget.

```text
$ bq query --dry_run --use_legacy_sql=false "select count(*) from raw.events"
will process 1048576000000000 bytes
```
? What guardrails help?
+ Partitioning, required filters and per user scan limits
- Bigger clusters
- More analysts
why: Make expensive mistakes impossible. The matching lesson explains the reasoning in more detail.
