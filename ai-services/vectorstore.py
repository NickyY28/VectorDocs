import chromadb

# PersistentClient saves data to disk so vectors survive restarts.
# Without this, ChromaDB runs in-memory and you lose everything on shutdown.
client = chromadb.PersistentClient(path="./chroma_db")


def get_or_create_collection(collection_id: str):
    """
    Get existing or create new ChromaDB collection for a PDF.

    WHY cosine similarity?
    - Text embeddings are high-dimensional vectors (768 dims for nomic-embed-text)
    - Cosine measures the ANGLE between vectors, not their length
    - Two sentences meaning the same thing will point in the same direction
      even if one is long and one is short
    - This makes cosine better than euclidean distance for semantic text search
    """
    return client.get_or_create_collection(
        name=collection_id,
        metadata={"hnsw:space": "cosine"},
    )


def add_chunks(collection_id: str, chunks: list[dict]):
    """
    Store embedded chunks in ChromaDB.

    ChromaDB stores 3 things per chunk:
    - documents: the raw text (so we can return it to the user)
    - embeddings: the vector (so we can do similarity search)
    - metadatas: extra info like page number (so we can cite sources)
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
    At scale this is the difference between milliseconds and minutes.

    Returns: documents, distances, metadatas
    distances: 0.0 = identical, 2.0 = completely opposite (cosine space)
    We convert: similarity_score = 1 - distance  (so 1.0 = perfect match)
    """
    collection = get_or_create_collection(collection_id)
    count = collection.count()
    if count == 0:
        raise ValueError(f"Collection '{collection_id}' is empty")

    # Can't retrieve more results than chunks exist
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