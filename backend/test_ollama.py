import time
from ollama import Client


def main():
    print("Testing Qwen3:4B for FinPilot AI...")

    client = Client(
        host="http://localhost:11434",
        timeout=180.0
    )

    start = time.time()

    try:
        response = client.chat(
            model="qwen3:4b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a financial-document assistant. "
                        "Return only the requested answer. "
                        "Do not include reasoning, analysis, or commentary. "
                        "Never invent financial facts."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        "Reply with exactly this sentence: "
                        "The fund information must be verified against "
                        "the official factsheet."
                    )
                }
            ],
            think=False,
            options={
                "num_predict": 100,
                "temperature": 0
            },
            keep_alive="10m"
        )

        elapsed = time.time() - start
        answer = response.message.content.strip()

        print("\nResponse:", repr(answer))
        print("Thinking:", repr(
            getattr(response.message, "thinking", None)
        ))
        print("Stop reason:", getattr(response, "done_reason", None))
        print("Generated tokens:", response.eval_count)
        print("Response time:", round(elapsed, 2), "seconds")

    except Exception as error:
        print("Ollama error:", repr(error))


if __name__ == "__main__":
    main()
