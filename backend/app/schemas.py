from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import UserRole, ComplianceStatus, Severity


# ---------- Auth ----------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.INSPECTOR


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    full_name: str
    email: str
    role: UserRole
    is_active: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Violations ----------
class ViolationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    rule_code: str
    rule_description: str
    severity: Severity
    details: Optional[str] = None


# ---------- Scan / Product ----------
class ScanRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_name: str
    category: str
    brand: Optional[str] = None
    source: str
    image_path: str
    manufacturer_name: Optional[str] = None
    manufacturer_address: Optional[str] = None
    net_quantity: Optional[str] = None
    mrp: Optional[str] = None
    mfg_date: Optional[str] = None
    consumer_care: Optional[str] = None
    country_of_origin: Optional[str] = None
    compliance_score: float
    status: ComplianceStatus
    created_at: datetime
    violations: List[ViolationOut] = []


class ScanRecordSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_name: str
    category: str
    brand: Optional[str] = None
    compliance_score: float
    status: ComplianceStatus
    created_at: datetime


class ScanUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    manufacturer_name: Optional[str] = None
    manufacturer_address: Optional[str] = None
    net_quantity: Optional[str] = None
    mrp: Optional[str] = None
    mfg_date: Optional[str] = None
    consumer_care: Optional[str] = None
    country_of_origin: Optional[str] = None


# ---------- Dashboard ----------
class DashboardStats(BaseModel):
    total_scans: int
    compliant: int
    non_compliant: int
    needs_review: int
    compliance_rate: float
    scans_last_7_days: List[dict]
    top_violations: List[dict]
    category_breakdown: List[dict]
