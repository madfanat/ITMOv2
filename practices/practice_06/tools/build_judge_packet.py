"""Bundle an explicit allowlist of lab artifacts for a judge; no network or execution."""

import difflib
import hashlib
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "review/JUDGE_INPUT.md"


def review_parts():
    """Smaller attachments with actual contents, without the large baseline traceback."""
    def block(title, content):
        fence = "`" * (max((len(run) for run in re.findall(r'`+', content)), default=0) + 4)
        return f"\n## {title}\n\n{fence}\n{content.rstrip()}\n{fence}\n"

    def file(name):
        return block(name, (ROOT / name).read_text())

    before = (ROOT / "evidence/before/security-tests.txt").read_text().splitlines()
    part1 = "# Проверка тестов: сохранённые результаты\n\n"
    part1 += "Полные журналы make и unit-тестов после фикса; для исходных security tests — начало и итог.\n"
    for name in ("evidence/after/make-step6.txt", "evidence/after/make-test.txt", "evidence/after/security-tests.txt"):
        part1 += file(name)
    part1 += block("evidence/before/security-tests.txt: первые 30 и последние 6 строк (выдержка)",
                   "\n".join(before[:30] + ["... [середина журнала опущена] ..."] + before[-6:]))
    part1 += file("evidence/environment.json")
    part2 = "# Реализация и регрессии: полные исходники\n"
    for name in ("lab/service.py", "lab/test_security.py", "lab/test_http_security.py"):
        part2 += file(name)
    part3 = "# HTTP-атаки, ACL инструментов, PR и ограничения\n"
    for name in ("evidence/before/attacks.json", "evidence/after/attacks.json",
                 "evidence/before/planner-forced-decision.json", "evidence/after/planner-forced-decision.json",
                 "evidence/after/http-headers-and-tools.json", "evidence/pull-request-reviewed.json",
                 "evidence/planner-verification.json"):
        part3 += file(name)
    for phase in ("before", "after"):
        for variant in ("clean", "injected"):
            for suffix in ("input.json", "response.txt", "result.json"):
                part3 += file(f"evidence/{phase}/planner-{variant}-{suffix}")
    report = (ROOT / "REPORT_02.md").read_text()
    part3 += "\n" + report[report.index("## Остаточные риски и выводы"):]
    part3 += "\nLLM-planner: четыре ответа получены; 0/2 наблюдаемых успешных инъекций, k=1 на условие.\n"
    for number, text in enumerate((part1, part2, part3), 1):
        output = ROOT / f"review/REVIEW_EVIDENCE_{number:02d}.md"
        output.write_text(text, encoding="utf-8")
        print(f"{output}: {output.stat().st_size} bytes")


def main():
    names = ["README.md", "lab/README.md", "THREAT_MODEL.md", "judge-system-prompt.md",
             "REPORT_01.md", "REPORT_02.md", "SUBMISSION.md", "PR.md", "opencode.json",
             "planner-system.txt", "lab/service.py", "lab/sandbox.py", "lab/test_service.py",
             "lab/test_http.py", "lab/test_security.py", "lab/test_http_security.py",
             "Makefile", "lab/Makefile", "tools/attack_probe.py", "tools/planner_eval.py",
             "evidence/environment.json", "evidence/baseline-sha256.txt",
             "evidence/provider-connectivity.txt", "evidence/pull-request.json",
             "evidence/pull-request-reviewed.json", "tools/capture_http_evidence.py",
             "evidence/planner-verification.json", "evidence/planner-user-output.txt"]
    for phase in ("before", "after"):
        names.extend(str(path.relative_to(ROOT)) for path in sorted((ROOT / "evidence" / phase).iterdir())
                     if path.is_file() and path.suffix in {".json", ".txt"})
    contents = [(name, (ROOT / name).read_bytes()) for name in names]
    parts = ["# Артефакты практики 6\n\n"
             "Самодостаточный пакет: полные тексты файлов, контрольные суммы и diff сервиса.\n"
             "Пакет сформирован локально, без сетевых вызовов и повторного исполнения тестов.\n"
             "В текущей серии получены четыре ответа модели; прежние ошибки TLS архивированы отдельно.\n\n"
             "## Состав\n\n| Файл | Байт | SHA-256 |\n|---|---:|---|\n"]
    for name, data in contents:
        parts.append(f"| {name} | {len(data)} | {hashlib.sha256(data).hexdigest()} |\n")
    for name, data in contents:
        text = data.decode("utf-8")
        # A fence longer than every backtick run in the source keeps nested Markdown literal.
        fence = "`" * (max((len(run) for run in re.findall(r'`+', text)), default=0) + 4)
        parts.append(f"\n## FILE: {name}\n\n{fence}\n{text}")
        if text and not text.endswith("\n"):
            parts.append("\n")
        parts.append(f"{fence}\n")
    before = (ROOT / "evidence/before/service.py.txt").read_text().splitlines(keepends=True)
    after = (ROOT / "lab/service.py").read_text().splitlines(keepends=True)
    diff = "".join(difflib.unified_diff(before, after, fromfile="before/service.py", tofile="after/service.py"))
    parts.append("\n## DIFF: service.py\n\n````diff\n" + diff + "````\n")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("".join(parts), encoding="utf-8")
    print(f"{OUTPUT}: {len(contents)} artifacts, {OUTPUT.stat().st_size} bytes")
    review_parts()


if __name__ == "__main__":
    main()
