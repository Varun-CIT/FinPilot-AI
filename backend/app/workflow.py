from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4
from .schemas import RecommendationDraft, ApprovalAction


@dataclass
class ApprovalStore:
    """In-memory demo workflow. Replace with persistent DB before production."""
    drafts: dict[str, RecommendationDraft] = field(default_factory=dict)
    audit_log: list[dict] = field(default_factory=list)

    def create_draft(self, draft: RecommendationDraft) -> dict:
        draft_id = str(uuid4())
        draft.status = "draft"
        self.drafts[draft_id] = draft
        self.audit_log.append(self._event(draft_id, "draft_created", "system", "Generated draft; not client deliverable."))
        return {"draft_id": draft_id, "status": draft.status, "client_delivery_permitted": False}

    def submit_for_review(self, draft_id: str) -> dict:
        draft = self._get(draft_id)
        if draft.status != "draft":
            raise ValueError("Only a draft can be submitted for review.")
        draft.status = "submitted_for_review"
        self.audit_log.append(self._event(draft_id, "submitted_for_review", "system", "Sent to adviser review queue."))
        return {"draft_id": draft_id, "status": draft.status, "client_delivery_permitted": False}

    def decide(self, draft_id: str, action: ApprovalAction) -> dict:
        draft = self._get(draft_id)
        if draft.status != "submitted_for_review":
            raise ValueError("Only submitted drafts can be approved or rejected.")
        draft.status = "approved" if action.decision == "approve" else "rejected"
        self.audit_log.append(self._event(draft_id, action.decision, action.adviser_id, action.reason))
        # Even approved content should only be delivered by a separately authorized delivery service.
        return {
            "draft_id": draft_id,
            "status": draft.status,
            "client_delivery_permitted": False,
            "note": "Approval recorded. Client delivery must be handled by a separate authorized service."
        }

    def _get(self, draft_id: str) -> RecommendationDraft:
        if draft_id not in self.drafts:
            raise KeyError("Draft not found.")
        return self.drafts[draft_id]

    @staticmethod
    def _event(draft_id: str, event: str, actor: str, reason: str) -> dict:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "draft_id": draft_id,
            "event": event,
            "actor": actor,
            "reason": reason,
        }


store = ApprovalStore()
