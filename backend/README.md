# FinPilot AI — Core Layer (Prototype)

This starter project implements the first deterministic core of the ZECKATHON PS4 adviser co-pilot:
- Separate risk capacity and behavioural risk tolerance.
- Conservative conflict resolution: use the lower risk band.
- Inflation-adjusted goal corpus and SIP estimates.
- Illustrative glide path.
- Suitability guardrails for guaranteed-return requests, aggressive requests after losses, senior/small-cap concentration, high allocation relative to conservative profiles, and no monthly surplus.
- Draft → adviser review → approval/rejection workflow with an audit log.
- FastAPI endpoints and tests.

## Run locally

```bash
python -m venv .venv
# Windows PowerShell:
.venv\\Scripts\\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the interactive API docs.

## Test

```bash
pytest -q
```

## Key endpoints

- `GET /health`
- `POST /risk/assess`
- `POST /goals/plan`
- `GET /goals/glide-path`
- `POST /suitability/check`
- `POST /adviser/drafts`
- `POST /adviser/drafts/{draft_id}/submit`
- `POST /adviser/drafts/{draft_id}/decision`
- `GET /adviser/audit-log`

## Important limitations

- Risk scoring weights and guardrail thresholds are transparent prototype rules, not official SEBI-prescribed scoring or investment recommendations.
- This does not select or recommend specific mutual funds yet.
- Goal returns and inflation are assumptions, not guarantees.
- Glide path is illustrative and should be reviewed by a qualified adviser.
- Approval state is in-memory and resets when the server restarts. Use a persistent database for a real deployment.
- No client-facing delivery endpoint is implemented. Adviser approval is recorded, but delivery remains disabled by design.
- Before using with real clients, add authentication, role-based access, encryption, persistent storage, source-grounded RAG, logging controls, and legal/compliance review.
