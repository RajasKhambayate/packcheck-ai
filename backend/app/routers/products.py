from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user

router = APIRouter(prefix="/api/products", tags=["Product Repository"])


@router.get("", response_model=list[schemas.ScanRecordSummary])
def list_products(
    q: Optional[str] = Query(None, description="Search by product name, brand or category"),
    status: Optional[models.ComplianceStatus] = None,
    category: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.ScanRecord)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            models.ScanRecord.product_name.ilike(like),
            models.ScanRecord.brand.ilike(like),
            models.ScanRecord.category.ilike(like),
        ))
    if status:
        query = query.filter(models.ScanRecord.status == status)
    if category:
        query = query.filter(models.ScanRecord.category == category)

    return (query.order_by(models.ScanRecord.created_at.desc())
            .offset(offset).limit(limit).all())


@router.get("/{scan_id}", response_model=schemas.ScanRecordOut)
def get_product(scan_id: str, db: Session = Depends(get_db),
                 _current_user: models.User = Depends(get_current_user)):
    scan = db.query(models.ScanRecord).filter(models.ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return scan


@router.patch("/{scan_id}", response_model=schemas.ScanRecordOut)
def update_product(scan_id: str, payload: schemas.ScanUpdate, db: Session = Depends(get_db),
                    _current_user: models.User = Depends(get_current_user)):
    scan = db.query(models.ScanRecord).filter(models.ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(scan, field, value)
    db.commit()
    db.refresh(scan)
    return scan


@router.delete("/{scan_id}")
def delete_product(scan_id: str, db: Session = Depends(get_db),
                    _current_user: models.User = Depends(get_current_user)):
    scan = db.query(models.ScanRecord).filter(models.ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")
    db.delete(scan)
    db.commit()
    return {"detail": "deleted"}
