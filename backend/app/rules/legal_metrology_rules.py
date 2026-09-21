"""
Rule definitions distilled from the Legal Metrology (Packaged Commodities)
Rules, 2011 (as amended). This is a simplified, codified subset suitable for
an automated first-pass screening tool -- it is NOT a substitute for a
Legal Metrology officer's judgement, and every "non_compliant" verdict should
still be reviewed by a human inspector before enforcement action.

Reference: Ministry of Consumer Affairs, Food & Public Distribution,
Department of Consumer Affairs -- https://consumeraffairs.gov.in

Each rule below maps to a mandatory declaration under Rule 6 (declarations
on every package) plus supporting rules on numerals/lettering size (Rule 8)
and consumer-care particulars (Rule 6(1)(e)).
"""

RULES = {
    "LM-R6-1a": {
        "field": "manufacturer_name",
        "description": "Name & address of the manufacturer/packer/importer (Rule 6(1)(a))",
        "severity": "critical",
    },
    "LM-R6-1a-addr": {
        "field": "manufacturer_address",
        "description": "Complete address of the manufacturer/packer/importer (Rule 6(1)(a))",
        "severity": "critical",
    },
    "LM-R6-1b": {
        "field": "net_quantity",
        "description": "Net quantity in standard units (weight/volume/number) (Rule 6(1)(b))",
        "severity": "critical",
    },
    "LM-R6-1c": {
        "field": "mfg_date",
        "description": "Month & year of manufacture/packing/import (Rule 6(1)(c))",
        "severity": "major",
    },
    "LM-R6-1d": {
        "field": "mrp",
        "description": "Maximum Retail Price inclusive of all taxes, MRP Rs. ___ (Rule 6(1)(d))",
        "severity": "critical",
    },
    "LM-R6-1e": {
        "field": "consumer_care",
        "description": "Name, address, telephone/email of consumer care / customer support (Rule 6(1)(e))",
        "severity": "major",
    },
    "LM-R6-1f": {
        "field": "country_of_origin",
        "description": "Country of origin/manufacture/assembly for imported packages (Rule 6(1)(f) / Rule 27)",
        "severity": "minor",
    },
}

# Regex patterns used to *find* candidate declarations inside raw OCR text.
# These are intentionally permissive (favouring recall) -- the compliance
# engine then screens what is captured against format rules.
EXTRACTION_PATTERNS = {
    "mrp": [
        r"(?:m\.?\s*r\.?\s*p\.?|max(?:imum)?\s*retail\s*price)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:[.,][0-9]+)?)",
    ],
    "net_quantity": [
        r"(?:net\s*(?:qty|quantity|wt|weight|vol|volume)?)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:g|gm|gms|grams?|kg|ml|l|litre|litres?|mg|pcs|pieces|n))",
    ],
    "mfg_date": [
        r"(?:mfg|manufactured|packed|packing|mfd)\.?\s*(?:date|dt|on)?\s*[:\-]?\s*((?:[0-3]?[0-9][/\-.])?(?:[0-1]?[0-9]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[/\-.\s]\d{2,4})",
    ],
    "consumer_care": [
        r"(?:consumer\s*care|customer\s*care|customer\s*support|helpline)[^\n]{0,80}?((?:\+?\d[\d\s\-]{7,}\d)|[\w.+-]+@[\w-]+\.[\w.-]+)",
        r"([\w.+-]+@[\w-]+\.[\w.-]+)",
    ],
    "country_of_origin": [
        r"(?:country\s*of\s*origin|made\s*in|origin)\s*[:\-]?\s*([a-zA-Z\s]{3,30})",
    ],
    "manufacturer_name": [
        r"(?:manufactured\s*by|marketed\s*by|packed\s*by|mfg\.?\s*by|imported\s*by)\s*[:\-]?\s*([A-Za-z0-9&.,\s]{3,60})",
    ],
}
