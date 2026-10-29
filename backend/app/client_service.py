from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Client

router = APIRouter(prefix="/clients", tags=["Client Management"])


class ClientCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)

    age: float | None = Field(default=None, gt=0, le=120)
    occupation: str | None = Field(default=None, max_length=100)

    annual_income: float | None = Field(default=None, ge=0)
    monthly_expenses: float | None = Field(default=None, ge=0)
    existing_investments: float | None = Field(default=None, ge=0)
    emergency_fund: float | None = Field(default=None, ge=0)

    financial_notes: str | None = None


class ClientUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)

    age: float | None = Field(default=None, gt=0, le=120)
    occupation: str | None = Field(default=None, max_length=100)

    annual_income: float | None = Field(default=None, ge=0)
    monthly_expenses: float | None = Field(default=None, ge=0)
    existing_investments: float | None = Field(default=None, ge=0)
    emergency_fund: float | None = Field(default=None, ge=0)

    financial_notes: str | None = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: str | None
    phone: str | None
    age: float | None
    occupation: str | None

    annual_income: float | None
    monthly_expenses: float | None
    existing_investments: float | None
    emergency_fund: float | None

    risk_profile: str | None
    financial_notes: str | None


@router.post(
    "",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_client(
    request: ClientCreate,
    db: Session = Depends(get_db),
):
    client = Client(**request.model_dump())

    db.add(client)

    try:
        db.commit()
        db.refresh(client)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A client with this email already exists.",
        )

    return client


@router.get("", response_model=list[ClientResponse])
def list_clients(db: Session = Depends(get_db)):
    return db.query(Client).order_by(Client.full_name).all()


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: str,
    db: Session = Depends(get_db),
):
    client = db.get(Client, client_id)

    if client is None:
        raise HTTPException(status_code=404, detail="Client not found.")

    return client


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: str,
    request: ClientUpdate,
    db: Session = Depends(get_db),
):
    client = db.get(Client, client_id)

    if client is None:
        raise HTTPException(status_code=404, detail="Client not found.")

    changes = request.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(client, field, value)

    try:
        db.commit()
        db.refresh(client)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A client with this email already exists.",
        )

    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: str,
    db: Session = Depends(get_db),
):
    client = db.get(Client, client_id)

    if client is None:
        raise HTTPException(status_code=404, detail="Client not found.")

    db.delete(client)
    db.commit()