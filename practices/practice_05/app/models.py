from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")


class ReviewRequest(StrictModel):
    diff: str

    @field_validator("diff")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("diff must not be blank")
        return value


class Risk(StrictModel):
    file: Annotated[str, Field(min_length=1)]
    line: Annotated[int, Field(gt=0)]
    evidence: Annotated[str, Field(min_length=1)]
    risk: Annotated[str, Field(min_length=1)]


class Review(StrictModel):
    summary: Annotated[str, Field(min_length=1)]
    risks: Annotated[list[Risk], Field(max_length=3)]
    checks: list[str]
