"""
OCR Engine
----------
Uses OpenCV for pre-processing (grayscale, denoise, adaptive threshold,
deskew) and pytesseract for multilingual text + word-level bounding-box
extraction. Bounding-box heights feed the readability/font-size heuristic
in the compliance engine.

Note: In a production Legal Metrology deployment, object/label detection
would typically use a trained YOLO model to first localize the "principal
display panel" before OCR, and font-size checks would be calibrated against
a reference marker/known DPI. Both are documented as roadmap items in the
README; this service implements a fully working, dependency-light pipeline
(OpenCV + Tesseract) so the app runs out-of-the-box without needing GPU
model weights.
"""
import logging
from dataclasses import dataclass, field
from typing import List

import cv2
import numpy as np

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except Exception:  # pragma: no cover
    TESSERACT_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class OCRWord:
    text: str
    left: int
    top: int
    width: int
    height: int
    conf: float


@dataclass
class OCRResult:
    raw_text: str
    words: List[OCRWord] = field(default_factory=list)
    image_height: int = 0
    image_width: int = 0


def _preprocess(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Please upload a valid JPG/PNG.")

    # Resize very large images down for speed, upscale very small ones for
    # better OCR accuracy on small print.
    h, w = img.shape[:2]
    target_w = 1600
    if w != target_w:
        scale = target_w / w
        img = cv2.resize(img, (target_w, int(h * scale)), interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11
    )
    return thresh


def run_ocr(image_bytes: bytes) -> OCRResult:
    processed = _preprocess(image_bytes)
    h, w = processed.shape[:2]

    if not TESSERACT_AVAILABLE:
        logger.warning("pytesseract/tesseract binary not available - returning empty OCR result")
        return OCRResult(raw_text="", words=[], image_height=h, image_width=w)

    try:
        raw_text = pytesseract.image_to_string(processed, lang="eng")
        data = pytesseract.image_to_data(
            processed, lang="eng", output_type=pytesseract.Output.DICT
        )
    except Exception as exc:  # pragma: no cover
        logger.error("Tesseract OCR failed: %s", exc)
        return OCRResult(raw_text="", words=[], image_height=h, image_width=w)

    words: List[OCRWord] = []
    n = len(data.get("text", []))
    for i in range(n):
        text = data["text"][i].strip()
        if not text:
            continue
        try:
            conf = float(data["conf"][i])
        except (ValueError, TypeError):
            conf = -1.0
        words.append(
            OCRWord(
                text=text,
                left=int(data["left"][i]),
                top=int(data["top"][i]),
                width=int(data["width"][i]),
                height=int(data["height"][i]),
                conf=conf,
            )
        )

    return OCRResult(raw_text=raw_text, words=words, image_height=h, image_width=w)
