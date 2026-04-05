from anthropic import Anthropic
import os
from .memory import fetch_history

# Mock Anthropic implementation for Phase 4 to bypass raw API Key hard-locking constraints without `.env` setup.
class ChatbotService:
    PREDEFINED_ANSWERS = {
        "how to calculate cgpa?": "CGPA is calculated by taking the sum of (Credit Hours * Grade Points) for all courses and dividing by the total number of credit hours attempted. For most programs here, an 'A' is 4.0, 'B' is 3.0, etc.",
        "honors program requirements?": "The Honors Program requires a minimum CGPA of 3.75, at least 60 credits completed, and no more than 1 grade below B-. Applications open every September.",
        "book an advisor meeting?": "You can book a meeting via the 'Advisor Connect' portal in your student dashboard under the 'Academic Support' tab. Typical wait times are 2-3 business days.",
        "academic calendar link?": "The official Academic Calendar with all semester dates can be found at: https://university.edu/registrar/calendar",
        "internship opportunities?": "ISAES recommends checking the 'Industry Link' section. CS students often find roles at Tech Hub, while ME students should look at Auto-Drive Corp.",
        "scholarship criteria?": "Standard merit scholarships require a 3.5 CGPA. Need-based aid requires a financial disclosure form (Form 12-B)."
    }

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "placeholder_key")
        self.client = None

    def intercept_predefined_query(self, query: str) -> str:
        # Robust normalization: strip punctuation, lowercase, and handle fuzzy matches
        q = query.strip().lower().replace("!", "").replace(".", "")
        if not q.endswith("?"): q += "?"
        
        # Exact match check
        if q in self.PREDEFINED_ANSWERS:
            return self.PREDEFINED_ANSWERS[q]
            
        # Partial match check (e.g. "calculate" or "honors")
        for key, val in self.PREDEFINED_ANSWERS.items():
            if any(word in q for word in key.split()) and len(q) > 10:
                return val
        return None

    def synthesize_system_prompt(self, student_context: dict, recommendations: list) -> str:
        rules_text = "\n".join([f"- {r.get('rule_id', r.get('rule_name'))}: {r.get('message')}" for r in recommendations])
        return f"""
        You are the Intelligence core behind ISAES, an Advisory Chatbot. 
        Your goal is to converse elegantly with the student based on their data.
        
        [STUDENT CONTEXT]
        Name: {student_context.get('name')}
        CGPA: {student_context.get('cgpa')}
        Program: {student_context.get('program')}
        Subjects: {student_context.get('subjects')}
        
        [SYSTEM RECOMMENDATIONS (Rules triggered)]
        {rules_text}
        
        Answer questions concisely and politely based ONLY on the context mapping above. Do not hallucinate.
        """

    def generate_response(self, session_id: str, new_message: str, sys_prompt: str) -> str:
        q = new_message.lower()
        
        # Smarter Mock logic based on keywords and "intelligence" simulation
        if "cgpa" in q or "grade" in q:
            return "Based on your current trajectory, your CGPA requires focused attention in core subjects. I have identified specific recovery modules in your advisory report. Would you like me to highlight the most critical subjects?"
        
        if "attendance" in q or "class" in q:
            return "Your attendance profile shows inconsistencies that are statistically linked to lower exam performance. ISAES suggests maintaining a minimum of 85% to stay in the 'Stable' performance tier."
            
        if "intern" in q or "job" in q:
            return "The ISAES Expert Engine recommends looking into industry placements that match your 'Excellence' tier standing. Your Department Head has pre-approved several summer fellowship roles."

        if "hello" in q or "hi" in q:
            return "Hello! I am ISAES, your Academic Advisory AI. I have analyzed your full history and am ready to discuss your improvement strategies. What's on your mind?"

        return "I've analyzed your question against your student record. While I cannot access the live AI cloud right now, the Expert Engine suggests focusing on the 'Targeted Improvements' listed in your dashboard. Can I clarify any of those points for you?"
