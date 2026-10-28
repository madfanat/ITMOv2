import asyncio
from typing import Any, Protocol


class LLM(Protocol):
    """Only non-blocking, cooperatively cancellable providers satisfy this contract."""

    async def generate(self, prompt: str) -> dict[str, Any]: ...


class DemoProvider:
    """Local deterministic fixture, not an actual language model."""

    def __init__(self, scenario: str = "normal") -> None:
        self.scenario = scenario

    async def generate(self, prompt: str) -> dict[str, Any]:
        if self.scenario == "slow":
            # No background thread remains running after cancellation.
            await asyncio.Event().wait()
        if self.scenario == "error":
            raise ConnectionError("demo provider failure")
        if self.scenario == "invalid":
            return {"comment": "legacy unstructured response"}
        await asyncio.sleep(0)
        return {
            "summary": "Демонстрационное ревью завершено. Это локальный стенд, а не ответ реальной LLM.",
            "risks": [],
            "checks": [
                "Запустите тесты изменённого кода.",
                "Проверьте поведение на ошибочном и граничном вводе.",
            ],
        }
