from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.deps import get_current_user
from app.services.report_generator import generate_pdf_report, generate_docx_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _get_scan(scan_id: str, db: Session) -> models.ScanRecord:
    scan = db.query(models.ScanRecord).filter(models.ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return scan


@router.get("/{scan_id}/pdf")
def download_pdf(scan_id: str, db: Session = Depends(get_db),
                  _current_user: models.User = Depends(get_current_user)):
    scan = _get_scan(scan_id, db)
    path = generate_pdf_report(scan)
    filename = f"PackCheck_Report_{scan.product_name[:30].replace(' ', '_')}.pdf"
    return FileResponse(path, media_type="application/pdf", filename=filename)


@router.get("/{scan_id}/docx")
def download_docx(scan_id: str, db: Session = Depends(get_db),
                   _current_user: models.User = Depends(get_current_user)):
    scan = _get_scan(scan_id, db)
    path = generate_docx_report(scan)
    filename = f"PackCheck_Report_{scan.product_name[:30].replace(' ', '_')}.docx"
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
    )
