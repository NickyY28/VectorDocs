import httpx

OLLAMA_URL = "http://localhost:11434"
EMBED_MODEL = "nomic-embed-text"

# WHY nomic-embed-text over other models?
# - Completely free, runs locally via Ollama (no API key needed)
# - 768-dimensional embeddings — good balance of quality vs speed
# - 8192 token context window — handles long chunks without truncation
# - Outperforms OpenAI ada-002 on many benchmarks despite being local
# - Alternative: mxbai-embed-large (1024 dims, slower but more accurate)


def get_embedding(text: str) -> list[float]:
    """
    Convert a single text string → vector using nomic-embed-text.

    HOW EMBEDDINGS WORK:
    The model reads the text and outputs a list of 768 floats.
    Semantically similar texts produce vectors that point in similar directions.
    Example:
      "What is machine learning?" → [0.23, -0.11, 0.87, ...]
      "Define machine learning"   → [0.25, -0.09, 0.84, ...]  ← very close!
      "What is pizza?"            → [-0.45, 0.33, -0.12, ...] ← very different

    This is how we do semantic search — not keyword matching.
    """
    try:
        response = httpx.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
            timeout=60.0,
        )
        response.raise_for_status()
        embedding = response.json().get("embedding")
        if not embedding:
            raise ValueError("Ollama returned empty embedding")
        return embedding
    except httpx.ConnectError:
        raise RuntimeError(
            "Cannot connect to Ollama. Make sure Ollama is running: `ollama serve`"
        )
    except httpx.TimeoutException:
        raise RuntimeError("Ollama embedding timed out. The model may still be loading.")


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed multiple texts sequentially.

    NOTE: Ollama doesn't support true batching yet (each call is one text).
    For production at scale, you'd use a dedicated embedding server
    that supports batching (e.g. text-embeddings-inference by HuggingFace).
    For our use case (single PDF ingestion), sequential is fine.
    """
    embeddings = []
    for i, text in enumerate(texts):
        print(f"  Embedding chunk {i + 1}/{len(texts)}...")
        embeddings.append(get_embedding(text))
    return embeddings