from app.rag.document_loader import load_pdf
from app.rag.retriever import FundRetriever


PDF_PATH = "data/fund_documents/HDFC_MF_Factsheet.pdf"


def main():
    pages = load_pdf(PDF_PATH)

    print(f"Extracted text from {len(pages)} pages.")

    retriever = FundRetriever()
    chunk_count = retriever.index_pages(pages)

    print(f"Indexed {chunk_count} chunks.")

    while True:
        query = input("\nAsk about the fund (or type exit): ")

        if query.strip().lower() == "exit":
            break

        results = retriever.search(query)

        if not results:
            print("No indexed content is available.")
            continue

        for result in results:
            print("\n" + "=" * 60)
            print(
                f"Source: {result['source']} | "
                f"Page: {result['page']} | "
                f"Similarity: {result['similarity']}"
            )
            print(result["text"])


if __name__ == "__main__":
    main()