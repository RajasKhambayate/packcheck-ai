from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db), _current_user: models.User = Depends(get_current_user)):
    total = db.query(models.ScanRecord).count()
    compliant = db.query(models.ScanRecord).filter(
        models.ScanRecord.status == models.ComplianceStatus.COMPLIANT).count()
    non_compliant = db.query(models.ScanRecord).filter(
        models.ScanRecord.status == models.ComplianceStatus.NON_COMPLIANT).count()
    needs_review = db.query(models.ScanRecord).filter(
        models.ScanRecord.status == models.ComplianceStatus.NEEDS_REVIEW).count()

    compliance_rate = round((compliant / total) * 100, 1) if total else 0.0

    # Last 7 days scan volume
    since = datetime.utcnow() - timedelta(days=6)
    recent = db.query(models.ScanRecord).filter(models.ScanRecord.created_at >= since).all()
    day_counts = Counter(r.created_at.strftime("%Y-%m-%d") for r in recent)
    scans_last_7_days = []
    for i in range(6, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        scans_last_7_days.append({"date": day, "count": day_counts.get(day, 0)})

    # Top violated rules
    violation_rows = (
        db.query(models.Violation.rule_description, func.count(models.Violation.id).label("count"))
        .group_by(models.Violation.rule_description)
        .order_by(func.count(models.Violation.id).desc())
        .limit(6)
        .all()
    )
    top_violations = [{"rule": r[0], "count": r[1]} for r in violation_rows]

    # Category breakdown
    cat_rows = (
        db.query(models.ScanRecord.category, func.count(models.ScanRecord.id).label("count"))
        .group_by(models.ScanRecord.category)
        .order_by(func.count(models.ScanRecord.id).desc())
        .limit(8)
        .all()
    )
    category_breakdown = [{"category": r[0], "count": r[1]} for r in cat_rows]

    return schemas.DashboardStats(
        total_scans=total,
        compliant=compliant,
        non_compliant=non_compliant,
        needs_review=needs_review,
        compliance_rate=compliance_rate,
        scans_last_7_days=scans_last_7_days,
        top_violations=top_violations,
        category_breakdown=category_breakdown,
    )
