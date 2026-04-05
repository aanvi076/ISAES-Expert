import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
import logging

try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except (OSError, ImportError):
    WEASYPRINT_AVAILABLE = False
    logging.warning("WeasyPrint GTK3 binaries not found on host. PDF generation will fallback to raw HTML files for local testing.")

def generate_pdf_report(student_data: dict, recommendations: list, highest_risk: str, output_path: str):
    """
    Generate a PDF document server-side using Jinja2 templates and WeasyPrint.
    Falls back to HTML if Windows lacks GTK3 libraries natively.
    """
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    env = Environment(loader=FileSystemLoader(templates_dir))
    template = env.get_template('advisory_report.html')

    # Mapping variables
    html_out = template.render(
        student_name=student_data.get("name", "Student Record"),
        student_id=student_data.get("id"),
        date_generated=datetime.now().strftime("%Y-%m-%d %H:%M"),
        cgpa=student_data.get("cgpa", 0.0),
        program=student_data.get("program", "N/A"),
        year=student_data.get("year", 1),
        attendance=student_data.get("attendance_pct", 100),
        highest_risk=highest_risk,
        recommendations=recommendations,
        version=1
    )

    if WEASYPRINT_AVAILABLE:
        # WeasyPrint rendering
        HTML(string=html_out).write_pdf(output_path)
    else:
        # Write .html file as a fallback to avoid crashing on Windows without Docker GTK3
        fallback_path = output_path.replace(".pdf", ".html")
        with open(fallback_path, "w", encoding="utf-8") as f:
            f.write(html_out)
        return fallback_path
        
    return output_path
