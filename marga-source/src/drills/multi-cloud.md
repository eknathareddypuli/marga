## Queue delivered messages twice
level: mid
Moving a worker between clouds caused duplicates.

```text
$ az servicebus queue show --resource-group rg-app --namespace-name sb-app --name jobs --query lockDuration -o tsv
PT1M
```
? What is the likely cause?
+ The handler takes longer than the lock duration; extend the lock and make the handler idempotent
- The queue is encrypted
- Wrong region name
why: Visibility timeouts and locks differ between clouds.

## Private database unreachable
level: mid
A name resolves to a public address after private endpoints were added.

```text
$ nslookup orders-db.postgres.database.azure.com
Address: 20.50.14.9
```
? What do you check?
+ The private DNS zone link to the calling network
- The disk size
- The VM image
why: Private endpoints need private DNS. The matching lesson explains the reasoning in more detail.

## Key in a build log
level: mid
A pipeline printed a long lived cloud key.

```text
$ aws iam list-access-keys --user-name ci-deploy --output text
AKIAEXAMPLEKEY123456 Active
```
? What is the lasting fix?
+ Replace it with OIDC federation to a scoped role
- Hide the log
- Make the key longer
why: Short lived credentials leave nothing to leak.

## Public bucket in a new account
level: mid
A new account missed the baseline.

```text
$ aws s3api get-public-access-block --bucket team-exports
An error occurred (NoSuchPublicAccessBlockConfiguration)
```
? What prevents it?
+ An organisation wide policy and automated account vending
- A longer bucket name
- A new team
why: Guardrails apply to every account. The matching lesson explains the reasoning in more detail.

## Failover took nine hours
level: senior
The cross cloud replica was a day old.

```text
$ psql -h standby-db -c "select now() - pg_last_xact_replay_timestamp() as lag"
 23:41:07
```
? What was missing?
+ Lag alerts, a current runbook and rehearsals
- A bigger VM
- Another dashboard
why: Untested failover is a guess. The matching lesson explains the reasoning in more detail.

## Migration estimate was wrong
level: senior
Moving a service touched hundreds of files.

```text
$ grep -r --include=*.py -l boto3 src | wc -l
212
```
? What would have reduced the cost?
+ A small storage interface and decision records
- More engineers
- A new language
why: Keep provider calls behind a thin layer. The matching lesson explains the reasoning in more detail.
