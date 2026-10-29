# FinPilot AI

### Intelligent Financial Planning, Risk Assessment & Adviser Decision Support

FinPilot AI is an AI-powered financial planning and decision-support platform designed to make financial recommendations more personalized, transparent, and responsible. By combining financial risk assessment, goal-based planning, AI-assisted research, investment suitability guardrails, and human adviser oversight, the platform supports informed financial decision-making.

FinPilot AI brings financial analysis and research into a unified workflow, helping advisers evaluate client circumstances, understand investment suitability, and prepare evidence-informed recommendations.

---

## Key Features

### 📊 1. Intelligent Client Profiling

* Create and manage client financial profiles.
* Capture income, expenses, debt obligations, savings, and dependants.
* Record investment experience, risk tolerance, and financial goals.
* Support personalized financial assessments using client-specific information.

### 📈 2. Financial Risk Assessment

* Evaluate financial risk capacity and risk tolerance separately.
* Generate risk capacity and tolerance scores.
* Identify conflicts between financial capacity and stated risk tolerance.
* Determine a recommended risk ceiling.
* Provide explanations and rationales for risk assessment outcomes.

### 🎯 3. Goal-Based Financial Planning

* Create personalized plans for financial goals.
* Account for inflation and assumed investment returns.
* Calculate inflation-adjusted financial targets.
* Estimate the future value of existing savings.
* Calculate required monthly Systematic Investment Plan (SIP) contributions.
* Compare projected corpus values with financial targets.
* Generate investment glide paths based on investment horizons.

### 🤖 4. AI-Assisted Financial Research

* Search indexed financial research documents.
* Retrieve relevant passages based on user queries.
* Provide source and page information where available.
* Use similarity scores to help assess retrieval relevance.
* Identify situations where available research evidence is insufficient.

The research component uses a Retrieval-Augmented Generation (RAG) architecture to support evidence-informed financial analysis.

### 🛡️ 5. Investment Suitability & Guardrails

* Evaluate proposed investment categories and allocations against client circumstances.
* Identify requests involving guaranteed returns or unrealistic expectations.
* Validate proposed equity and small-cap allocations.
* Flag situations requiring additional information or reassessment.
* Incorporate adviser approval requirements into recommendation workflows.

### 👨‍💼 6. Human-in-the-Loop Adviser Workflow

* Combine client profiles, risk assessments, financial goals, research, and suitability checks.
* Generate recommendation drafts for adviser review.
* Support submission of drafts for review.
* Record adviser approval or rejection decisions and their reasons.
* Maintain an audit trail to support accountability.

**Design principle:** AI assists financial decision-making; adviser oversight remains central to the recommendation process.

---

## System Architecture

FinPilot AI follows a modular, API-driven architecture.

```text
                 ┌──────────────────────────┐
                 │      User / Adviser      │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │      Next.js Frontend    │
                 │                          │
                 │ Dashboard                │
                 │ Client Management        │
                 │ Risk Assessment          │
                 │ Financial Goals          │
                 │ Research & Recommendations│
                 │ Adviser Review           │
                 └────────────┬─────────────┘
                              │
                         REST APIs
                              │
                              ▼
                 ┌──────────────────────────┐
                 │      FastAPI Backend     │
                 │                          │
                 │ Client Services          │
                 │ Risk Assessment Engine   │
                 │ Goal Planning Services   │
                 │ Suitability Guardrails   │
                 │ Research Retrieval       │
                 │ Advisory Workflow        │
                 └────────────┬─────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌──────────────────┐ ┌──────────────────┐
          │ Database Layer   │ │ Research / RAG   │
          │                  │ │                  │
          │ Client Records   │ │ Document Loading │
          │ Financial Goals  │ │ Retrieval        │
          │ Workflow Data    │ │ Evidence Sources │
          └──────────────────┘ └──────────────────┘
```

The architecture separates the presentation layer, business logic, financial assessment services, and research retrieval components to support modular development and maintainability.

---

## Technology Stack

| Layer                 | Technologies                                     |
| --------------------- | ------------------------------------------------ |
| Frontend              | Next.js, React, TypeScript / JavaScript          |
| Backend               | Python, FastAPI                                  |
| API communication     | REST APIs, HTTP                                  |
| Data validation       | Pydantic                                         |
| Financial analysis    | Python-based calculation and assessment services |
| Research architecture | Retrieval-Augmented Generation (RAG)             |
| Testing               | Pytest and Python test modules                   |
| Version control       | Git, GitHub                                      |

Database and research-retrieval implementations are configured through the backend application and its dependencies.

---

## Project Structure

```text
FinPilot-AI/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── client_service.py
│   │   ├── goal_service.py
│   │   ├── advisory_service.py
│   │   ├── risk.py
│   │   ├── goals.py
│   │   ├── guardrails.py
│   │   ├── workflow.py
│   │   └── rag/
│   ├── tests/
│   ├── requirements.txt
│   └── ...
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

* Python 3.11 or another version supported by the backend dependencies.
* Node.js and npm.
* Git.
* A modern web browser.

### 1. Clone the Repository

```bash
git clone https://github.com/Varun-CIT/FinPilot-AI.git
cd FinPilot-AI
```

### 2. Set Up the Backend

Open a terminal:

```powershell
cd backend

python -m venv .venv

.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip

pip install -r requirements.txt
```

Start the backend server:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend exposes the following endpoints:

| Resource                      | URL                            |
| ----------------------------- | ------------------------------ |
| API base                      | `http://127.0.0.1:8000`        |
| Interactive API documentation | `http://127.0.0.1:8000/docs`   |
| Health check                  | `http://127.0.0.1:8000/health` |

To verify the backend:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```

### 3. Set Up the Frontend

Open a second terminal:

```powershell
cd frontend

npm install
```

Configure the backend URL in a `.env.local` file inside the frontend directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Start the frontend:

```powershell
npm run dev
```

Open the local URL displayed in the terminal, usually:

`http://localhost:3000`

Keep both servers running during local development.

**Configuration note:** Database initialization, environment variables, research-document indexing, or additional dependencies may be required depending on the selected backend features.

---

## API Endpoints

The FastAPI backend provides endpoints for the platform's core operations.

| Method   | Endpoint                                 | Description                       |
| -------- | ---------------------------------------- | --------------------------------- |
| `GET`    | `/health`                                | Check backend health              |
| `GET`    | `/clients`                               | Retrieve clients                  |
| `POST`   | `/clients`                               | Create a client                   |
| `GET`    | `/clients/{client_id}`                   | Retrieve a client profile         |
| `PATCH`  | `/clients/{client_id}`                   | Update a client profile           |
| `DELETE` | `/clients/{client_id}`                   | Delete a client                   |
| `POST`   | `/risk/assess`                           | Assess financial risk             |
| `POST`   | `/goals/plan`                            | Calculate a financial goal plan   |
| `GET`    | `/goals/glide-path`                      | Generate an investment glide path |
| `GET`    | `/research/status`                       | Retrieve research-index status    |
| `POST`   | `/research/search`                       | Search indexed research           |
| `POST`   | `/suitability/check`                     | Evaluate investment suitability   |
| `GET`    | `/clients/{client_id}/goals`             | Retrieve client financial goals   |
| `POST`   | `/clients/{client_id}/goals`             | Create a financial goal           |
| `POST`   | `/clients/{client_id}/advisory-workflow` | Run the advisory workflow         |
| `POST`   | `/adviser/drafts`                        | Create a recommendation draft     |
| `GET`    | `/adviser/audit-log`                     | Retrieve adviser audit records    |

Additional endpoints support financial goal updates, recommendation submission, and adviser decisions.

Refer to the interactive API documentation at `/docs` for request schemas, response models, and available operations.

---

## Responsible AI & Financial Safety

FinPilot AI incorporates design principles intended to support responsible financial decision-making.

* **Risk-aware analysis:** Separates financial capacity from stated risk tolerance.
* **Suitability checks:** Evaluates proposed investment allocations against client circumstances.
* **Research-backed analysis:** Retrieves relevant supporting evidence from indexed documents.
* **Uncertainty awareness:** Identifies cases where available evidence may be insufficient.
* **Human oversight:** Routes recommendation drafts through adviser review.
* **Auditability:** Records adviser decisions and their stated reasons.
* **Controlled recommendations:** Distinguishes recommendation generation from approval for client delivery.

These safeguards support informed decision-making but do not eliminate financial, data, or model-related risks.

---

## Testing

The backend includes test modules for core functionality.

Run the test suite from the backend directory:

```powershell
python -m pytest
```

Use the interactive API documentation for manual endpoint testing:

`http://127.0.0.1:8000/docs`

Testing outcomes may depend on installed dependencies, configured services, database initialization, and available research documents.

---

## Future Scope

Potential enhancements include:

* Expanded financial planning scenarios.
* More comprehensive research-source coverage.
* Improved evaluation of research relevance and recommendation quality.
* Automated frontend-backend integration testing.
* Enhanced authentication and role-based access control.
* Advanced monitoring, logging, and observability.
* Additional security and privacy controls.
* Deployment automation and production infrastructure.
* Expanded financial analytics and reporting.

---

## Disclaimer

FinPilot AI is intended for financial-planning assistance, research exploration, and adviser decision support. It does not replace qualified financial advice.

Financial projections depend on assumptions, input data, and calculation methods. Investment returns are not guaranteed, and past performance does not predict future results.

The platform should not be used for consequential financial decisions without appropriate validation, security controls, and qualified human review.

---

## Repository

**GitHub:** https://github.com/Varun-CIT/FinPilot-AI

**Project:** FinPilot AI — Intelligent Financial Planning and Adviser Decision Support

**Core technologies:** Next.js · FastAPI · Python · REST APIs · RAG
