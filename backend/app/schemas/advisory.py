from pydantic import BaseModel
from typing import List

class AdviseRequest(BaseModel):
    cgpa: float
    failed_subjects: int
    attendance_pct: float
    year: int
    credit_completion: float
    income_band: str
    program: str

class RecommendationOutput(BaseModel):
    rule_id: str
    risk_level: str
    category: str
    message: str
    action_tags: List[str]

class AdviseResponse(BaseModel):
    student_id: int
    highest_risk_level: str
    recommendations: List[RecommendationOutput]

class ChatMessageRequest(BaseModel):
    student_id: int
    session_id: str
    message: str

class ChatMessageResponse(BaseModel):
    role: str
    content: str
