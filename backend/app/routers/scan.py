import os
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.config import settings
from app.services.ocr_service import run_ocr
from app.services.compliance_engine import run_compliance_check

router = APIRouter(prefix="/api/scan", tags=["Scanning"])

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}


@router.post("", response_model=schemas.ScanRecordOut)
async def scan_product(
    product_name: str = Form(...),
    category: str = Form("Uncategorized"),
    brand: str = Form(None),
    source: str = Form("Retail"),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ext = os.path.splitext(image.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Only JPG/PNG/WEBP images are supported")

    image_bytes = await image.read()
    if len(image_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 15MB)")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(image_bytes)

    ocr_result = run_ocr(image_bytes)
    result = run_compliance_check(ocr_result)

    scan = models.ScanRecord(
        product_name=product_name,
        category=category,
        brand=brand,
        source=source,
        image_path=f"/static/uploads/{filename}",
        raw_ocr_text=ocr_result.raw_text,
        manufacturer_name=result.declarations.manufacturer_name,
        manufacturer_address=result.declarations.manufacturer_address,
        net_quantity=result.declarations.net_quantity,
        mrp=result.declarations.mrp,
        mfg_date=result.declarations.mfg_date,
        consumer_care=result.declarations.consumer_care,
        country_of_origin=result.declarations.country_of_origin,
        compliance_score=result.score,
        status=models.ComplianceStatus(result.status),
        inspector_id=current_user.id,
    )
    db.add(scan)
    db.flush()

    for v in result.violations:
        db.add(models.Violation(
            scan_id=scan.id,
            rule_code=v.rule_code,
            rule_description=v.rule_description,
            severity=models.Severity(v.severity),
            details=v.details,
        ))

    db.commit()
    db.refresh(scan)
    return scan
