import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class Client(Base):
    __tablename__ = "clients"

    id = Column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    full_name = Column(String(100), nullable=False, index=True)
    email = Column(String(255), nullable=True, unique=True, index=True)
    phone = Column(String(20), nullable=True)

    age = Column(Float, nullable=True)
    occupation = Column(String(100), nullable=True)

    annual_income = Column(Float, nullable=True)
    monthly_expenses = Column(Float, nullable=True)
    existing_investments = Column(Float, nullable=True)
    emergency_fund = Column(Float, nullable=True)

    risk_profile = Column(String(30), nullable=True)
    financial_notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    # A client can have multiple financial goals.
    goals = relationship(
        "FinancialGoal",
        back_populates="client",
        cascade="all, delete-orphan",
    )


class FinancialGoal(Base):
    __tablename__ = "financial_goals"

    id = Column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )

    client_id = Column(
        String(36),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    goal_name = Column(String(120), nullable=False)

    current_goal_cost_inr = Column(
        Float,
        nullable=False,
    )

    years_to_goal = Column(
    Integer,
    nullable=False,
)

    current_goal_savings_inr = Column(
        Float,
        nullable=False,
        default=0,
    )

    monthly_contribution_inr = Column(
        Float,
        nullable=True,
    )

    annual_inflation_assumption = Column(
        Float,
        nullable=False,
        default=0.06,
    )

    annual_return_assumption = Column(
        Float,
        nullable=False,
        default=0.08,
    )

    # Store the latest calculated plan as JSON text.
    plan_json = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    client = relationship(
        "Client",
        back_populates="goals",
    )