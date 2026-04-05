from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    # The JSON string or foreign key mapping to the inference payload
    inference_result_id = Column(String, nullable=True) 
    pdf_url = Column(String, nullable=False) # Represents the storage lookup key
    version = Column(Integer, default=1)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
