"""Bundle an explicit allowlist of lab artifacts for a judge; no network or execution."""

import difflib
import hashlib
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "review/JUDGE_INPUT.md"


def main():
    names = ["README.md", "lab/README.md", "THREAT_MODEL.md", "judge-system-prompt.md",
             "REPORT_01.md", "REPORT_02.md", "SUBMISSION.md", "PR.md", "opencode.json",
             "planner-system.txt", "lab/service.py", "lab/sandbox.py", "lab/test_service.py",
             "lab/test_http.py", "lab/test_security.py", "lab/test_http_security.py",
             "Makefile", "lab/Makefile", "tools/attack_probe.py", "tools/planner_eval.py",
             "evidence/environment.json", "evidence/baseline-sha256.txt",
             "evidence/provider-connectivity.txt", "evidence/pull-request.json"]
    for phase in ("before", "after"):
        names.extend(str(path.relative_to(ROOT)) for path in sorted((ROOT / "evidence" / phase).iterdir())
                     if path.is_file() and path.suffix in {".json", ".txt"})
    contents = [(name, (ROOT / name).read_bytes()) for name in names]
    parts = ["# Артефакты практики 6\n\n"
             "Самодостаточный пакет: полные тексты файлов, контрольные суммы и diff сервиса.\n"
             "Пакет сформирован локально, без сетевых вызовов и повторного исполнения тестов.\n"
             "Ошибки TLS и пустые ответы модели сохранены как исходные свидетельства.\n\n"
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


if __name__ == "__main__":
    main()
