# FinPilot AI

### AI-Powered Financial Planning, Risk Assessment & Adviser Decision Support

FinPilot AI is an AI-powered financial planning and decision-support platform designed to make financial recommendations more personalized, transparent, and responsible. It combines client profiling, financial risk assessment, goal-based planning, research retrieval, suitability guardrails, and human adviser oversight in a unified application.

The platform aims to help financial advisers evaluate client circumstances, understand investment suitability, explore relevant financial research, and prepare evidence-backed recommendations while keeping human review at the center of the decision-making process.

---

## Key Features

### 1. Client Profile Management

* Create, retrieve, update, and delete client profiles.
* Capture financial information, including monthly income, essential expenses, debt payments, liquid savings, and dependants.
* Record investment experience, risk tolerance, and financial goal horizons.
* Maintain client information for personalized financial assessments.

### 2. Financial Risk Assessment

* Evaluate financial risk capacity and risk tolerance.
* Generate capacity and tolerance scores.
* Identify conflicts between financial capacity and stated risk tolerance.
* Determine a recommended risk ceiling.
* Provide explanations and rationale for risk assessment outcomes.

### 3. Goal-Based Financial Planning

* Create financial plans for individual financial goals.
* Account for inflation and assumed investment returns.
* Calculate inflation-adjusted target amounts.
* Estimate the future value of existing savings.
* Calculate required monthly SIP contributions.
* Compare projected corpus values against financial targets.
* Generate an investment glide path based on the investment horizon.

### 4. AI-Assisted Financial Research

* Search an indexed collection of financial research documents.
* Retrieve relevant passages for a research question.
* Return source information and page references where available.
* Provide similarity scores for retrieved passages.
* Identify cases where the available evidence is insufficient.

The research component uses a retrieval-based architecture. Its results depend on the documents available in the research index.

### 5. Suitability Assessment and Guardrails

* Evaluate proposed investment categories and allocations against client circumstances.
* Detect requests involving guaranteed returns or unrealistic expectations of rapid returns.
* Check proposed equity and small-cap allocations.
* Identify cases requiring additional information or reassessment.
* Require adviser review before recommendations are delivered to clients.

### 6. Adviser Review Workflow

* Combine client information, risk assessments, financial goals, research, and suitability checks.
* Generate recommendation drafts for adviser review.
* Support draft submission and adviser approval or rejection.
* Record decisions and reasons for review.
* Maintain an audit trail for accountability.

**Important:** Recommendation drafts are intended for adviser review. The workflow does not automatically authorize client delivery.

---

## System Architecture

FinPilot AI uses a frontend-backend architecture.

```text
                    ┌────────────────────────┐
                    │       User / Adviser   │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │     Next.js Frontend   │
                    │                        │
                    │ Dashboard and UI       │
                    │ Client Management      │
                    │ Risk and Goal Views    │
                    │ Research and Reviews   │
                    └────────────┬───────────┘
                                 │
                           REST API / HTTP
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    FastAPI Backend     │
                    │                        │
                    │ Client Services        │
                    │ Risk Assessment        │
                    │ Goal Planning          │
                    │ Suitability Guardrails │
                    │ Research Retrieval     │
                    │ Adviser Workflow       │
                    └────────────┬───────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
          ┌──────────────────┐     ┌──────────────────┐
          │ Database Layer   │     │ Research / RAG   │
          │                  │     │                  │
          │ Client and Goal  │     │ Document Loading │
          │ Records          │     │ Retrieval        │
          └──────────────────┘     └──────────────────┘
```

The diagram represents the intended logical architecture. The actual availability and integration of individual components depend on the configured environment.

---

## Technology Stack

| Component             | Technology                           |
| --------------------- | ------------------------------------ |
| Frontend framework    | Next.js                              |
| Frontend language     | TypeScript / JavaScript              |
| Backend framework     | FastAPI                              |
| Backend language      | Python                               |
| API architecture      | REST APIs                            |
| Data validation       | Pydantic                             |
| Financial planning    | Python-based calculation services    |
| Research architecture | Retrieval-Augmented Generation (RAG) |
| Testing               | Pytest and Python test modules       |
| Version control       | Git and GitHub                       |

The database implementation, vector retrieval dependencies, and any external AI model integrations depend on the backend configuration.

---

## Project Structure

The repository is organized into separate frontend and backend directories.

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

Install the following before running the application:

* Python 3.11 or another Python version supported by the backend dependencies.
* Node.js and npm.
* Git.
* A modern web browser.

### 1. Clone the Repository

```bash
git clone https://github.com/Varun-CIT/FinPilot-AI.git
cd FinPilot-AI
```

### 2. Set Up the Backend

Open a terminal in the repository root.

On Windows PowerShell:

```powershell
cd backend

python -m venv .venv

.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip

pip install -r requirements.txt
```

If PowerShell blocks virtual-environment activation, use an alternative terminal or activate the environment using the appropriate command for your shell.

Start the FastAPI server:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend should be available at:

* **API base URL:** `http://127.0.0.1:8000`
* **Interactive API documentation:** `http://127.0.0.1:8000/docs`
* **Health endpoint:** `http://127.0.0.1:8000/health`

Verify that the backend is running:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```

An expected successful response resembles:

```json
{
  "status": "ok",
  "service": "finpilot-core",
  "version": "0.4.0"
}
```

Actual output may differ by backend version.

**Configuration note:** Additional environment variables, database initialization, or research-index setup may be required depending on the installed dependencies and application configuration.

### 3. Set Up the Frontend

Open a second terminal:

```powershell
cd frontend

npm install
```

Configure the backend API URL if the frontend requires it.

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```powershell
npm run dev
```

Open the local URL printed in the terminal, usually:

`http://localhost:3000`

Keep both development servers running while testing the application.

---

## API Overview

The backend exposes REST endpoints for the platform's main operations.

| Method | Endpoint                                 | Purpose                             |
| ------ | ---------------------------------------- | ----------------------------------- |
| GET    | `/health`                                | Check backend availability          |
| GET    | `/clients`                               | Retrieve client records             |
| POST   | `/clients`                               | Create a client                     |
| GET    | `/clients/{client_id}`                   | Retrieve a client                   |
| PATCH  | `/clients/{client_id}`                   | Update a client                     |
| DELETE | `/clients/{client_id}`                   | Delete a client                     |
| POST   | `/risk/assess`                           | Assess financial risk               |
| POST   | `/goals/plan`                            | Calculate a financial goal plan     |
| GET    | `/goals/glide-path`                      | Generate an investment glide path   |
| GET    | `/research/status`                       | Check research-index status         |
| POST   | `/research/search`                       | Search indexed research             |
| POST   | `/suitability/check`                     | Evaluate investment suitability     |
| GET    | `/clients/{client_id}/goals`             | Retrieve a client's financial goals |
| POST   | `/clients/{client_id}/goals`             | Create a financial goal             |
| POST   | `/clients/{client_id}/advisory-workflow` | Run the advisory workflow           |
| POST   | `/adviser/drafts`                        | Create an adviser draft             |
| GET    | `/adviser/audit-log`                     | Retrieve adviser audit records      |

Additional endpoints support retrieving, updating, deleting, submitting, and reviewing financial goals and recommendation drafts.

For the authoritative request schemas, response models, and available operations, run the backend and visit `/docs`.

---

## Responsible AI and Human Oversight

Financial decisions can have significant consequences. FinPilot AI is designed around several safeguards:

* **Risk awareness:** Financial capacity and risk tolerance are evaluated separately.
* **Suitability checks:** Proposed investments are assessed against relevant client information.
* **Evidence-based research:** Research retrieval can provide source passages to support adviser analysis.
* **Uncertainty handling:** Insufficient research evidence should be identified rather than treated as conclusive.
* **Human oversight:** Recommendation drafts require adviser review.
* **Auditability:** Adviser decisions and their stated reasons can be recorded.
* **Controlled delivery:** Generating a recommendation draft does not itself authorize delivery to a client.

These mechanisms support responsible decision-making but do not guarantee that every assessment or recommendation will be correct.

---

## Testing

The backend repository contains automated tests and additional research-related test modules.

From the backend directory, run:

```powershell
python -m pytest
```

The result depends on the installed dependencies, configured database, and available test fixtures.

For manual API testing, use the interactive Swagger UI:

```text
http://127.0.0.1:8000/docs
```

Test the backend independently before evaluating frontend-backend integration.

---

## Current Project Status

FinPilot AI includes backend services for client management, risk assessment, goal planning, research retrieval, suitability checks, and adviser review workflows, together with a Next.js frontend.

The following should be verified in the target environment before claiming full end-to-end functionality:

* Frontend-backend connectivity.
* Client creation and retrieval.
* Risk assessment results displayed in the frontend.
* Financial goal creation and retrieval.
* Availability of indexed research documents.
* Recommendation draft submission and adviser decisions.
* Persistence of records and audit events.
* Successful installation from a clean environment.

**Implementation status:** Individual backend capabilities are present in the codebase. The completeness of their frontend integration and their behavior in a fresh deployment must be verified.

---

## Future Enhancements

Potential improvements include:

* Automated integration testing across the frontend and backend.
* More comprehensive financial-planning scenarios.
* Stronger evaluation of recommendation quality and research relevance.
* Improved observability and error handling.
* Authentication and role-based access control.
* Additional security and privacy controls.
* Deployment configuration for a production environment.
* Expanded audit reporting and evaluation of model outputs.

These are potential enhancements, not claims about currently implemented functionality.

---

## Disclaimer

FinPilot AI is a software project intended for financial-planning assistance, research exploration, and adviser decision support.

It is not a substitute for professional financial advice. Financial calculations and research results depend on their inputs, assumptions, data quality, and implementation. Investment returns are not guaranteed, and past performance does not predict future results.

Do not use the platform for real financial decisions without appropriate validation, security controls, and qualified human review.

---

## Author and Repository

**GitHub Repository:**
https://github.com/Varun-CIT/FinPilot-AI

**Project:** FinPilot AI — AI-Powered Financial Planning and Adviser Decision Support

Built using Next.js, FastAPI, and Python.
