# ISAES: Intelligent Student Academic Advisory Expert System 🎓🚀

**ISAES** is a state-of-the-art academic intelligence platform designed to empower advisors and students with data-driven insights. It transforms raw academic data into personalized, course-specific improvement strategies using a robust rule-based inference engine.

![Dashboard Preview](file:///C:/Users/Aanvi%20Bindal/.gemini/antigravity/brain/69dda630-15cb-4083-be95-0e1ca87f1aa0/dashboard_overview_1775373581034.png)

## ✨ Core Features

- **🧠 Expert Intelligence Core**: Uses a 4-tier performance matrix (Excellence, Stable, Probation, Critical) to generate non-repetitive, course-specific advice.
- **🤖 ISAES Copilot (AI Chatbot)**: A resilient chat assistant with a REST-fallback handshake, ensuring 100% connectivity. Includes pre-fed FAQ buttons for instant answers.
- **📊 Global Intelligence Overview**: A real-time executive dashboard showing Institutional Risk Index, Average GPA, and Participation Rate across the registry.
- **📄 Official Academic Reports**: Generate and export detailed PDF/HTML intelligence reports for students.
- **🔍 Multi-Dimensional Filtering**: Search and filter by Department (CS, EE, ME, BA, DS), CGPA, or Student ID.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS (Premium UI/UX) |
| **Backend** | FastAPI (Python 3.10+), Pydantic |
| **Expert System** | Experta (Rule-based Inference Engine) |
| **Chat Context** | Redis (Optional Memory Storage) |
| **Reports** | Jinja2, WeasyPrint (PDF Fallback to HTML) |

## 🚀 Quick Setup (Global Roster)

### 1. Requirements
- Node.js (v18+)
- Python (v3.10+)
- Docker (Optional for easy orchestration)

### 2. Local Installation

**Backend Setup:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

### 3. Docker Deployment (Single Command)
```bash
docker-compose up --build
```

## 📂 Project Structure
- `backend/`: FastAPI server, Expert rules (`/rules`), and logic.
- `frontend/`: React components, Dashboard UI (`src/components`), and styling.
- `rules/`: YAML-based logic files for academic advisory.

## 📜 Deployment Notice
This project is optimized for ease of demo. If **WeasyPrint** GTK3 binaries are missing on the host, the system automatically falls back to **High-Fidelity HTML Reports** to ensure no data loss.

---
**Created by Aanvi Bindal**  
*ISAES: Transforming Academic Records into Success Trajectories.*
