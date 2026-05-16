import fitz  # PyMuPDF — imported as 'fitz' (its internal name)
import uuid
import httpx
from embedder import get_embedding, get_embeddings_batch, EMBED_MODEL
from vectorstore import add_chunks, query_collection

OLLAMA_URL = "http://localhost:11434"
LLM_MODEL  = "llama3.2"

# WHY llama3.2?
# - Best local model for instruction-following
# - Fast enough on CPU (no GPU required)
# - 3B params: small but punches above its weight
# Alternatives: mistral (better reasoning), phi3 (faster, smaller)
# With a GPU: llama3.1:8b or qwen2.5:7b for much better quality


# ─────────────────────────────────────────
# INGESTION PIPELINE
# ─────────────────────────────────────────

def parse_pdf(file_path: str) -> tuple[list[dict], int]:
    """
    Step 1: Extract raw text from each PDF page using PyMuPDF.

    WHY PyMuPDF (fitz) over pypdf?
    - Much faster text extraction
    - Better handling of multi-column layouts (research papers, books)
    - Handles more PDF encodings correctly

    Returns: list of {text, page_number} dicts + total page count
    """
    doc = fitz.open(file_path)
    pages = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text").strip()
        if text:  # skip empty/image-only pages
            pages.append({
                "text": text,
                "page_number": page_num + 1,  # 1-indexed for humans
            })

    doc.close()
    print(f"📄 Parsed {len(pages)} pages with text (out of {len(doc)} total)")
    return pages, len(doc)


def chunk_pages(pages: list[dict], chunk_size: int = 800, overlap: int = 150) -> list[dict]:
    """
    Step 2: Split page text into overlapping chunks.

    WHY CHUNKING?
    LLMs have a context window limit. We cannot feed a 200-page PDF into the prompt.
    Instead we break it into small chunks, find the RELEVANT ones, and feed only those.

    WHY OVERLAP?
    Without overlap, a sentence split across chunk boundaries loses context.
    Example (chunk_size=20, overlap=5):
      Text:    "The model uses gradient descent to minimize loss"
      Chunk 1: "The model uses gradient"
      Chunk 2: "gradient descent to minimize"  <- "gradient" repeated = context preserved
      Chunk 3: "minimize loss"

    CHUNK SIZE TRADEOFFS:
    - Smaller chunks (400-600): More precise retrieval, less context per chunk
    - Larger chunks (1000-1500): More context, less precise retrieval
    - 800 chars with 150 overlap is a solid default for general documents
    """
    chunks = []

    for page in pages:
        text        = page["text"]
        page_number = page["page_number"]
        start       = 0

        while start < len(text):
            end        = start + chunk_size
            chunk_text = text[start:end].strip()

            if chunk_text:
                chunks.append({
                    "id":       str(uuid.uuid4()),
                    "text":     chunk_text,
                    "metadata": {
                        "page_number": page_number,
                        "start_char":  start,
                    },
                })

            start += chunk_size - overlap  # slide forward with overlap

    print(f"✂️  Created {len(chunks)} chunks")
    return chunks


def ingest_pdf(file_path: str, collection_id: str) -> int:
    """
    Full ingestion pipeline — called once when user uploads a PDF.
    Flow: PDF -> pages -> chunks -> embeddings -> ChromaDB
    """
    print(f"\n🚀 Starting ingestion for: {file_path}")

    pages, page_count = parse_pdf(file_path)
    if not pages:
        raise ValueError("PDF has no extractable text. Is it a scanned image PDF?")

    chunks = chunk_pages(pages)

    print(f"🧠 Embedding {len(chunks)} chunks with {EMBED_MODEL}...")
    texts      = [c["text"] for c in chunks]
    embeddings = get_embeddings_batch(texts)

    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i]

    add_chunks(collection_id, chunks)

    print(f"✅ Ingestion complete! {page_count} pages, {len(chunks)} chunks stored.\n")
    return page_count


# ─────────────────────────────────────────
# QUERY PIPELINE
# ─────────────────────────────────────────

def build_prompt(question: str, chunks: list[dict]) -> str:
    """
    Build the RAG prompt — this is the most important part of RAG quality.

    WHY "answer ONLY from context"?
    Without this, the LLM uses its training data to fill gaps.
    That means it might answer correctly but from its own knowledge, not your document.
    For RAG you WANT the answer grounded in the document only — no hallucination.
    """
    context_parts = []
    for i, chunk in enumerate(chunks):
        context_parts.append(f"[Chunk {i+1} | Page {chunk['page']}]:\n{chunk['text']}")

    context = "\n\n---\n\n".join(context_parts)

    return f"""You are a helpful assistant that answers questions about a document.
Answer ONLY based on the context provided below. Do not use outside knowledge.
If the answer cannot be found in the context, say exactly:
"I couldn't find relevant information about that in the document."

Context from document:
{context}

Question: {question}

Answer:"""


def query_rag(question: str, collection_id: str) -> dict:
    """
    Full RAG query pipeline — called every time user sends a message.

    Flow:
    1. Embed the question (MUST use same model as ingestion)
    2. Find top 3 most similar chunks from ChromaDB
    3. Check relevance threshold (anti-hallucination guard)
    4. Build prompt with chunks as context
    5. Call Ollama LLM
    6. Return answer + chunks with scores for the UI

    WHY must embedding model match between ingestion and query?
    Vectors from different models live in different "spaces".
    Mixing models makes similarity scores completely meaningless.
    """
    print(f"\n🔍 Query: '{question}'")

    # Step 1: Embed the question
    query_embedding = get_embedding(question)

    # Step 2: Retrieve top 3 similar chunks
    results   = query_collection(collection_id, query_embedding, n_results=3)
    documents = results["documents"][0]
    distances = results["distances"][0]
    metadatas = results["metadatas"][0]

    # Convert distances to similarity scores
    # ChromaDB cosine distance: 0 = identical, 2 = opposite
    # We flip: score = 1 - distance → 1.0 = identical, lower = less similar
    chunks = [
        {
            "text":  documents[i],
            "score": round(1 - distances[i], 4),
            "page":  metadatas[i].get("page_number", 0),
        }
        for i in range(len(documents))
    ]

    for c in chunks:
        print(f"  Chunk score: {c['score']:.3f} | Page {c['page']}")

    # Step 3: Anti-hallucination guard
    # If best score < 0.3 the document likely does not contain the answer
    # Tune this up (stricter) or down (looser) based on your use case
    best_score = max(c["score"] for c in chunks)
    if best_score < 0.3:
        print(f"⚠️  Best score {best_score:.3f} below threshold — returning not-found response")
        return {
            "answer": "I couldn't find relevant information about that in the document.",
            "chunks": chunks,
        }

    # Step 4: Build prompt
    prompt = build_prompt(question, chunks)

    # Step 5: Call Ollama LLM
    print(f"🤖 Calling {LLM_MODEL}...")
    try:
        response = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model":  LLM_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,  # low = more factual, less creative
                    "num_predict": 512,  # max tokens in response
                },
            },
            timeout=120.0,
        )
        response.raise_for_status()
        answer = response.json().get("response", "").strip()
    except httpx.ConnectError:
        raise RuntimeError("Cannot connect to Ollama. Make sure it is running: `ollama serve`")
    except httpx.TimeoutException:
        raise RuntimeError("LLM timed out. Try a smaller/faster model.")

    print(f"✅ Answer generated ({len(answer)} chars)\n")
    return {"answer": answer, "chunks": chunks}