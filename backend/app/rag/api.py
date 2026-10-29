from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.rag.retriever import FundRetriever

router = APIRouter(prefix="/research", tags=["Fund Research"])

# Shared retriever instance
fund_retriever = FundRetriever()


class ResearchRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Question about indexed mutual fund documents"
    )
    top_k: int = Field(default=3, ge=1, le=10)


@router.get("/status")
def research_status():
    """Check whether fund documents have been indexed."""

    indexed = fund_retriever.embeddings is not None

    return {
        "indexed": indexed,
        "chunks": len(fund_retriever.chunks),
        "message": (
            "Fund documents are ready."
            if indexed
            else "No fund documents have been indexed."
        )
    }


@router.post("/search")
def search_fund_documents(request: ResearchRequest):
    """Retrieve relevant passages with source and page citations."""

    if fund_retriever.embeddings is None:
        raise HTTPException(
            status_code=503,
            detail="Fund documents are not indexed yet."
        )

    results = fund_retriever.search(
        query=request.question,
        top_k=request.top_k
    )

    if not results:
        return {
            "question": request.question,
            "results": [],
            "insufficient_evidence": True,
            "message": (
                "No relevant passages were found in the indexed "
                "documents. Missing financial facts must not be inferred."
            )
        }

    return {
        "question": request.question,
        "results": [
            {
                "source": item["source"],
                "page": item["page"],
                "text": item["text"],
                "similarity": item["similarity"]
            }
            for item in results
        ],
        "insufficient_evidence": False,
        "message": (
            "Retrieved passages require verification before "
            "being relied upon for financial decisions."
        )
    }