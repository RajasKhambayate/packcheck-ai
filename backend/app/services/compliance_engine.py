"""
Compliance Engine
-----------------
Pipeline: Declaration Extraction -> Presence Check -> Format Check ->
Visual/Readability Check -> Score & Verdict.

This mirrors the methodology diagram in the SIH submission:
  Product Scanning -> Image Preprocessing -> OCR ->
  Declaration Extraction Engine -> Compliance Checks (Presence / Format /
  Visual) -> Compliance Engine (rule-by-rule evaluation) -> Report
"""
import re
from dataclasses import dataclass, field
from typing import Optional, List, Dict

from app.rules.legal_metrology_rules import RULES, EXTRACTION_PATTERNS
from app.services.ocr_service import OCRResult
from app.config import settings


@dataclass
class ExtractedDeclarations:
    manufacturer_name: Optional[str] = None
    manufacturer_address: Optional[str] = None
    net_quantity: Optional[str] = None
    mrp: Optional[str] = None
    mfg_date: Optional[str] = None
    consumer_care: Optional[str] = None
    country_of_origin: Optional[str] = None


@dataclass
class ComplianceViolation:
    rule_code: str
    rule_description: str
    severity: str
    details: str


@dataclass
class ComplianceResult:
    declarations: ExtractedDeclarations
    violations: List[ComplianceViolation] = field(default_factory=list)
    score: float = 0.0
    status: str = "needs_review"
    readability_notes: List[str] = field(default_factory=list)


def _extract_field(pattern_key: str, text: str) -> Optional[str]:
    for pattern in EXTRACTION_PATTERNS.get(pattern_key, []):
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1).strip(" .:-\n")
            if value:
                return value
    return None


def extract_declarations(ocr_text: str) -> ExtractedDeclarations:
    text = ocr_text or ""
    manufacturer_name = _extract_field("manufacturer_name", text)

    # crude address grab: line following/around manufacturer name mention
    manufacturer_address = None
    addr_match = re.search(
        r"(?:address|add)\s*[:\-]?\s*([A-Za-z0-9,./\-\s]{10,120})", text, re.IGNORECASE
    )
    if addr_match:
        manufacturer_address = addr_match.group(1).strip(" .:-\n")

    return ExtractedDeclarations(
        manufacturer_name=manufacturer_name,
        manufacturer_address=manufacturer_address,
        net_quantity=_extract_field("net_quantity", text),
        mrp=_extract_field("mrp", text),
        mfg_date=_extract_field("mfg_date", text),
        consumer_care=_extract_field("consumer_care", text),
        country_of_origin=_extract_field("country_of_origin", text),
    )


def _check_presence(decl: ExtractedDeclarations) -> List[ComplianceViolation]:
    violations = []
    for rule_code, rule in RULES.items():
        value = getattr(decl, rule["field"], None)
        if not value:
            violations.append(
                ComplianceViolation(
                    rule_code=rule_code,
                    rule_description=rule["description"],
                    severity=rule["severity"],
                    details=f"Declaration not detected on package: {rule['description']}",
                )
            )
    return violations


def _check_format(decl: ExtractedDeclarations) -> List[ComplianceViolation]:
    violations = []

    # MRP must be numeric and plausible
    if decl.mrp:
        cleaned = decl.mrp.replace(",", "")
        try:
            value = float(cleaned)
            if value <= 0 or value > 1_000_000:
                violations.append(ComplianceViolation(
                    rule_code="LM-R6-1d-fmt",
                    rule_description="MRP value appears invalid/out of plausible range",
                    severity="major",
                    details=f"Detected MRP '{decl.mrp}' failed sanity check",
                ))
        except ValueError:
            violations.append(ComplianceViolation(
                rule_code="LM-R6-1d-fmt",
                rule_description="MRP is not declared as a valid numeric value",
                severity="major",
                details=f"Raw value captured: '{decl.mrp}'",
            ))

    # Net quantity should contain a recognized standard unit
    if decl.net_quantity:
        if not re.search(r"(g|gm|gms|grams?|kg|ml|l|litre|litres?|mg|pcs|pieces|n)\b",
                          decl.net_quantity, re.IGNORECASE):
            violations.append(ComplianceViolation(
                rule_code="LM-R6-1b-fmt",
                rule_description="Net quantity not declared in standard legal units",
                severity="major",
                details=f"Raw value captured: '{decl.net_quantity}'",
            ))

    # Consumer care must look like a phone number or email
    if decl.consumer_care:
        looks_like_contact = re.search(
            r"(\+?\d[\d\s\-]{7,}\d)|([\w.+-]+@[\w-]+\.[\w.-]+)", decl.consumer_care
        )
        if not looks_like_contact:
            violations.append(ComplianceViolation(
                rule_code="LM-R6-1e-fmt",
                rule_description="Consumer care details missing a valid phone/email",
                severity="minor",
                details=f"Raw value captured: '{decl.consumer_care}'",
            ))

    return violations


def _check_readability(ocr: OCRResult) -> List[str]:
    """Heuristic readability/font-size screen using OCR bounding-box
    heights relative to overall image height, as a stand-in for Rule 8
    numeral/lettering-size requirements (which are formally specified in mm
    relative to the package's principal display panel area). Flags text
    that is disproportionately small, which commonly correlates with
    non-compliant fine print."""
    notes = []
    if not ocr.words or ocr.image_height == 0:
        return notes

    heights = [w.height for w in ocr.words if w.conf > 40]
    if not heights:
        return notes

    avg_ratio = (sum(heights) / len(heights)) / ocr.image_height
    small_word_count = sum(
        1 for w in ocr.words
        if w.conf > 40 and (w.height / ocr.image_height) < settings.MIN_DECLARATION_HEIGHT_RATIO
    )
    if small_word_count > 0:
        notes.append(
            f"{small_word_count} text element(s) detected below the minimum "
            f"legible-size heuristic threshold - verify against Rule 8 "
            f"numeral/lettering size requirements with a calibrated scale."
        )
    if avg_ratio < settings.MIN_DECLARATION_HEIGHT_RATIO * 1.5:
        notes.append(
            "Overall label text is small relative to image frame; "
            "recommend re-scan at closer range for a more reliable check."
        )
    return notes


def run_compliance_check(ocr: OCRResult) -> ComplianceResult:
    decl = extract_declarations(ocr.raw_text)

    violations = _check_presence(decl)
    violations += _check_format(decl)
    readability_notes = _check_readability(ocr)

    # Score: start at 100, subtract weighted penalties per violation.
    weights = {"critical": 20, "major": 10, "minor": 4}
    score = 100.0
    for v in violations:
        score -= weights.get(v.severity, 5)
    if readability_notes:
        score -= 5 * len(readability_notes)
    score = max(0.0, min(100.0, round(score, 1)))

    critical_present = any(v.severity == "critical" for v in violations)
    if critical_present or score < 60:
        status = "non_compliant"
    elif violations or readability_notes:
        status = "needs_review"
    else:
        status = "compliant"

    return ComplianceResult(
        declarations=decl,
        violations=violations,
        score=score,
        status=status,
        readability_notes=readability_notes,
    )
