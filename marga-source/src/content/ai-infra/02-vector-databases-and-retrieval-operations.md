---
title: Vector databases and retrieval operations
minutes: 12
summary: Operate a vector database: choose an index type, size memory, plan updates and backups, and measure recall and latency.
---

Retrieval systems find text by meaning using vectors. Operating one is a database problem with new trade-offs between speed, memory and accuracy.

## What you will learn

- Embeddings and similarity search
- Index types: flat, IVF and HNSW
- Sizing memory and disk
- Filtering, updates and consistency
- Measuring recall, latency and cost

## Embeddings

An embedding model turns text into a vector of a few hundred to a few thousand numbers. Texts with similar meaning have vectors that are close under a measure such as cosine similarity. Changing the embedding model changes every vector, so all stored data must be re-embedded.

## Index types

A flat index compares the query to every vector and is exact but slow at scale. Approximate indexes such as HNSW graphs or IVF clusters trade a little accuracy for much lower latency. HNSW is fast and memory heavy, IVF uses less memory and needs training on your data.

## Sizing

A vector of 1536 floats takes about six kilobytes, so ten million vectors need roughly sixty gigabytes before the index overhead. Quantisation reduces size at some accuracy cost. Keep hot indexes in memory and plan for replicas for availability and read load.

## Filters and updates

Most queries filter by metadata, such as tenant or date. Filtering after the search can return too few results, and filtering before can slow the search, so test your engine with realistic filters. Frequent updates and deletes may need background compaction or index rebuilds.

## Measuring

Recall is the share of the true nearest neighbours that the index returns. Measure it against an exact search on a sample, together with latency at the 95th and 99th percentile. Tune index parameters to meet a recall target at the lowest cost, and re-test after growth.

```diagram
title: Vector databases and retrieval operations
node: emb | Embedding model | 0 | 1 | Text to vector. | Model change. | service
node: idx | Vector index | 1 | 1 | Approximate search. | Low recall. | store
node: meta | Metadata filters | 2 | 1 | Tenant and date. | Few results. | process
node: app | Application | 3 | 1 | Uses top results. | Slow queries. | service
edge: emb | idx
edge: idx | meta
edge: meta | app
```

## Incident: Search quality dropped after an embedding upgrade

> **Incident:** Retrieval started returning unrelated documents after a model version change.

```console
$ psql -c "select count(*) from docs where embed_model = 'v2'"
 count
-------
 41000
$ psql -c "select count(*) from docs where embed_model = 'v1'"
 count
-------
 960000
(this is a simulated illustration, not a real incident)
```

New documents were embedded with the new model while old ones kept the old vectors, so queries compared vectors from different spaces. The team re-embedded the whole collection into a new index, switched over at once and stored the model version with every vector to catch this in future.

## Common mistakes

- Mixing vectors from different models in one index
- Indexes sized without overhead
- Ignoring recall and only watching latency
- Filtering that returns too few results
- No backups of the source documents

```quiz
Q: What does an approximate index trade?
+ A little accuracy for speed
- Disk for cost :: Not the trade.
- Names :: No.
- Security :: No.
> Check recall. Review the matching section of this lesson if it is unclear.

Q: What happens when the embedding model changes?
+ All vectors must be recomputed
- Nothing :: Vectors differ.
- Only new ones :: Mixed spaces.
- Only queries :: Documents too.
> Version your vectors.

Q: What is recall?
+ Share of true nearest neighbours returned
- Query speed :: No.
- Memory use :: No.
- Disk size :: No.
> Compare to exact search.

Q: What drives memory need?
+ Vector count, dimensions and index overhead
- Query text length :: Minor.
- User count :: Indirect.
- Dashboard count :: No.
> Plan with margin.
```

```cards
Embedding :: A vector representing the meaning of data
HNSW :: A graph based approximate nearest neighbour index
Recall :: The share of true neighbours found
Quantisation :: Storing numbers with fewer bits to save space
```
