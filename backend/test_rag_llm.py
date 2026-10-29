from pathlib import Path

from app.rag.document_loader import load_pdf
from app.rag.retriever import FundRetriever
from app.rag.service import FundRAGService


def main():
    pdf_path = Path("data/fund_documents/HDFC_MF_Factsheet.pdf")

    print("Loading the mutual fund factsheet...")

    # Extract text from the PDF.
    pages = load_pdf(str(pdf_path))

    # Index the extracted pages.
    retriever = FundRetriever()
    chunk_count = retriever.index_pages(pages)

    print(f"Indexed {chunk_count} chunks.")

    # Initialize the RAG service.
    rag_service = FundRAGService(retriever)

    while True:
        question = input(
            "\nAsk a question about the fund (or type exit): "
        ).strip()

        if question.lower() == "exit":
            print("Exiting FinPilot AI.")
            break

        if not question:
            print("Please enter a question.")
            continue

        try:
            result = rag_service.answer(question)

            print("\n" + "=" * 60)
            print("FINPILOT AI - ANSWER")
            print("=" * 60)

            print(result["answer"])

            print("\nSources retrieved:")

            for citation in result["citations"]:
                print(
                    f"- {citation['source']}, "
                    f"Page {citation['page']}"
                )

            if result["insufficient_evidence"]:
                print(
                    "\nWarning: The system could not retrieve "
                    "sufficient relevant evidence."
                )

            print("=" * 60)

        except Exception as error:
            print(f"\nAn error occurred: {error}")


if __name__ == "__main__":
    main()