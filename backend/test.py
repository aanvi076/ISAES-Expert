import traceback
from app.api.endpoints.students import get_student_report_pdf

try:
    print(get_student_report_pdf(101))
except Exception as e:
    traceback.print_exc()
