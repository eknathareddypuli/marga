---
title: RAG pipelines in production
minutes: 12
summary: Build a retrieval augmented generation pipeline with ingestion, chunking, retrieval, reranking and prompts, and make it observable and safe to update.
---

Retrieval augmented generation gives a model your documents at question time. Most failures come from the pipeline around the model: stale data, poor chunks and no way to tell what went wrong.

## What you will learn

- The pipeline stages
- Ingestion and chunking choices
- Retrieval, hybrid search and reranking
- Prompt construction and citations
- Freshness, access control and updates

## Stages

Documents are ingested, split into chunks, embedded and indexed. At question time the system retrieves candidate chunks, optionally reranks them, builds a prompt and calls the model, then returns the answer with sources. Each stage can fail separately, so measure each one.

## Chunking

Chunks that are too small lose context and chunks that are too large dilute the match and use prompt space. A few hundred tokens with some overlap and boundaries at headings is a common start. Keep metadata such as the title, section and source link with each chunk.

## Retrieval

Combine vector search with keyword search, since exact names and error codes are matched better by keywords. A reranker model reorders the top candidates by relevance and often improves answer quality more than a larger model. Retrieve more than you send and keep only the best few.

## Prompts and citations

Tell the model to answer only from the supplied text and to say when the answer is not there. Return the sources so users can check. Treat retrieved text as untrusted: a document can contain instructions that try to change the model behaviour.

## Freshness and access

Track document versions and re-index changes on a schedule or by event. Enforce access control at retrieval time with metadata filters, so a user only gets chunks they may read. Test with questions that must be answered from recent or restricted documents.

```diagram
title: RAG pipelines in production
node: ing | Ingestion and chunking | 0 | 1 | Prepares documents. | Poor chunks. | process
node: ret | Retrieval and rerank | 1 | 1 | Finds context. | Wrong passages. | service
node: llm | Model call | 2 | 1 | Generates answer. | Ignores context. | service
node: eval | Evaluation | 3 | 1 | Measures quality. | Not measured. | observe
edge: ing | ret
edge: ret | llm
edge: llm | eval
```

## Incident: A confident answer from a deleted policy

> **Incident:** The assistant quoted a policy that had been withdrawn a month earlier.

```console
$ psql -c "select doc_id, updated_at, deleted from chunks where doc_id = 'policy-17' limit 2"
 doc_id    | updated_at | deleted
 policy-17 | 2026-08-02 | f
 policy-17 | 2026-08-02 | f
(this is a simulated illustration, not a real incident)
```

The source system marked the document deleted, but the index never received the delete event. The ingestion job was changed to process deletes, a nightly reconciliation compares the index with the source and answers now show the document date.

## Common mistakes

- No handling of deleted or updated documents
- Chunks without source metadata
- Skipping evaluation and judging by a few demos
- Ignoring access control at retrieval
- Trusting retrieved text as safe instructions

```quiz
Q: What does retrieval add to a model call?
+ Relevant context from your data
- More GPUs :: No.
- Faster tokens :: No.
- Training :: No.
> Context at question time.

Q: Why combine keyword and vector search?
+ Keywords match exact names and codes better
- To save memory :: No.
- To avoid embeddings :: Still needed.
- To hide data :: No.
> Hybrid search. Review the matching section of this lesson if it is unclear.

Q: How should access control be applied?
+ At retrieval with metadata filters
- In the prompt only :: Unsafe.
- After the answer :: Too late.
- Not at all :: Unsafe.
> Filter before generation.

Q: What keeps answers fresh?
+ Processing updates and deletes from the source
- Longer prompts :: No.
- Bigger models :: No.
- Caching forever :: Makes it stale.
> Reconcile regularly.
```

```cards
RAG :: Retrieval augmented generation
Chunk :: A piece of a document stored and retrieved as a unit
Reranker :: A model that reorders retrieved passages by relevance
Hybrid search :: Combining keyword and vector search
```
