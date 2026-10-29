import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


class FundRetriever:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2)
        )
        self.chunks = []
        self.embeddings = None

    def index_pages(self, pages: list[dict]) -> int:
        """Split document pages into overlapping chunks and index them."""

        self.chunks = []
        chunk_size = 900
        overlap = 150

        for page in pages:
            text = page["text"]
            start = 0

            while start < len(text):
                end = min(start + chunk_size, len(text))
                chunk_text = text[start:end].strip()

                if chunk_text:
                    self.chunks.append({
                        "source": page["source"],
                        "page": page["page"],
                        "text": chunk_text
                    })

                if end == len(text):
                    break

                start = end - overlap

        if not self.chunks:
            self.embeddings = None
            return 0

        texts = [chunk["text"] for chunk in self.chunks]
        self.embeddings = self.vectorizer.fit_transform(texts)

        return len(self.chunks)

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Retrieve relevant chunks, prioritizing matching scheme names."""

        if self.embeddings is None or not self.chunks:
            return []

        if not query.strip() or top_k <= 0:
            return []

        query_vector = self.vectorizer.transform([query])

        scores = (
            self.embeddings @ query_vector.T
        ).toarray().flatten()

        query_lower = query.lower()

        # Extract potential scheme names from indexed text.
        scheme_names = set()

        for chunk in self.chunks:
            text_lower = chunk["text"].lower()

            for line in text_lower.splitlines():
                candidate = line.strip()

                if (
                    len(candidate) < 100
                    and "hdfc" in candidate
                    and (
                        "fund" in candidate
                        or "plan" in candidate
                    )
                ):
                    scheme_names.add(candidate)

        # Identify scheme names mentioned in the query.
        matching_schemes = [
            name
            for name in scheme_names
            if name in query_lower
        ]

        ranked_results = []

        for index, chunk in enumerate(self.chunks):
            similarity = float(scores[index])

            if similarity <= 0:
                continue

            rank_score = similarity
            text_lower = chunk["text"].lower()

            # Boost passages containing the matched scheme name.
            if matching_schemes and any(
                scheme in text_lower
                for scheme in matching_schemes
            ):
                rank_score += 0.15

            ranked_results.append(
                (rank_score, similarity, index)
            )

        # Sort by ranking score in descending order.
        ranked_results.sort(
            key=lambda item: item[0],
            reverse=True
        )

        results = []

        for rank_score, similarity, index in ranked_results[:top_k]:
            results.append({
                "source": self.chunks[index]["source"],
                "page": self.chunks[index]["page"],
                "text": self.chunks[index]["text"],
                "similarity": round(similarity, 4),
                "rank_score": round(rank_score, 4)
            })

        return results