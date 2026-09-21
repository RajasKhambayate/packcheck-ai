import enum
import uuid
from datetime import datetime

from sqlalchemy import (Column, String, DateTime, Float, ForeignKey, Text,
                         Enum, Boolean, Integer)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    INSPECTOR = "inspector"
    VIEWER = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.INSPECTOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    scans = relationship("ScanRecord", back_populates="inspector")


class ComplianceStatus(str, enum.Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    NEEDS_REVIEW = "needs_review"


class ScanRecord(Base):
    """One scanned packaged-commodity image + its compliance verdict."""
    __tablename__ = "scan_records"

    id = Column(String, primary_key=True, default=gen_uuid)
    product_name = Column(String, nullable=False)
    category = Column(String, default="Uncategorized")
    brand = Column(String, nullable=True)
    source = Column(String, default="Retail")  # Retail / E-commerce / Warehouse
    image_path = Column(String, nullable=False)

    raw_ocr_text = Column(Text, nullable=True)

    # Extracted declarations (stored as JSON-ish text for portability, plus
    # a normalized ComplianceCheck table below for querying).
    manufacturer_name = Column(String, nullable=True)
    manufacturer_address = Column(String, nullable=True)
    net_quantity = Column(String, nullable=True)
    mrp = Column(String, nullable=True)
    mfg_date = Column(String, nullable=True)
    consumer_care = Column(String, nullable=True)
    country_of_origin = Column(String, nullable=True)

    compliance_score = Column(Float, default=0.0)  # 0-100
    status = Column(Enum(ComplianceStatus), default=ComplianceStatus.NEEDS_REVIEW)

    inspector_id = Column(String, ForeignKey("users.id"), nullable=True)
    inspector = relationship("User", back_populates="scans")

    created_at = Column(DateTime, default=datetime.utcnow)

    violations = relationship("Violation", back_populates="scan",
                               cascade="all, delete-orphan")


class Severity(str, enum.Enum):
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"


class Violation(Base):
    __tablename__ = "violations"

    id = Column(String, primary_key=True, default=gen_uuid)
    scan_id = Column(String, ForeignKey("scan_records.id"), nullable=False)
    rule_code = Column(String, nullable=False)       # e.g. LM-R6-1(a)
    rule_description = Column(String, nullable=False)
    severity = Column(Enum(Severity), default=Severity.MAJOR)
    details = Column(Text, nullable=True)

    scan = relationship("ScanRecord", back_populates="violations")
