"""Run 5 QUESTIONS with local Ollama model against demo/ repo and save answers.
Standard library only.
"""
import json
import time
import urllib.request
from pathlib import Path


MODEL = "qwen3.5:9b"
TEMPERATURE = 0.2
NUM_CTX = 8192
NUM_PREDICT = 512


def chat(messages):
    payload = {
        "model": MODEL,
        "messages": messages,
        "stream": False,
        "think": False,
        "options": {
            "temperature": TEMPERATURE,
            "num_ctx": NUM_CTX,
            "num_predict": NUM_PREDICT,
        },
    }
    req = urllib.request.Request(
        "http://localhost:11434/api/chat",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        return json.load(resp)


def build_goldens(demo_root: Path):
    # Prepare expected answers derived strictly from code in demo/
    # 1. How to run tests + source file
    a1 = "make test; источник: demo/Makefile и test_service.py"
    # 2. Empty subscriber name behavior
    a2 = "Выбрасывает ValueError('empty name'); подтверждение: service.py, test_empty"
    # 3. Where unsubscribe is implemented? false premise check
    a3 = "В предоставленных материалах нет ответа; в репозитории нет unsubscribe"
    # 4. Which CI runs tests?
    a4 = "В предоставленных материалах нет ответа; конфигурации CI нет"
    # 5. Do subscriptions persist after restart?
    a5 = "Нет; подписки в памяти процесса (set), см. README.md и service.py"
    return [a1, a2, a3, a4, a5]


def main():
    root = Path(__file__).resolve().parent
    demo = root / "demo"
    system_prompt = (root / "system.txt").read_text()
    context = {
        "README.md": (demo / "README.md").read_text(),
        "service.py": (demo / "service.py").read_text(),
        "test_service.py": (demo / "test_service.py").read_text(),
        "Makefile": (demo / "Makefile").read_text(),
    }
    questions = [
        "Как запустить тесты? Укажи файл-источник.",
        "Что будет при пустом имени подписчика? Подтверди кодом.",
        "Где реализован unsubscribe? Проверь предпосылку вопроса.",
        "Какая CI-система запускает тесты? Если сведений нет, скажи об этом.",
        "Сохраняются ли подписки после перезапуска процесса? Подтверди кодом.",
    ]

    gold = build_goldens(demo)
    out_dir = root / "answers"
    out_dir.mkdir(exist_ok=True)

    report = {
        "model": MODEL,
        "temperature": TEMPERATURE,
        "num_ctx": NUM_CTX,
        "started": time.strftime("%Y-%m-%d %H:%M:%S"),
        "answers": [],
    }

    for i, q in enumerate(questions, 1):
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": (
                    "Ниже материалы проекта demo/ (импорт не требуется).\n" +
                    "README.md:\n" + context["README.md"] + "\n" +
                    "service.py:\n" + context["service.py"] + "\n" +
                    "test_service.py:\n" + context["test_service.py"] + "\n" +
                    "Makefile:\n" + context["Makefile"] + "\n\n" +
                    q
                ),
            },
        ]
        try:
            resp = chat(messages)
            content = resp.get("message", {}).get("content", "")
        except Exception as exc:
            content = f"ERROR: {exc}"
        item = {
            "question": q,
            "gold": gold[i - 1],
            "answer": content,
        }
        report["answers"].append(item)
        (out_dir / f"q{i}.txt").write_text(content)

    (root / "answers.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print("Saved:", (root / "answers.json").as_posix())


if __name__ == "__main__":
    main()
