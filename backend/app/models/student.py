from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    program = Column(String)
    year = Column(Integer)
    dob = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
