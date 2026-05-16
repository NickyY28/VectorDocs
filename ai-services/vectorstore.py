import chromadb

# PersistentClient saves vectors to disk so they survive restarts
# Without this, ChromaDB runs in-memory and you lose everything on shutdown
client = chromadb.PersistentClient(path="./chroma_db")


def get_or_create_collection(collection_id: str):
    """
    Get existing or create new ChromaDB collection for a PDF.

    WHY cosine similarity?
    Text embeddings are high-dimensional vectors (768 dims for nomic-embed-text).
    Cosine measures the ANGLE between vectors, not their length.
    Two sentences meaning the same thing point in the same direction
    even if one is long and one is short — cosine handles this correctly.
    """
    return client.get_or_create_collection(
        name=collection_id,
        metadata={"hnsw:space": "cosine"},
    )


def add_chunks(collection_id: str, chunks: list[dict]):
    """
    Store embedded chunks in ChromaDB.

    ChromaDB stores 3 things per chunk:
    - documents: the raw text (returned to user as snippet)
    - embeddings: the vector (used for similarity search)
    - metadatas: extra info like page number (used for citations)
    - ids: unique identifier per chunk (required by ChromaDB)
    """
    collection = get_or_create_collection(collection_id)
    collection.add(
        ids=[c["id"] for c in chunks],
        documents=[c["text"] for c in chunks],
        embeddings=[c["embedding"] for c in chunks],
        metadatas=[c["metadata"] for c in chunks],
    )
    print(f"✅ Stored {len(chunks)} chunks in collection '{collection_id}'")


def query_collection(collection_id: str, query_embedding: list[float], n_results: int = 3):
    """
    Find top-N most similar chunks to the query embedding.

    HOW HNSW SEARCH WORKS:
    ChromaDB uses HNSW (Hierarchical Navigable Small World) graph index.
    Instead of comparing query against every chunk (slow O(n)),
    it navigates a graph of nearby vectors (fast O(log n)).

    Returns distances — we convert to similarity scores:
    score = 1 - distance  (so 1.0 = perfect match, 0.0 = no match)
    """
    collection = get_or_create_collection(collection_id)
    count = collection.count()
    if count == 0:
        raise ValueError(f"Collection '{collection_id}' is empty")

    actual_n = min(n_results, count)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=actual_n,
        include=["documents", "distances", "metadatas"],
    )
    return results


def delete_collection(collection_id: str):
    """Delete ChromaDB collection when user deletes a PDF."""
    try:
        client.delete_collection(name=collection_id)
        print(f"🗑️  Deleted collection '{collection_id}'")
    except Exception as e:
        print(f"⚠️  Could not delete collection '{collection_id}': {e}")