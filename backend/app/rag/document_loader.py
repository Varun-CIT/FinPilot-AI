from pathlib import Path
from pypdf import PdfReader


def load_pdf(pdf_path: str) -> list[dict]:
    """
    Extract text from a PDF while preserving page numbers.
    """

    path = Path(pdf_path)

    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {path}")

    reader = PdfReader(str(path))
    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""

        if text.strip():
            pages.append(
                {
                    "source": path.name,
                    "page": page_number,
                    "text": text.strip(),
                }
            )

    return pages