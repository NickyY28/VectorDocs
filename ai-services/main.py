from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import httpx

from rag import ingest_pdf, query_rag
from vectorstore import delete_collection


def check_ollama():
    """Verify Ollama is running and required models are available on startup."""
    try:
        response = httpx.get("http://localhost:11434/api/tags", timeout=5)
        models = [m["name"] for m in response.json().get("models", [])]
        print("\n🦙 Ollama is running")
        required = ["llama3.2", "nomic-embed-text"]
        for model in required:
            loaded = any(m.startswith(model) for m in models)
            status = "✅" if loaded else "❌ NOT FOUND — run: ollama pull " + model
            print(f"   {status} {model}")
    except Exception:
        print("⚠️  WARNING: Cannot connect to Ollama at localhost:11434")
        print("   Make sure Ollama is installed and running: https://ollama.com")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs on startup — check Ollama before accepting requests."""
    check_ollama()
    print("\n🚀 AI Service ready!\n")
    yield
    print("👋 AI Service shutting down")


app = FastAPI(
    title="DocMind AI Service",
    description="RAG pipeline: ingest PDFs, query with local LLM",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────
# REQUEST / RESPONSE MODELS
# ─────────────────────────────────────────

class IngestRequest(BaseModel):
    file_path: str       # absolute path to uploaded PDF on disk
    collection_id: str   # unique ChromaDB collection name for this PDF

class IngestResponse(BaseModel):
    status: str
    page_count: int
    message: str

class QueryRequest(BaseModel):
    question: str
    collection_id: str

class ChunkResult(BaseModel):
    text: str
    score: float
    page: int

class QueryResponse(BaseModel):
    answer: str
    chunks: list[ChunkResult]


# ─────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "DocMind AI"}


@app.post("/ingest", response_model=IngestResponse)
def ingest(req: IngestRequest):
    """
    Parse -> chunk -> embed -> store in ChromaDB.
    Called by Node server right after a PDF is uploaded.
    Can take 30 seconds to a few minutes depending on PDF size.
    """
    try:
        page_count = ingest_pdf(req.file_path, req.collection_id)
        return IngestResponse(
            status="ok",
            page_count=page_count,
            message=f"PDF processed: {page_count} pages ingested",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@app.post("/query", response_model=QueryResponse)
def query(req: QueryRequest):
    """
    Embed question -> retrieve top 3 chunks -> LLM answer.
    Returns: answer + chunks [{text, score, page}]
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    try:
        result = query_rag(req.question, req.collection_id)
        return QueryResponse(
            answer=result["answer"],
            chunks=[ChunkResult(**c) for c in result["chunks"]],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@app.delete("/collection/{collection_id}")
def delete(collection_id: str):
    """Delete ChromaDB collection when user deletes a PDF."""
    delete_collection(collection_id)
    return {"status": "deleted", "collection_id": collection_id}