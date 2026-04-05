from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from app.schemas.advisory import AdviseRequest, AdviseResponse, RecommendationOutput
from app.services.expert.engine import create_engine_class
from app.services.expert.loader import load_rules_from_yaml
from app.services.expert.facts import StudentData, Recommendation
from app.services.reports.generator import generate_pdf_report
import os
import uuid
import tempfile

router = APIRouter()

# Global Memory Database for UI Testing without Postgres
MOCK_DB = [
    # Computer Science (CS) - 5 Students
    {"id": 101, "name": "Jane Doe", "cgpa": 1.8, "program": "Computer Science", "year": 2, "attendance_pct": 72.0, "failed_subjects": 2, "subjects": [{"name": "Data Structures", "grade": "F"}, {"name": "Discrete Math", "grade": "F"}, {"name": "Physics I", "grade": "D"}]},
    {"id": 105, "name": "Aisha Khan", "cgpa": 3.8, "program": "Computer Science", "year": 3, "attendance_pct": 95.0, "failed_subjects": 0, "subjects": [{"name": "OS Design", "grade": "A"}, {"name": "Network Security", "grade": "A-"}]},
    {"id": 110, "name": "Omar Fayed", "cgpa": 1.9, "program": "Computer Science", "year": 1, "attendance_pct": 65.0, "failed_subjects": 2, "subjects": [{"name": "Intro to Programming", "grade": "F"}, {"name": "Calculus I", "grade": "F"}]},
    {"id": 115, "name": "Mia Thompson", "cgpa": 2.9, "program": "Computer Science", "year": 3, "attendance_pct": 82.0, "failed_subjects": 0, "subjects": [{"name": "Software Eng", "grade": "B"}, {"name": "Database Systems", "grade": "B+"}]},
    {"id": 120, "name": "Hiroshi Tanaka", "cgpa": 3.4, "program": "Computer Science", "year": 2, "attendance_pct": 88.0, "failed_subjects": 0, "subjects": [{"name": "AI Fundamentals", "grade": "A-"}, {"name": "Complex Analysis", "grade": "B"}]},

    # Electrical Engineering (EE) - 5 Students
    {"id": 102, "name": "Aarav Sharma", "cgpa": 3.9, "program": "Electrical Engineering", "year": 4, "attendance_pct": 98.0, "failed_subjects": 0, "subjects": [{"name": "Power Systems", "grade": "A"}, {"name": "Control Theory", "grade": "A"}]},
    {"id": 107, "name": "Sophia Zhang", "cgpa": 3.5, "program": "Electrical Engineering", "year": 1, "attendance_pct": 90.0, "failed_subjects": 0, "subjects": [{"name": "Circuit Theory", "grade": "A-"}, {"name": "Digital Logic", "grade": "B+"}]},
    {"id": 114, "name": "James Wilson", "cgpa": 2.5, "program": "Electrical Engineering", "year": 2, "attendance_pct": 78.0, "failed_subjects": 1, "subjects": [{"name": "Electromagnetics", "grade": "D"}, {"name": "Signals", "grade": "C+"}]},
    {"id": 121, "name": "Elena Kovac", "cgpa": 1.7, "program": "Electrical Engineering", "year": 2, "attendance_pct": 62.0, "failed_subjects": 2, "subjects": [{"name": "Circuit Theory", "grade": "F"}, {"name": "Physics II", "grade": "F"}]},
    {"id": 122, "name": "Samuel Okoro", "cgpa": 3.1, "program": "Electrical Engineering", "year": 3, "attendance_pct": 84.0, "failed_subjects": 0, "subjects": [{"name": "Embedded Systems", "grade": "B"}, {"name": "Microprocessors", "grade": "B+"}]},

    # Mechanical Engineering (ME) - 5 Students
    {"id": 103, "name": "Priya Patel", "cgpa": 2.4, "program": "Mechanical Engineering", "year": 1, "attendance_pct": 82.0, "failed_subjects": 1, "subjects": [{"name": "Thermodynamics", "grade": "F"}, {"name": "Calculus I", "grade": "C"}]},
    {"id": 108, "name": "David Miller", "cgpa": 2.1, "program": "Mechanical Engineering", "year": 4, "attendance_pct": 74.0, "failed_subjects": 1, "subjects": [{"name": "Fluid Mechanics", "grade": "D"}, {"name": "Machine Design", "grade": "C"}]},
    {"id": 112, "name": "Carlos Gomez", "cgpa": 3.4, "program": "Mechanical Engineering", "year": 3, "attendance_pct": 92.0, "failed_subjects": 0, "subjects": [{"name": "Dynamics", "grade": "A-"}, {"name": "Materials Science", "grade": "A"}]},
    {"id": 123, "name": "Fatima Zahra", "cgpa": 1.6, "program": "Mechanical Engineering", "year": 2, "attendance_pct": 48.0, "failed_subjects": 3, "subjects": [{"name": "Statics", "grade": "F"}, {"name": "Solid Mechanics", "grade": "F"}, {"name": "CAD", "grade": "F"}]},
    {"id": 124, "name": "Lucas Petit", "cgpa": 2.8, "program": "Mechanical Engineering", "year": 1, "attendance_pct": 80.0, "failed_subjects": 0, "subjects": [{"name": "Intro to ME", "grade": "B+"}, {"name": "Chemistry", "grade": "B"}]},

    # Business Admin (BA) - 5 Students
    {"id": 104, "name": "Rohan Gupta", "cgpa": 3.2, "program": "Business Admin", "year": 3, "attendance_pct": 60.5, "failed_subjects": 0, "subjects": [{"name": "Microeconomics", "grade": "B"}, {"name": "Marketing 101", "grade": "A"}]},
    {"id": 106, "name": "Liam Smith", "cgpa": 1.4, "program": "Business Admin", "year": 2, "attendance_pct": 53.0, "failed_subjects": 3, "subjects": [{"name": "Accounting", "grade": "F"}, {"name": "Stats", "grade": "F"}, {"name": "Business Law", "grade": "F"}]},
    {"id": 111, "name": "Isabella Rossi", "cgpa": 2.8, "program": "Business Admin", "year": 2, "attendance_pct": 80.0, "failed_subjects": 0, "subjects": [{"name": "Fin Management", "grade": "B-"}, {"name": "Business Ethics", "grade": "A"}]},
    {"id": 125, "name": "Aman Singh", "cgpa": 3.95, "program": "Business Admin", "year": 4, "attendance_pct": 99.0, "failed_subjects": 0, "subjects": [{"name": "Strategic Mgmt", "grade": "A+"}, {"name": "International Business", "grade": "A"}]},
    {"id": 126, "name": "Chloe Dubois", "cgpa": 2.2, "program": "Business Admin", "year": 2, "attendance_pct": 71.0, "failed_subjects": 1, "subjects": [{"name": "Accounting", "grade": "D"}, {"name": "Macroeconomics", "grade": "C"}]},

    # Data Science (DS) - 5 Students
    {"id": 113, "name": "Nisha Verma", "cgpa": 4.0, "program": "Data Science", "year": 4, "attendance_pct": 100.0, "failed_subjects": 0, "subjects": [{"name": "Machine Learning", "grade": "A+"}, {"name": "Big Data Analytics", "grade": "A+"}]},
    {"id": 109, "name": "Zoe Chen", "cgpa": 3.0, "program": "Data Science", "year": 2, "attendance_pct": 88.0, "failed_subjects": 0, "subjects": [{"name": "Data Mining", "grade": "B"}, {"name": "Prob and Stats", "grade": "B+"}]},
    {"id": 127, "name": "Leo Martinez", "cgpa": 1.9, "program": "Data Science", "year": 2, "attendance_pct": 55.0, "failed_subjects": 2, "subjects": [{"name": "Python for DS", "grade": "F"}, {"name": "Linear Algebra", "grade": "F"}]},
    {"id": 128, "name": "Sasha Ivanova", "cgpa": 3.6, "program": "Data Science", "year": 3, "attendance_pct": 94.0, "failed_subjects": 0, "subjects": [{"name": "Deep Learning", "grade": "A-"}, {"name": "NLP", "grade": "B+"}]},
    {"id": 129, "name": "Chen Wei", "cgpa": 2.5, "program": "Data Science", "year": 1, "attendance_pct": 76.0, "failed_subjects": 1, "subjects": [{"name": "Intro to DS", "grade": "D"}, {"name": "Calculus II", "grade": "C"}]}
]

@router.get("")
def list_students():
    return MOCK_DB

@router.get("/{student_id}")
def get_student(student_id: int):
    stud = next((s for s in MOCK_DB if s["id"] == student_id), None)
    if not stud:
        raise HTTPException(status_code=404, detail="Student not found")
    return stud


# Load rules once correctly
RULES_DIR = os.path.join(os.path.dirname(__file__), "../../../rules")
yaml_rules = load_rules_from_yaml(RULES_DIR)
EngineClass = create_engine_class(yaml_rules)

@router.post("/{student_id}/advise", response_model=AdviseResponse)
def run_advisory(student_id: int, payload: AdviseRequest):
    # Instantiate the dynamic engine
    engine = EngineClass()
    engine.reset()
    
    # Declare the student data fact
    engine.declare(StudentData(
        cgpa=payload.cgpa,
        failed_subjects=payload.failed_subjects,
        attendance_pct=payload.attendance_pct,
        year=payload.year,
        credit_completion=payload.credit_completion,
        income_band=payload.income_band,
        program=payload.program
    ))
    
    # Run the inference
    engine.run()
    
    # Extract recommendations
    recommendations = []
    highest_risk = "LOW"
    
    for fact in engine.facts.values():
        if isinstance(fact, Recommendation):
            rec = RecommendationOutput(
                rule_id=fact.get('rule_id'),
                risk_level=fact.get('risk_level'),
                category=fact.get('category'),
                message=fact.get('message'),
                action_tags=fact.get('action_tags', [])
            )
            recommendations.append(rec)
            
            # Simple severity evaluation
            levels = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
            if levels.get(rec.risk_level, 1) > levels.get(highest_risk, 1):
                highest_risk = rec.risk_level
                
    return AdviseResponse(
        student_id=student_id,
        highest_risk_level=highest_risk,
        recommendations=recommendations
    )

@router.get("/{student_id}/report/pdf")
def get_student_report_pdf(student_id: int):
    student_data = next((s for s in MOCK_DB if s["id"] == student_id), None)
    if not student_data:
        raise HTTPException(status_code=404, detail="Student not found in DB")

    # Dynamic experiential evaluation instead of hardcoding
    engine = EngineClass()
    engine.reset()
    engine.declare(StudentData(**student_data))
    engine.run()
    
    recommendations = []
    highest_risk = "LOW"
    for fact in engine.facts.values():
        if isinstance(fact, Recommendation):
            recommendations.append({"rule_name": fact.get('rule_id'), "message": fact.get('message')})
            if highest_risk != "HIGH":
                if fact.get('risk_level') == "HIGH": highest_risk = "HIGH"
                elif fact.get('risk_level') == "MEDIUM": highest_risk = "MEDIUM"
    
    # Make sure we have at least one fallback recommendation if none hit
    if not recommendations:
        recommendations = [{"rule_name": "clean_record", "message": "No immediate academic risks detected."}]

    report_dir = os.path.join(tempfile.gettempdir(), "isaes_reports")
    os.makedirs(report_dir, exist_ok=True)
    out_path = os.path.join(report_dir, f"report_{student_id}_{uuid.uuid4().hex[:6]}.pdf")
    
    generate_pdf_report(student_data, recommendations, highest_risk, out_path)
    
    # Check if we generated PDF or if we fell back to HTML (native Windows execution)
    fallback_path = out_path.replace(".pdf", ".html")
    if os.path.exists(fallback_path):
        return FileResponse(
            path=fallback_path,
            filename=f"ISAES_Report_{student_id}_Fallback.html",
            media_type='text/html'
        )
    
    return FileResponse(
        path=out_path, 
        filename=f"ISAES_Report_{student_id}.pdf",
        media_type='application/pdf'
    )
