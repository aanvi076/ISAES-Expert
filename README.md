# Intelligent Student Academic Advisory Expert System (ISAES)

ISAES is a full-stack educational advisory platform that combines a Python experta-based rule engine with an AI Chatbot and formal PDF report generation capabilities.

## Architecture Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS (for shadcn/ui components).
- **Backend API**: FastAPI (Python 3.11).
- **Inference Engine**: Experta for CLIPS-based declarative rules.
- **Reporting Generator**: WeasyPrint & Jinja2 for standard HTML->PDF output logic.
- **Chatbot Core**: Anthropic Claude + Redis for WebSocket conversational sessions.
- **Persistence Layer**: PostgreSQL 16 

## Getting Started

### 1. Launch with Docker Compose
The system is fully containerized. A single command handles Postgres, Redis, and the Backend.
```bash
docker-compose up --build
```
> The API will be available at [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI).

### 2. Run the React Frontend
Open a separate terminal and initialize the UI:
```bash
cd frontend
npm install
npm run dev
```

## System Rules & Management
Admins can directly edit Inference Rules physically inside the `/backend/rules` directory using YAML format, or overwrite them practically via the newly exposed `PUT /api/v1/admin/rules` backend endpoints.

### Seed Logic Included
- `risk_assessment.yaml`: Validates GPA triggers against multiple conditions.
- `track_eligibility.yaml`: Audits Honour's track capabilities based on strict rule-chains.
