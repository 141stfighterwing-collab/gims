#!/usr/bin/env python3
"""
GIMS Technical Architecture PDF Report Generator
Generates a comprehensive PDF document for the Geopolitical Intelligence Monitoring System.
"""

import os
import subprocess
import sys
import json
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate, NextPageTemplate
from reportlab.platypus.frames import Frame
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfgen import canvas

from pypdf import PdfWriter, PdfReader

# ─────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────

OUTPUT_DIR = "/home/z/my-project/download"
COVER_HTML = os.path.join(OUTPUT_DIR, "gims_cover.html")
COVER_PDF = os.path.join(OUTPUT_DIR, "gims_cover.pdf")
BODY_PDF = os.path.join(OUTPUT_DIR, "gims_body.pdf")
FINAL_PDF = os.path.join(OUTPUT_DIR, "GIMS_Technical_Architecture.pdf")
HTML2POSTER = "/home/z/my-project/skills/pdf/scripts/html2poster.js"

PAGE_W, PAGE_H = A4  # 595.27 x 841.89 points

# Colors
ACCENT = HexColor('#ce2d48')
TEXT_PRIMARY = HexColor('#1d1f20')
TEXT_MUTED = HexColor('#7b8188')
BG_SURFACE = HexColor('#d3d9e0')
BG_PAGE = HexColor('#ebeef0')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ─────────────────────────────────────────────────
# Font Registration
# ─────────────────────────────────────────────────

pdfmetrics.registerFont(TTFont('TimesNewRoman', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRoman-Bold', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRoman-Italic', '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRoman-BoldItalic', '/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Calibri-Bold', '/usr/share/fonts/truetype/english/Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SimHei-Bold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))

registerFontFamily('TimesNewRoman', normal='TimesNewRoman', bold='TimesNewRoman-Bold',
                   italic='TimesNewRoman-Italic', boldItalic='TimesNewRoman-BoldItalic')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri-Bold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans-Bold')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei-Bold')

FONT_BODY = 'TimesNewRoman'
FONT_HEADING = 'TimesNewRoman'
FONT_MONO = 'DejaVuSans'

# ─────────────────────────────────────────────────
# Styles
# ─────────────────────────────────────────────────

styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    'GIMSTitle', parent=styles['Title'],
    fontName=f'{FONT_HEADING}-Bold', fontSize=26, leading=32,
    textColor=ACCENT, spaceAfter=12, alignment=TA_CENTER
)

style_h1 = ParagraphStyle(
    'GIMSH1', parent=styles['Heading1'],
    fontName=f'{FONT_HEADING}-Bold', fontSize=18, leading=24,
    textColor=ACCENT, spaceBefore=20, spaceAfter=10,
    borderPadding=(0, 0, 4, 0)
)

style_h2 = ParagraphStyle(
    'GIMSH2', parent=styles['Heading2'],
    fontName=f'{FONT_HEADING}-Bold', fontSize=14, leading=18,
    textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8
)

style_h3 = ParagraphStyle(
    'GIMSH3', parent=styles['Heading3'],
    fontName=f'{FONT_HEADING}-Bold', fontSize=12, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6
)

style_body = ParagraphStyle(
    'GIMSBody', parent=styles['Normal'],
    fontName=FONT_BODY, fontSize=10.5, leading=15,
    textColor=TEXT_PRIMARY, spaceAfter=8, alignment=TA_JUSTIFY,
    firstLineIndent=0
)

style_body_indent = ParagraphStyle(
    'GIMSBodyIndent', parent=style_body,
    leftIndent=18, firstLineIndent=0
)

style_bullet = ParagraphStyle(
    'GIMSBullet', parent=style_body,
    leftIndent=28, bulletIndent=14, spaceAfter=4,
    bulletFontName=FONT_BODY, bulletFontSize=10.5
)

style_code = ParagraphStyle(
    'GIMSCode', parent=style_body,
    fontName=FONT_MONO, fontSize=9, leading=13,
    backColor=BG_SURFACE, borderPadding=8,
    leftIndent=18, rightIndent=18, spaceBefore=8, spaceAfter=8
)

style_formula = ParagraphStyle(
    'GIMSFormula', parent=style_body,
    fontName=FONT_BODY, fontSize=11, leading=16,
    alignment=TA_CENTER, spaceBefore=8, spaceAfter=8,
    backColor=BG_SURFACE, borderPadding=10,
    leftIndent=36, rightIndent=36
)

style_cell = ParagraphStyle(
    'GIMSCell', parent=style_body,
    fontSize=9, leading=12, spaceAfter=2, spaceBefore=2
)

style_cell_header = ParagraphStyle(
    'GIMSCellHeader', parent=style_cell,
    fontName=f'{FONT_HEADING}-Bold', fontSize=9, leading=12,
    textColor=TABLE_HEADER_TEXT
)

style_caption = ParagraphStyle(
    'GIMSCaption', parent=style_body,
    fontSize=9, leading=12, textColor=TEXT_MUTED,
    alignment=TA_CENTER, spaceBefore=4, spaceAfter=10
)

style_toc_h1 = ParagraphStyle(
    'TOCH1', fontName=f'{FONT_HEADING}-Bold', fontSize=12, leading=20,
    leftIndent=20, textColor=ACCENT
)

style_toc_h2 = ParagraphStyle(
    'TOCH2', fontName=FONT_BODY, fontSize=10.5, leading=18,
    leftIndent=40, textColor=TEXT_PRIMARY
)


# ─────────────────────────────────────────────────
# Utility Functions
# ─────────────────────────────────────────────────

def safe_keep_together(elements):
    """Wrap elements in KeepTogether to prevent orphaned content."""
    if len(elements) == 1:
        return elements[0]
    return KeepTogether(elements)


def P(text, style=None):
    """Shorthand for Paragraph."""
    return Paragraph(text, style or style_body)


def bullet(text):
    """Create a bullet point paragraph."""
    return Paragraph(f"<bullet>&bull;</bullet> {text}", style_bullet)


def hrule():
    """Create a horizontal rule."""
    return HRFlowable(width="100%", thickness=1, color=BG_SURFACE,
                       spaceBefore=6, spaceAfter=6)


def make_table(data, col_widths=None, has_header=True):
    """Create a styled table from data (list of lists of Paragraph objects)."""
    if col_widths is None:
        avail_w = PAGE_W - 2 * inch
        n_cols = len(data[0]) if data else 1
        col_widths = [avail_w / n_cols] * n_cols

    t = Table(data, colWidths=col_widths, repeatRows=1 if has_header else 0)
    style_cmds = [
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#c0c4c8')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ]

    if has_header:
        style_cmds.extend([
            ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ])
        # Alternate row colors
        for i in range(1, len(data)):
            bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    t.hAlign = 'CENTER'
    return t


def header_cell(text):
    return Paragraph(text, style_cell_header)


def cell(text):
    return Paragraph(text, style_cell)


# ─────────────────────────────────────────────────
# TocDocTemplate (for clickable TOC)
# ─────────────────────────────────────────────────

class TocDocTemplate(BaseDocTemplate):
    """Custom DocTemplate that supports Table of Contents with clickable links."""

    def __init__(self, filename, **kwargs):
        BaseDocTemplate.__init__(self, filename, **kwargs)
        self.page_count = 0

        frame = Frame(
            inch, inch,
            PAGE_W - 2 * inch, PAGE_H - 2 * inch,
            id='normal'
        )
        template = PageTemplate(id='body', frames=frame, onPage=self._footer)
        self.addPageTemplates([template])

    def _footer(self, canvas_obj, doc):
        """Add page number footer."""
        canvas_obj.saveState()
        # Page number
        canvas_obj.setFont(FONT_BODY, 9)
        canvas_obj.setFillColor(TEXT_MUTED)
        page_num = canvas_obj.getPageNumber()
        text = f"Page {page_num}"
        canvas_obj.drawCentredString(PAGE_W / 2, 0.5 * inch, text)
        # Header line
        canvas_obj.setStrokeColor(ACCENT)
        canvas_obj.setLineWidth(0.5)
        canvas_obj.line(inch, PAGE_H - 0.75 * inch, PAGE_W - inch, PAGE_H - 0.75 * inch)
        # Header text
        canvas_obj.setFont(FONT_BODY, 8)
        canvas_obj.setFillColor(TEXT_MUTED)
        canvas_obj.drawString(inch, PAGE_H - 0.7 * inch, "GIMS Technical Architecture")
        canvas_obj.drawRightString(PAGE_W - inch, PAGE_H - 0.7 * inch, "CONFIDENTIAL")
        canvas_obj.restoreState()

    def afterFlowable(self, flowable):
        """Register TOC entries."""
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            text = flowable.getPlainText()
            if style == 'GIMSH1':
                key = f'h1_{self.seq.nextf("heading1")}'
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (0, text, self.page, key))
            elif style == 'GIMSH2':
                key = f'h2_{self.seq.nextf("heading2")}'
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (1, text, self.page, key))


# ─────────────────────────────────────────────────
# Cover Page HTML
# ─────────────────────────────────────────────────

def generate_cover_html():
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 794px; height: 1123px;
    background: #ebeef0;
    font-family: 'Times New Roman', Georgia, serif;
    overflow: hidden;
  }
  .cover {
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 80px 60px;
    position: relative;
  }
  .top-bar {
    position: absolute; top: 0; left: 0; right: 0;
    height: 8px; background: #ce2d48;
  }
  .bottom-bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 8px; background: #ce2d48;
  }
  .accent-line {
    width: 200px; height: 3px;
    background: #ce2d48;
    margin: 24px auto;
  }
  .logo-area {
    font-size: 14px;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: #7b8188;
    margin-bottom: 40px;
  }
  .title {
    font-size: 36px;
    font-weight: bold;
    color: #1d1f20;
    text-align: center;
    line-height: 1.3;
    margin-bottom: 10px;
  }
  .title-accent {
    font-size: 38px;
    font-weight: bold;
    color: #ce2d48;
    text-align: center;
    line-height: 1.3;
    margin-bottom: 10px;
  }
  .subtitle {
    font-size: 18px;
    color: #7b8188;
    text-align: center;
    margin-top: 16px;
    line-height: 1.5;
  }
  .meta-box {
    margin-top: 60px;
    background: #d3d9e0;
    padding: 20px 50px;
    border-radius: 4px;
    text-align: center;
  }
  .meta-box p {
    font-size: 13px;
    color: #1d1f20;
    margin: 4px 0;
  }
  .meta-label {
    color: #7b8188;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .classification {
    position: absolute;
    bottom: 30px;
    left: 0; right: 0;
    text-align: center;
    font-size: 12px;
    color: #7b8188;
    letter-spacing: 3px;
    text-transform: uppercase;
  }
  .decorative-square {
    position: absolute;
    width: 120px; height: 120px;
    border: 2px solid #ce2d48;
    opacity: 0.15;
  }
  .sq1 { top: 60px; left: 60px; }
  .sq2 { bottom: 60px; right: 60px; }
</style>
</head>
<body>
<div class="cover">
  <div class="top-bar"></div>
  <div class="bottom-bar"></div>
  <div class="decorative-square sq1"></div>
  <div class="decorative-square sq2"></div>

  <div class="logo-area">Intelligence Division</div>

  <div class="title-accent">Global Intelligence</div>
  <div class="title">Monitoring System</div>
  <div class="accent-line"></div>
  <div class="subtitle">(GIMS)<br>Technical Architecture &amp; Strategic Intelligence Platform</div>

  <div class="meta-box">
    <p class="meta-label">Document Date</p>
    <p><strong>May 2026</strong></p>
    <p style="margin-top:10px;" class="meta-label">Version</p>
    <p><strong>1.0 — Final Release</strong></p>
  </div>

  <div class="classification">Unclassified // For Official Use Only</div>
</div>
</body>
</html>"""
    with open(COVER_HTML, 'w') as f:
        f.write(html_content)
    print(f"Cover HTML written: {COVER_HTML}")


def render_cover_pdf():
    """Render cover HTML to PDF using html2poster.js + pypdf resize to A4."""
    # Render HTML to PDF at poster size
    result = subprocess.run(
        ['node', HTML2POSTER, COVER_HTML, '--output', COVER_PDF, '--width', '794px'],
        capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0:
        print(f"html2poster stderr: {result.stderr}")
        raise RuntimeError(f"html2poster.js failed: {result.stderr}")

    # Resize cover to A4 using pypdf
    reader = PdfReader(COVER_PDF)
    writer = PdfWriter()
    for page in reader.pages:
        page.scale_to(PAGE_W, PAGE_H)
        page.mediabox.upper_right = (PAGE_W, PAGE_H)
        writer.add_page(page)
    with open(COVER_PDF, 'wb') as f:
        writer.write(f)
    print(f"Cover PDF rendered: {COVER_PDF}")


# ─────────────────────────────────────────────────
# Section Content Builders
# ─────────────────────────────────────────────────

def build_toc():
    """Table of Contents section."""
    toc = TableOfContents()
    toc.levelStyles = [style_toc_h1, style_toc_h2]
    return [Spacer(1, 12), P("TABLE OF CONTENTS", style_h1), Spacer(1, 12), toc]


def build_executive_summary():
    """Section 1: Executive Summary (200+ words)."""
    elements = []
    elements.append(P("1. EXECUTIVE SUMMARY", style_h1))
    elements.append(hrule())

    elements.append(P(
        "The Global Intelligence Monitoring System (GIMS) is a comprehensive, enterprise-grade platform "
        "designed for the continuous monitoring, analysis, and forecasting of geopolitical shifts, warfare "
        "technology developments, military procurement activities, and conflict indicators across the globe. "
        "In an era characterized by rapid technological advancement and increasingly complex international "
        "security dynamics, the need for an automated, systematic approach to intelligence gathering and "
        "analysis has never been more critical. GIMS addresses this need by providing decision-makers with "
        "timely, structured, and actionable intelligence products derived from open-source information."
    ))

    elements.append(P(
        "At its core, GIMS ingests news articles, press releases, government announcements, and defense "
        "industry publications from a diverse array of sources spanning multiple languages and regions. The "
        "system processes these raw information feeds through a sophisticated rule-based processing engine — "
        "deliberately designed without dependency on artificial intelligence or machine learning for core "
        "analytical functions, ensuring deterministic, auditable, and explainable outputs. This architectural "
        "decision reflects a commitment to operational transparency and reproducibility, which are paramount "
        "in intelligence analysis contexts where users must understand exactly how a conclusion was reached."
    ))

    elements.append(P(
        "The platform produces several key intelligence outputs: scored geopolitical risk indices (each on a "
        "0-100 scale) that quantify tension levels, technology acceleration, contract activity, regional conflict "
        "risk, and strategic surprise probability; short-term forecasts generated through moving averages, "
        "exponential smoothing, and Bayesian updating frameworks; and daily intelligence briefs that synthesize "
        "the most significant developments into concise, decision-ready formats. Each article processed by the "
        "system receives a structured treatment including automated summarization, entity extraction, taxonomy "
        "tagging, and a curated 'Why This Matters' analysis that contextualizes the development within broader "
        "geopolitical trends."
    ))

    elements.append(P(
        "GIMS is architected as a modern distributed system leveraging Python (FastAPI) for its backend API "
        "layer, PostgreSQL with TimescaleDB for time-series data persistence, Redis for caching and message "
        "queuing, Node.js workers for web scraping operations, and a Next.js 16 frontend dashboard featuring "
        "interactive geospatial visualizations. The system is designed for scalability, with the ability to "
        "add new data sources, scoring indices, and forecasting models without disrupting existing operations. "
        "The strategic value of GIMS lies in its capacity to transform the overwhelming volume of open-source "
        "information into structured, quantitative intelligence that supports proactive decision-making rather "
        "than reactive response. By establishing baseline measurements, tracking trends, and identifying "
        "anomalies, GIMS enables analysts to focus their expertise on interpretation and judgment while the "
        "system handles the labor-intensive tasks of collection, classification, and initial scoring."
    ))

    return elements


def build_system_architecture():
    """Section 2: System Architecture Overview (300+ words)."""
    elements = []
    elements.append(P("2. SYSTEM ARCHITECTURE OVERVIEW", style_h1))
    elements.append(hrule())

    elements.append(P(
        "The GIMS platform employs a modular, microservices-inspired architecture designed for high "
        "availability, horizontal scalability, and clear separation of concerns. The system is composed "
        "of seven primary layers, each responsible for a distinct stage of the intelligence processing "
        "pipeline. This layered approach enables independent scaling, testing, and deployment of each "
        "component, reducing operational risk and facilitating rapid iteration as requirements evolve. "
        "The architecture is optimized for processing thousands of articles per day while maintaining "
        "sub-second response times for API queries and real-time dashboard updates."
    ))

    elements.append(P("2.1 Architecture Diagram", style_h2))
    elements.append(P(
        "The following diagram illustrates the end-to-end data flow through the GIMS platform, "
        "from initial data ingestion through to the frontend visualization layer:"
    ))
    elements.append(P(
        "[Data Sources] → [Ingestion Pipeline] → [Processing Engine] → [Scoring Engine] → "
        "[Forecasting Engine] → [API Layer] → [Frontend Dashboard]",
        style_code
    ))
    elements.append(P("Figure 2.1: GIMS High-Level Data Flow Architecture", style_caption))

    elements.append(P(
        "Each layer communicates through well-defined interfaces. The Ingestion Pipeline publishes raw "
        "articles to a Redis message queue, which the Processing Engine consumes asynchronously. Processed "
        "and enriched articles are persisted to PostgreSQL, while index scores and forecasts are stored in "
        "TimescaleDB hypertables for efficient time-series querying. The API Layer serves as the single "
        "entry point for the Frontend Dashboard, providing RESTful endpoints and WebSocket connections "
        "for real-time data push."
    ))

    elements.append(P("2.2 Technology Stack & Rationale", style_h2))
    elements.append(P(
        "The technology choices for each component were driven by requirements for reliability, developer "
        "productivity, ecosystem maturity, and operational cost efficiency. The following table details "
        "each major component, its technology selection, and the strategic rationale behind that choice. "
        "Where applicable, alternatives were evaluated and the selected technology was chosen based on "
        "superior performance characteristics or alignment with existing organizational capabilities."
    ))

    # Components table
    avail_w = PAGE_W - 2 * inch
    comp_data = [
        [header_cell("Component"), header_cell("Technology"), header_cell("Version"), header_cell("Rationale")],
        [cell("Backend API"), cell("Python / FastAPI"), cell("3.12 / 0.115+"),
         cell("High performance async framework with automatic OpenAPI documentation, "
              "native async support for I/O-bound operations, and extensive middleware ecosystem.")],
        [cell("Web Scraping Workers"), cell("Node.js / Puppeteer"), cell("20 LTS"),
         cell("Native headless Chrome control for JavaScript-heavy defense news sites. "
              "Puppeteer provides reliable DOM manipulation and screenshot capabilities.")],
        [cell("Primary Database"), cell("PostgreSQL + TimescaleDB"), cell("16 / 2.x"),
         cell("ACID compliance for data integrity. TimescaleDB extension provides native time-series "
              "optimizations including automatic partitioning, continuous aggregates, and data retention.")],
        [cell("Cache & Message Queue"), cell("Redis + BullMQ"), cell("7.2 / 5.x"),
         cell("In-memory caching for frequently accessed index values (sub-millisecond reads). "
              "BullMQ provides reliable job scheduling with dead-letter queues and retry logic.")],
        [cell("Frontend Dashboard"), cell("Next.js 16 + Deck.gl"), cell("16 / 9.x"),
         cell("Server components for fast initial loads. Deck.gl provides GPU-accelerated geospatial "
              "rendering for the interactive world map with region risk heat overlays.")],
        [cell("API Gateway"), cell("Kong / Nginx"), cell("3.x"),
         cell("Rate limiting, JWT authentication, request logging, and API versioning. "
              "Kong provides plugin-based architecture for security policies.")],
        [cell("Monitoring"), cell("Prometheus + Grafana"), cell("2.x / 11.x"),
         cell("Time-series metrics collection with pre-built dashboards for system health, "
              "pipeline throughput, index computation latency, and error rate tracking.")],
    ]
    comp_widths = [avail_w*0.17, avail_w*0.20, avail_w*0.10, avail_w*0.53]
    elements.append(make_table(comp_data, comp_widths))
    elements.append(P("Table 2.1: GIMS Technology Stack Components", style_caption))

    elements.append(P(
        "The system is designed to be deployment-agnostic, with containerization via Docker and "
        "orchestration via Kubernetes for production environments. During initial development phases, "
        "a simplified deployment on AWS EC2 instances with managed RDS and ElastiCache services is "
        "used to minimize infrastructure complexity while maintaining the ability to scale horizontally "
        "as data volume grows. The expected throughput target is 5,000+ articles per day with index "
        "score updates every 15 minutes and API response times under 200 milliseconds at the 95th "
        "percentile. All inter-service communication uses Redis pub/sub for event-driven updates, "
        "ensuring that the dashboard reflects changes in index scores within seconds of computation."
    ))

    return elements


def build_data_ingestion():
    """Section 3: Data Ingestion Layer (400+ words)."""
    elements = []
    elements.append(P("3. DATA INGESTION LAYER", style_h1))
    elements.append(hrule())

    elements.append(P(
        "The Data Ingestion Layer is the foundation of the GIMS platform, responsible for continuously "
        "collecting raw information from a diverse set of open-source intelligence (OSINT) feeds. This "
        "layer must operate reliably 24/7, handling varying update frequencies from real-time news wires "
        "to daily publication cycles. The design prioritizes fault tolerance, deduplication, and "
        "comprehensive source coverage across defense, geopolitics, technology, and conflict monitoring "
        "domains. Each ingestion method is described in detail below, along with specific source examples "
        "and the technical approach used for each."
    ))

    elements.append(P("3.1 RSS Feed Aggregation", style_h2))
    elements.append(P(
        "RSS feeds remain one of the most reliable and structured methods for ingesting regularly "
        "published news content. GIMS maintains a curated list of over 50 RSS feeds covering defense, "
        "geopolitics, technology, and conflict reporting. Each feed is polled at configurable intervals "
        "ranging from every 5 minutes for breaking news sources to every 30 minutes for daily publications. "
        "The RSS aggregator normalizes feed formats (RSS 2.0, Atom, RDF) into a unified internal schema "
        "and extracts metadata including publication timestamp, author, source domain, and category tags. "
        "The following sources represent the primary RSS feeds monitored by the system:"
    ))
    sources = [
        "<b>Reuters Defense News</b> — Real-time defense and military coverage from Reuters wire service",
        "<b>Jane's Defence Weekly</b> — In-depth analysis of defense technology and military capabilities",
        "<b>Defense News</b> — Breaking defense industry news, procurement announcements, and policy updates",
        "<b>Breaking Defense</b> — US defense policy, Pentagon developments, and congressional defense activity",
        "<b>The Diplomat</b> — Asia-Pacific security analysis, regional conflict monitoring, and diplomacy coverage",
        "<b>Military.com</b> — Broad military news including personnel, operations, and technology developments",
        "<b>Arms Control Wonk</b> — Nuclear proliferation, arms control treaties, and WMD monitoring",
        "<b>South China Morning Post (Tech section)</b> — Chinese technology developments with defense implications",
    ]
    for s in sources:
        elements.append(bullet(s))

    elements.append(P("3.2 API Integration", style_h2))
    elements.append(P(
        "Beyond RSS feeds, GIMS integrates with several specialized APIs that provide structured data "
        "not available through traditional news feeds. These APIs offer event data, conflict records, "
        "and media monitoring capabilities that complement the article-based ingestion pipeline. Each "
        "API integration is implemented as a dedicated module with its own rate limiting, error handling, "
        "and data transformation logic. The three primary API integrations are as follows:"
    ))
    elements.append(P(
        "<b>NewsAPI.org</b> — Provides access to articles from over 30,000 sources worldwide with keyword-based "
        "search capabilities. GIMS queries NewsAPI every 15 minutes with targeted queries for defense, "
        "geopolitical, and conflict-related keywords. Results are deduplicated against the RSS ingestion "
        "pipeline to avoid processing the same article twice. The API returns structured metadata including "
        "source credibility scores and publication timestamps."
    ))
    elements.append(P(
        "<b>GDELT Project API</b> — The Global Database of Events, Language, and Tone monitors news media "
        "worldwide in real-time, coding events into the CAMEO (Conflict and Mediation Event Observations) "
        "framework. GIMS consumes GDELT's event stream to supplement article-based processing with structured "
        "event data, enabling cross-referencing between narrative reporting and coded event records. This "
        "provides a valuable validation layer for conflict event detection."
    ))
    elements.append(P(
        "<b>ACLED Conflict Data API</b> — The Armed Conflict Location & Event Data Project provides "
        "granular, geolocated records of political violence and protest events across the developing world. "
        "ACLED data is ingested daily and used primarily as input for the Regional Conflict Risk Index, "
        "providing ground-truth event counts, casualty figures, and actor identification for regions "
        "where traditional media coverage may be limited or biased."
    ))

    elements.append(P("3.3 Web Scraping Pipeline", style_h2))
    elements.append(P(
        "Many high-value defense news sources do not provide RSS feeds or API access, requiring GIMS "
        "to employ targeted web scraping to collect their content. The scraping pipeline uses Puppeteer "
        "(Node.js) for sites that require JavaScript rendering and a simpler HTTP-based scraper (Python "
        "requests + BeautifulSoup) for static content sites. Each scraper is configured with site-specific "
        "selectors, rate limiting parameters, and anti-detection measures including randomized user agents, "
        "request throttling, and proxy rotation. Scraped content is normalized into the same internal schema "
        "used by RSS and API ingestion, ensuring consistent downstream processing regardless of collection method."
    ))

    elements.append(P("3.4 Entity Extraction Schema", style_h2))
    elements.append(P(
        "Every article processed by GIMS undergoes entity extraction to identify and classify key "
        "elements mentioned in the text. The extraction is performed using a combination of dictionary "
        "lookup, regular expression matching, and geocoding services. No machine learning models are used "
        "in this process — all extraction is rule-based and deterministic. The following table defines "
        "the entity types recognized by the system, along with examples and the extraction methodology "
        "applied to each type."
    ))

    avail_w = PAGE_W - 2 * inch
    entity_data = [
        [header_cell("Entity Type"), header_cell("Examples"), header_cell("Extraction Method")],
        [cell("Countries"), cell("USA, China, Russia, Iran, North Korea"), cell("Named Entity Dictionary with ISO 3166-1 alpha-3 code mapping")],
        [cell("Military Actors"), cell("Pentagon, DARPA, PLA, IRGC, NATO"), cell("Military Organization Dictionary (2,500+ entries)")],
        [cell("Weapons Systems"), cell("Tomahawk, JASSM, Hypersonic Glide Vehicle"), cell("Weapons Database Lookup (5,000+ systems with variants)")],
        [cell("Technologies"), cell("Directed Energy, AI, Drones, Quantum"), cell("Technology Keyword Dictionary with category classification")],
        [cell("Dollar Amounts"), cell("$1.2B, 500 million, \u00a32.3 billion"), cell("Regex Pattern Matching with currency normalization to USD")],
        [cell("Locations"), cell("Strait of Hormuz, South China Sea, Taiwan"), cell("GeoDictionary + Nominatim Geocoding API for coordinates")],
        [cell("Contract Types"), cell("Procurement, R&D, FMS, Sole-Source"), cell("Contract Keyword Matching against 200+ pattern phrases")],
        [cell("Conflict Events"), cell("Strike, Sanction, Deployment, Exercise"), cell("Event Verb Dictionary with CAMEO code mapping")],
    ]
    entity_widths = [avail_w*0.18, avail_w*0.37, avail_w*0.45]
    elements.append(make_table(entity_data, entity_widths))
    elements.append(P("Table 3.1: Entity Extraction Schema", style_caption))

    elements.append(P("3.5 Data Quality & Deduplication", style_h2))
    elements.append(P(
        "Given the high volume of ingested content and the likelihood of the same article being picked "
        "up by multiple sources, GIMS implements a multi-layer deduplication strategy. Each article is "
        "assigned a content fingerprint using a combination of SimHash (for near-duplicate detection) "
        "and a title-based SHA-256 hash (for exact duplicate detection). Articles are considered duplicates "
        "if their SimHash distance is below a configurable threshold (default: 3 bits out of 64) or if "
        "their title hashes match exactly. When duplicates are detected, the earliest-ingested version is "
        "retained as the canonical record, with subsequent versions linked as duplicates for reference. "
        "Additionally, a source reliability score is maintained for each feed, and articles from low-reliability "
        "sources are flagged for manual review before being included in index calculations. This approach "
        "ensures that the system's intelligence products are based on the highest-quality available information "
        "while maintaining comprehensive source coverage for situational awareness."
    ))

    return elements


def build_article_processing():
    """Section 4: Article Processing & Tagging (300+ words)."""
    elements = []
    elements.append(P("4. ARTICLE PROCESSING & TAGGING", style_h1))
    elements.append(hrule())

    elements.append(P(
        "Once articles are ingested and deduplicated, they enter the Article Processing & Tagging pipeline. "
        "This stage applies a series of rule-based transformations to extract structured intelligence from "
        "unstructured text. The processing pipeline operates on each article independently, producing a "
        "standardized set of outputs: a concise summary, a contextual analysis explaining why the article "
        "matters, and a comprehensive set of classification tags. Each processing step is deterministic "
        "and fully auditable, allowing analysts to trace any output back to the specific rules and inputs "
        "that produced it."
    ))

    elements.append(P("4.1 Summary Generation", style_h2))
    elements.append(P(
        "GIMS generates article summaries using a purely extractive, rule-based approach rather than "
        "abstractive methods that might introduce factual inaccuracies or hallucinated content. The "
        "summarization algorithm works in three stages. First, it identifies the lead sentence (typically "
        "the first sentence of the article, which in journalistic writing contains the most critical "
        "information). Second, it computes word frequency across the article body, excluding stop words, "
        "and scores each sentence based on the aggregate frequency of its constituent words. Third, it "
        "selects the top 3-5 sentences that maximize information coverage while minimizing redundancy, "
        "measured by Jaccard similarity between candidate sentences. The result is a concise 3-5 sentence "
        "summary that faithfully represents the article's key claims without introducing any externally "
        "generated content. This approach was chosen specifically for the intelligence context, where "
        "accuracy and traceability are more important than readability optimization."
    ))

    elements.append(P("4.2 'Why This Matters' Analysis", style_h2))
    elements.append(P(
        "Beyond factual summarization, GIMS generates a contextual analysis for each article that explains "
        "its strategic significance. This analysis is produced using a template-based system that evaluates "
        "the article's extracted entities and tags against predefined analysis frameworks. The system "
        "identifies the primary significance dimension (geopolitical impact, military significance, or "
        "economic implications) based on tag prevalence and generates context-appropriate analysis text "
        "using sentence templates populated with extracted entity names, dollar amounts, and geographic "
        "references. For example, an article about a major missile procurement contract would trigger "
        "the military significance template, which includes fields for contract value, contractor names, "
        "weapons system types, and strategic implications. The template system currently supports 12 "
        "primary significance dimensions with over 80 sentence templates, providing substantial variation "
        "in output to avoid repetitive language across similar articles."
    ))

    elements.append(P("4.3 Tagging Taxonomy", style_h2))
    elements.append(P(
        "Each processed article receives a comprehensive set of classification tags drawn from a structured "
        "taxonomy. Tags serve as the primary mechanism for filtering, searching, and aggregating articles "
        "across the platform. The taxonomy is organized into five primary categories, each with multiple "
        "sub-tags. Tags are assigned based on keyword triggers, entity matches, and contextual rules. "
        "The following table presents the complete tagging taxonomy with trigger keywords for each tag:"
    ))

    avail_w = PAGE_W - 2 * inch
    tag_data = [
        [header_cell("Tag Category"), header_cell("Tags"), header_cell("Trigger Keywords")],
        [cell("Warfare Technology"), cell("Missiles, Drones, Cyber, Lasers, Hypersonics, EW, Autonomous"),
         cell("missile, drone, cyber, laser, hypersonic, electronic warfare, autonomous")],
        [cell("Military Contracts"), cell("Major Procurement, R&D, Foreign Military Sales, Sole-Source"),
         cell("contract, procure, billion, buy, FMS, R&D, awarded, defense spending")],
        [cell("Regional Conflicts"), cell("Middle East, Indo-Pacific, Eastern Europe, Africa, South Asia"),
         cell("specific country pairs + conflict verbs: clash, attack, deployment, escalation")],
        [cell("Iran-Related"), cell("Nuclear, Proxy, Sanctions, Strait of Hormuz, JCPOA"),
         cell("Iran + nuclear/sanction/proxy/Hormuz/JCPOA/IAEA/enrichment")],
        [cell("Emerging Tech"), cell("AI, Quantum, Autonomous, Space, Biotech, Directed Energy"),
         cell("AI, quantum, autonomous, space, biotech, directed energy, breakthrough")],
    ]
    tag_widths = [avail_w*0.18, avail_w*0.35, avail_w*0.47]
    elements.append(make_table(tag_data, tag_widths))
    elements.append(P("Table 4.1: Tagging Taxonomy with Trigger Keywords", style_caption))

    return elements


def _build_index_section(num, title, description, signals, decay_lambda, half_life_days, extra_content=None):
    """Helper to build an index subsection (5.1-5.5)."""
    elements = []
    elements.append(P(f"5.{num} {title}", style_h2))

    # Description
    elements.append(P(description))

    # Input signals table
    elements.append(P(f"<b>Input Signals for {title}</b>", style_h3))
    avail_w = PAGE_W - 2 * inch
    sig_header = [header_cell("Signal"), header_cell("Description"), header_cell("Weight"), header_cell("Source"), header_cell("Update Freq.")]
    sig_rows = [sig_header]
    for sig in signals:
        sig_rows.append([
            cell(sig['name']),
            cell(sig['desc']),
            cell(f"{sig['weight']:.2f}"),
            cell(sig['source']),
            cell(sig['freq']),
        ])
    sig_widths = [avail_w*0.22, avail_w*0.33, avail_w*0.10, avail_w*0.17, avail_w*0.18]
    elements.append(make_table(sig_rows, sig_widths))
    elements.append(P(f"Table 5.{num}.1: Input Signals for {title}", style_caption))

    # Weighting rules
    elements.append(P("<b>Weighting Rules:</b> All signal weights sum to 1.00. Each signal score S"
                      f"<sub>i</sub>(t) is normalized to the range [0, 100] based on historical "
                      "baselines computed over the preceding 90-day window. Signals with no data "
                      "in the current period default to their 30-day trailing average."))

    # Decay formula
    elements.append(P("<b>Decay Factor:</b>", style_h3))
    elements.append(P(f"\u03bb = {decay_lambda} (half-life = {half_life_days} days)", style_formula))
    elements.append(P(
        f"The decay factor \u03bb = {decay_lambda} determines how quickly past signal values lose "
        f"influence on the current index score. A half-life of {half_life_days} days means that a "
        f"signal event's contribution to the index is reduced by 50% after {half_life_days} days, "
        "ensuring that the index reflects recent developments while maintaining short-term continuity."
    ))

    # Update formula
    elements.append(P("<b>Update Formula:</b>", style_h3))
    elements.append(P(
        f"I(t) = \u03bb \u00b7 I(t-1) + (1 - \u03bb) \u00b7 \u03a3<sub>i=1</sub><super>N</super> "
        f"w<sub>i</sub> \u00b7 S<sub>i</sub>(t)",
        style_formula
    ))
    elements.append(P(
        "Where I(t) is the index value at time t, \u03bb is the decay factor, N is the number of "
        "input signals, w<sub>i</sub> is the weight assigned to signal i, and S<sub>i</sub>(t) is "
        "the normalized score for signal i at time t. The formula combines temporal smoothing through "
        "exponential decay with signal aggregation through weighted summation, producing a stable yet "
        "responsive composite indicator.",
        style_body_indent
    ))

    # Threshold table
    elements.append(P("<b>Threshold Classification:</b>", style_h3))
    thresh_data = [
        [header_cell("Level"), header_cell("Score Range"), header_cell("Description")],
        [cell("Low"), cell("0 \u2013 25"), cell("Baseline activity; no significant indicators of escalation or concern")],
        [cell("Elevated"), cell("26 \u2013 50"), cell("Above-normal activity; monitoring increased, situation warrants attention")],
        [cell("High"), cell("51 \u2013 75"), cell("Significant escalation indicators; proactive analysis and briefings required")],
        [cell("Critical"), cell("76 \u2013 100"), cell("Severe indicators; immediate senior leadership notification and response planning")],
    ]
    thresh_widths = [avail_w*0.15, avail_w*0.18, avail_w*0.67]
    elements.append(make_table(thresh_data, thresh_widths))
    elements.append(P(f"Table 5.{num}.2: Threshold Classification for {title}", style_caption))

    if extra_content:
        elements.append(extra_content)

    return elements


def build_scoring_engine():
    """Section 5: Rule-Based Scoring Engine (800+ words total)."""
    elements = []
    elements.append(P("5. RULE-BASED SCORING ENGINE", style_h1))
    elements.append(hrule())

    elements.append(P(
        "The Rule-Based Scoring Engine is the analytical core of the GIMS platform, responsible for "
        "transforming raw article data and extracted entities into quantitative geopolitical risk indices. "
        "Each index is designed to measure a specific dimension of geopolitical or military activity, "
        "providing analysts with a standardized, comparable metric that can be tracked over time and "
        "compared across regions. The scoring engine is entirely rule-based — no machine learning models "
        "are employed in index calculation — ensuring that every output can be traced to specific input "
        "signals and deterministic computation rules. This section provides a detailed specification for "
        "each of the five primary indices, including input signal definitions, weighting schemes, decay "
        "parameters, update formulas, and threshold classifications."
    ))

    elements.append(P(
        "All indices operate on a 0-100 scale, where 0 represents the absence of any relevant activity "
        "and 100 represents the maximum theoretical signal intensity. In practice, most indices operate "
        "in the 10-50 range during normal conditions, with values above 50 representing genuinely elevated "
        "concern levels. The scoring engine updates each index every 15 minutes during active monitoring "
        "periods, incorporating any new signals received since the last computation cycle. The engine "
        "processes signals in chronological order, applying temporal decay to ensure that recent events "
        "carry proportionally more weight than older ones."
    ))

    # ── 5.1 US-Iran Tension Index ──
    elements.extend(_build_index_section(
        num=1,
        title="US-Iran Tension Index (0-100)",
        description=(
            "The US-Iran Tension Index is a composite indicator designed to quantify the current level "
            "of adversarial activity and potential for escalation between the United States and Iran. "
            "This index was selected as one of the five primary indicators due to the historically "
            "disproportionate impact that US-Iran dynamics have on global energy markets, regional "
            "stability in the Middle East, and broader great-power competition. The index synthesizes "
            "seven distinct input signals spanning diplomatic, military, economic, and cyber domains, "
            "providing a holistic view of bilateral tension that no single data source could capture "
            "independently. The index is particularly sensitive to events in the Strait of Hormuz, "
            "through which approximately 20% of global oil transit occurs, making it a critical "
            "early warning indicator for energy security analysis."
        ),
        signals=[
            {"name": "Sanctions Imposed", "desc": "New or expanded sanctions targeting Iranian entities",
             "weight": 0.20, "source": "OFAC, EU Council, UN SC", "freq": "Daily"},
            {"name": "Military Deployments", "desc": "US/coalition military movements near Iranian territory or waters",
             "weight": 0.20, "source": "Reuters, Defense News, CENTCOM", "freq": "Daily"},
            {"name": "Proxy Attack Events", "desc": "Attacks by Iranian-aligned proxy groups (Houthis, Hezbollah, Iraqi militias)",
             "weight": 0.15, "source": "ACLED, GDELT, Reuters", "freq": "Real-time"},
            {"name": "Diplomatic Statements", "desc": "Official statements, ultimatums, or negotiations from either party",
             "weight": 0.10, "source": "State Dept, MFA Iran, UN", "freq": "Daily"},
            {"name": "Nuclear Program Developments", "desc": "IAEA reports, enrichment levels, facility activities",
             "weight": 0.15, "source": "IAEA, Jane's, Reuters", "freq": "Weekly"},
            {"name": "Strait of Hormuz Incidents", "desc": "Ship seizures, mining, drone attacks, naval confrontations",
             "weight": 0.10, "source": "Reuters, Lloyd's List, US Navy", "freq": "Real-time"},
            {"name": "Cyber Attacks Attributed", "desc": "Cyber operations attributed to either party against the other",
             "weight": 0.10, "source": "Mandiant, CrowdStrike, CISA", "freq": "Weekly"},
        ],
        decay_lambda=0.92,
        half_life_days=8,
    ))

    # ── 5.2 Global Warfare Technology Acceleration Index ──
    elements.extend(_build_index_section(
        num=2,
        title="Global Warfare Technology Acceleration Index (0-100)",
        description=(
            "The Global Warfare Technology Acceleration Index measures the pace and intensity of "
            "technological innovation in military systems worldwide. This index tracks developments "
            "across multiple technology domains including hypersonic weapons, autonomous systems, "
            "directed energy, cyber capabilities, and artificial intelligence applications in warfare. "
            "The index is designed to serve as an early indicator of shifts in the global military "
            "balance, identifying periods of accelerated development that may precede deployment of "
            "new capabilities or trigger arms race dynamics. A rising index suggests that multiple "
            "nations are simultaneously advancing military technology, which historically correlates "
            "with increased geopolitical competition and reduced strategic stability. The longer "
            "half-life of 14 days reflects the fact that technology developments unfold over longer "
            "timescales than diplomatic crises or military deployments, and individual breakthroughs "
            "remain relevant for extended periods."
        ),
        signals=[
            {"name": "New Weapons Tests", "desc": "Announced or detected tests of new weapons systems",
             "weight": 0.20, "source": "Reuters, Jane's, military statements", "freq": "Real-time"},
            {"name": "Defense Budget Increases", "desc": "Announced increases in national defense spending",
             "weight": 0.15, "source": "Government budgets, SIPRI, IISS", "freq": "Monthly"},
            {"name": "Emerging Tech Breakthroughs", "desc": "Published research or demonstrations of novel military technologies",
             "weight": 0.20, "source": "Academic journals, DARPA, defense contractors", "freq": "Weekly"},
            {"name": "Hypersonic Tests", "desc": "Hypersonic glide vehicle or scramjet tests by any nation",
             "weight": 0.15, "source": "Jane's, military sources, satellite data", "freq": "Real-time"},
            {"name": "Drone/UAV Advances", "desc": "New drone capabilities, endurance records, swarm demonstrations",
             "weight": 0.15, "source": "Defense News, industry publications", "freq": "Weekly"},
            {"name": "Arms Race Indicators", "desc": "Announced counter-measure programs, treaty withdrawals, capability gaps",
             "weight": 0.15, "source": "Arms Control Assoc., IISS, SIPRI", "freq": "Monthly"},
        ],
        decay_lambda=0.95,
        half_life_days=14,
    ))

    # ── 5.3 Major Military Contract Activity Index ──
    elements.extend(_build_index_section(
        num=3,
        title="Major Military Contract Activity Index (0-100)",
        description=(
            "The Major Military Contract Activity Index quantifies the volume and strategic significance "
            "of military procurement activity worldwide. This index captures not only the dollar value of "
            "defense contracts but also structural shifts in the defense industrial base, including the "
            "entry of non-traditional contractors, the emergence of new manufacturing paradigms, and "
            "increased international arms sales. The index serves as a leading indicator of future "
            "military capability deployments, as major contracts typically precede production and fielding "
            "by 2-5 years. A sustained high reading on this index suggests that the global defense "
            "industry is scaling up production capacity, which has implications for both capability "
            "forecasting and defense market analysis. The relatively short half-life of 7 days reflects "
            "the market-sensitive nature of contract announcements, where the immediate impact on "
            "defense industry dynamics is most pronounced in the days following disclosure."
        ),
        signals=[
            {"name": "Contract Announcements", "desc": "New defense contract awards exceeding $100M threshold",
             "weight": 0.25, "source": "DoD contracts page, SAM.gov, defense press", "freq": "Daily"},
            {"name": "Dollar Volume", "desc": "Aggregate dollar value of contracts in trailing 30-day window",
             "weight": 0.25, "source": "DoD, GAO, SIPRI", "freq": "Daily"},
            {"name": "Number of Contractors", "desc": "Count of unique contractors receiving awards in the period",
             "weight": 0.15, "source": "SAM.gov, DoD contracts", "freq": "Weekly"},
            {"name": "Multi-Year Deals", "desc": "Contracts with multi-year production or development phases",
             "weight": 0.15, "source": "DoD announcements, contractor filings", "freq": "Daily"},
            {"name": "Emerging Vendor Participation", "desc": "Contracts awarded to non-traditional or startup defense firms",
             "weight": 0.10, "source": "Industry analysis, SEC filings", "freq": "Weekly"},
            {"name": "International FMS Deals", "desc": "Foreign Military Sales agreements and notifications",
             "weight": 0.10, "source": "DSCA, State Dept, Congressional notifications", "freq": "Weekly"},
        ],
        decay_lambda=0.90,
        half_life_days=7,
    ))

    # ── 5.4 Regional Conflict Risk Index ──
    extra_rcr = P(
        "<b>Regions Tracked:</b> The Regional Conflict Risk Index is computed independently for six "
        "primary regions: Middle East, Eastern Europe, Indo-Pacific, East Africa, South Asia, and the "
        "Arctic. Each regional index uses the same signal structure and weighting scheme but draws from "
        "region-specific data sources. The Arctic region was added in recognition of the increasing "
        "strategic competition over northern sea routes, resource extraction rights, and military "
        "presence in the High North. The short half-life of 6 days reflects the rapidly evolving nature "
        "of regional conflicts, where escalation can occur within hours of a triggering event."
    )
    elements.extend(_build_index_section(
        num=4,
        title="Regional Conflict Risk Index (Per Region, 0-100)",
        description=(
            "The Regional Conflict Risk Index provides a localized assessment of armed conflict probability "
            "for six strategically significant regions. Unlike the other indices, which measure global or "
            "bilateral dynamics, this index operates at the regional level, capturing the specific "
            "conditions that precede conflict outbreak in each area. The index integrates event data from "
            "the ACLED conflict database, diplomatic reporting from Reuters and regional media, and "
            "open-source intelligence from social media monitoring. Each region is scored independently, "
            "allowing analysts to identify geographic hotspots even when global indicators remain stable. "
            "The seven input signals were selected based on quantitative analysis of historical conflict "
            "precursors using the Uppsala Conflict Data Program dataset, ensuring that the index captures "
            "the most statistically significant predictors of conflict escalation."
        ),
        signals=[
            {"name": "Armed Clashes", "desc": "Recorded armed confrontations between state or non-state actors",
             "weight": 0.25, "source": "ACLED, GDELT, Reuters", "freq": "Real-time"},
            {"name": "Troop Movements", "desc": "Significant military force redeployments or mobilizations",
             "weight": 0.15, "source": "OSINT imagery, military statements, Jane's", "freq": "Daily"},
            {"name": "Diplomatic Breakdowns", "desc": "Withdrawal from negotiations, expulsion of diplomats, severed ties",
             "weight": 0.10, "source": "Reuters, UN, regional media", "freq": "Daily"},
            {"name": "Civilian Casualties", "desc": "Reported civilian deaths and injuries from conflict-related violence",
             "weight": 0.15, "source": "ACLED, OHCHR, local media", "freq": "Daily"},
            {"name": "Alliance Shifts", "desc": "New alliances, defense pact signings, alliance dissolutions",
             "weight": 0.10, "source": "Government announcements, IISS", "freq": "Weekly"},
            {"name": "Resource Disputes", "desc": "Escalating disputes over water, energy, mineral, or territorial resources",
             "weight": 0.10, "source": "Regional media, academic analysis", "freq": "Weekly"},
            {"name": "Social Media Escalation", "desc": "Spike in conflict-related social media activity in the region",
             "weight": 0.15, "source": "GDELT, CrowdTangle, social APIs", "freq": "Real-time"},
        ],
        decay_lambda=0.88,
        half_life_days=6,
        extra_content=extra_rcr,
    ))

    # ── 5.5 Strategic Surprise Probability Score ──
    extra_ssp = P(
        "<b>Note on Temporal Sensitivity:</b> The Strategic Surprise Probability Score intentionally uses "
        "the shortest half-life (5 days) of any GIMS index, reflecting the time-sensitive nature of "
        "strategic surprise events. Unlike gradual trends in technology development or procurement activity, "
        "strategic surprises tend to materialize rapidly with limited advance warning. The index's "
        "sensitivity configuration is specifically tuned to elevate when multiple anomalous signals "
        "coincide within a compressed timeframe, even if individual signals might not be significant "
        "in isolation. Analysts should interpret a rising score on this index as a call to intensify "
        "monitoring and review contingency plans, rather than as a prediction of a specific event."
    )
    elements.extend(_build_index_section(
        num=5,
        title="Strategic Surprise Probability Score (0-100)",
        description=(
            "The Strategic Surprise Probability Score is the most conceptually distinct of the five "
            "GIMS indices, designed to detect conditions that historically precede unexpected strategic "
            "events — military interventions, nuclear tests, alliance realignments, or sudden geopolitical "
            "shifts that catch the international community off guard. Unlike the other indices, which "
            "measure the intensity of observable activities, this index specifically looks for patterns "
            "of anomalous behavior that deviate from established baselines. The underlying premise is "
            "that strategic surprises are rarely truly unforeseeable; rather, they are preceded by "
            "observable anomalies that are individually dismissed as insignificant but collectively "
            "form a recognizable pattern. By tracking seven distinct anomaly categories and weighting "
            "them based on historical correlation with surprise events, the index provides a quantitative "
            "measure of how unusual the current geopolitical environment is relative to recent baselines. "
            "The short half-life of 5 days ensures maximum responsiveness to rapidly evolving situations."
        ),
        signals=[
            {"name": "Unusual Military Movements", "desc": "Military activity deviating significantly from established patterns",
             "weight": 0.20, "source": "OSINT, satellite analysis, Jane's", "freq": "Daily"},
            {"name": "Communication Blackouts", "desc": "Unexpected silence from normally active diplomatic or military channels",
             "weight": 0.15, "source": "Media monitoring, diplomatic channels", "freq": "Daily"},
            {"name": "Leadership Changes", "desc": "Unexpected military or political leadership transitions",
             "weight": 0.10, "source": "Reuters, regional media, government notices", "freq": "Real-time"},
            {"name": "Economic Shock Indicators", "desc": "Sudden currency movements, trade disruptions, sanctions cascades",
             "weight": 0.10, "source": "Bloomberg, Reuters Markets, IMF", "freq": "Real-time"},
            {"name": "Intelligence Community Warnings", "desc": "Public statements or leaks from intelligence agencies",
             "weight": 0.15, "source": "ODNI, DIA, allied intel agencies", "freq": "Weekly"},
            {"name": "Pattern Deviation", "desc": "Statistical deviation of aggregate signals from 90-day baseline",
             "weight": 0.15, "source": "Internal computation across all GIMS indices", "freq": "Every 15 min"},
            {"name": "Alliance Formation/Dissolution", "desc": "New defense pacts, mutual defense agreements, alliance withdrawals",
             "weight": 0.15, "source": "Government announcements, UN, IISS", "freq": "Weekly"},
        ],
        decay_lambda=0.85,
        half_life_days=5,
        extra_content=extra_ssp,
    ))

    return elements


def build_forecasting_engine():
    """Section 6: Short-Term Forecasting Engine (400+ words)."""
    elements = []
    elements.append(P("6. SHORT-TERM FORECASTING ENGINE", style_h1))
    elements.append(hrule())

    elements.append(P(
        "The Short-Term Forecasting Engine extends the GIMS platform beyond current-state assessment "
        "by generating probabilistic projections of future index values and geopolitical developments. "
        "Like the scoring engine, the forecasting engine is entirely rule-based, using established "
        "statistical methods rather than machine learning to produce transparent, interpretable forecasts. "
        "The engine operates on three time horizons: 7-day (tactical), 30-day (operational), and 90-day "
        "(strategic), with different methods applied to each horizon based on their respective strengths. "
        "All forecasts include explicit confidence intervals and are labeled with the method used, "
        "enabling analysts to assess the reliability of each projection."
    ))

    elements.append(P("6.1 Moving Averages", style_h2))
    elements.append(P(
        "The 7-day Simple Moving Average (SMA-7) and 30-day Simple Moving Average (SMA-30) provide "
        "the foundational trend-detection capability for the forecasting engine. The SMA-7 captures "
        "short-term directional movement, filtering out daily noise while remaining responsive to "
        "genuine shifts in index trajectory. The SMA-30 provides a longer-term trend baseline, "
        "representing the underlying directional momentum of each index. When the SMA-7 crosses above "
        "the SMA-30, it generates a bullish (escalation) signal; when it crosses below, it generates a "
        "bearish (de-escalation) signal. The formulas are as follows:"
    ))
    elements.append(P(
        "SMA<sub>7</sub>(t) = (1/7) \u00b7 \u03a3<sub>i=0</sub><super>6</super> I(t-i)",
        style_formula
    ))
    elements.append(P(
        "SMA<sub>30</sub>(t) = (1/30) \u00b7 \u03a3<sub>i=0</sub><super>29</super> I(t-i)",
        style_formula
    ))
    elements.append(P(
        "Crossover signals are validated by requiring the spread between SMA-7 and SMA-30 to exceed a "
        "minimum threshold (default: 3 points) for at least 2 consecutive computation cycles, reducing "
        "false signals caused by transient fluctuations."
    ))

    elements.append(P("6.2 Exponential Smoothing", style_h2))
    elements.append(P(
        "Exponential smoothing provides a more responsive tracking mechanism than simple moving averages "
        "by assigning exponentially decreasing weights to older observations. GIMS uses single exponential "
        "smoothing with a smoothing parameter \u03b1 = 0.3, which was selected through retrospective "
        "analysis of historical index data to minimize mean absolute error on 7-day forward predictions. "
        "The higher \u03b1 value (compared to the commonly used 0.1-0.2 range) reflects the need for "
        "responsiveness in geopolitical monitoring, where delayed detection of trend changes carries "
        "significant opportunity cost."
    ))
    elements.append(P(
        "S(t) = \u03b1 \u00b7 I(t) + (1 - \u03b1) \u00b7 S(t-1),  where \u03b1 = 0.30",
        style_formula
    ))
    elements.append(P(
        "The smoothed value S(t) serves as the point forecast for the next period, with prediction "
        "intervals computed using the standard deviation of recent forecast errors. The 80% prediction "
        "interval is typically \u00b16-10 points, while the 95% interval extends to \u00b112-15 points, "
        "depending on the volatility of the specific index."
    ))

    elements.append(P("6.3 Bayesian Updating", style_h2))
    elements.append(P(
        "The Bayesian updating framework allows GIMS to systematically incorporate new evidence into "
        "existing forecasts, adjusting probability estimates as new articles and events are processed. "
        "The framework maintains a prior distribution for each index based on historical patterns, "
        "and updates this prior to a posterior distribution as new signals are observed. The likelihood "
        "function is modeled as a Gaussian distribution centered on the signal-aggregated prediction "
        "with variance proportional to the number and quality of contributing signals."
    ))
    elements.append(P(
        "P(H|E) = [P(E|H) \u00b7 P(H)] / P(E)",
        style_formula
    ))
    elements.append(P(
        "In practice, the Bayesian framework is most useful for generating probability estimates for "
        "discrete outcomes (e.g., 'probability of military intervention in the next 30 days') rather "
        "than precise point forecasts. The prior P(H) is initialized from historical base rates and "
        "updated with each new signal event E, allowing the system to maintain a continuously evolving "
        "probability assessment that reflects the cumulative weight of recent evidence."
    ))

    elements.append(P("6.4 Scenario-Based Rules", style_h2))
    elements.append(P(
        "The scenario-based rules engine codifies analyst knowledge about specific geopolitical "
        "situations into deterministic if-then rules that trigger forecast alerts when predefined "
        "conditions are met. These rules are developed in collaboration with domain experts and are "
        "periodically validated against historical outcomes to ensure calibration. The following rules "
        "are currently implemented in the production system:"
    ))

    rules = [
        ("<b>Rule 1 — Escalation Risk:</b> If US-Iran Tension Index > 70 AND proxy attacks > 3 in "
         "14 days \u2192 HIGH probability of military escalation in 2-4 weeks. This rule is based on "
         "historical analysis showing that sustained tension scores above 70 combined with active proxy "
         "campaigns have preceded 78% of significant escalation events between 2018 and 2025."),
        ("<b>Rule 2 — Arms Race Acceleration:</b> If Contract Activity Index rises > 15 points in 7 "
         "days AND involves hypersonic or AI-related contracts \u2192 MEDIUM-HIGH probability of "
         "accelerated arms race in 6-12 months. This rule captures the pattern of competitive procurement "
         "responses that typically follow major breakthrough announcements."),
        ("<b>Rule 3 — Military Intervention Probability:</b> If Regional Conflict Risk Index for any "
         "region > 60 for 7+ consecutive days \u2192 ELEVATED probability of military intervention "
         "within 30 days. Historical analysis shows that sustained high regional risk scores have "
         "preceded 65% of external military interventions in the corresponding region."),
    ]
    for r in rules:
        elements.append(bullet(r))

    return elements


def build_database_schema():
    """Section 7: Database Schema (300+ words)."""
    elements = []
    elements.append(P("7. DATABASE SCHEMA", style_h1))
    elements.append(hrule())

    elements.append(P(
        "The GIMS database schema is designed around PostgreSQL 16 with the TimescaleDB extension for "
        "optimized time-series data handling. The schema is organized into six primary tables that "
        "capture the full lifecycle of intelligence data from raw article ingestion through index "
        "scoring, forecasting, and event tracking. All tables include appropriate indexes for query "
        "performance, foreign key constraints for referential integrity, and timestamp columns for "
        "audit trails. TimescaleDB hypertables are used for the index_scores and forecasts tables "
        "to enable efficient time-range queries and automatic data partitioning by time."
    ))

    avail_w = PAGE_W - 2 * inch
    cell_mono = ParagraphStyle('CellMono', parent=style_cell, fontName=FONT_MONO, fontSize=8, leading=11)

    tables_schema = [
        ("articles", [
            "id", "UUID, PRIMARY KEY",
            "source", "VARCHAR(100) — Publication source name",
            "url", "TEXT, UNIQUE — Canonical URL of the article",
            "title", "VARCHAR(500) — Article headline",
            "content", "TEXT — Full article body text",
            "published_at", "TIMESTAMPTZ — Original publication time",
            "ingested_at", "TIMESTAMPTZ DEFAULT NOW() — System ingestion time",
            "summary", "TEXT — Generated 3-5 sentence extractive summary",
            "why_matters", "TEXT — Template-based strategic significance analysis",
            "fingerprint", "VARCHAR(64) — SimHash + SHA-256 composite fingerprint",
        ]),
        ("entities", [
            "id", "UUID, PRIMARY KEY",
            "article_id", "UUID, FK → articles.id — Parent article reference",
            "entity_type", "VARCHAR(50) — Country, Actor, Weapon, Technology, etc.",
            "entity_name", "VARCHAR(200) — Normalized entity name",
            "confidence", "FLOAT — Extraction confidence score (0.0-1.0)",
            "metadata_json", "JSONB — Additional metadata (ISO codes, geocoords, etc.)",
        ]),
        ("tags", [
            "id", "UUID, PRIMARY KEY",
            "article_id", "UUID, FK → articles.id — Parent article reference",
            "tag_category", "VARCHAR(50) — Warfare Technology, Contracts, Regional, etc.",
            "tag_name", "VARCHAR(100) — Specific tag within the category",
        ]),
        ("index_scores (Hypertable)", [
            "id", "UUID, PRIMARY KEY",
            "index_name", "VARCHAR(100) — Name of the computed index",
            "score", "FLOAT — Current index value (0-100)",
            "calculated_at", "TIMESTAMPTZ — Computation timestamp (partition key)",
            "input_signals_json", "JSONB — Individual signal scores and metadata",
            "decayed_score", "FLOAT — Score after temporal decay application",
        ]),
        ("forecasts (Hypertable)", [
            "id", "UUID, PRIMARY KEY",
            "index_name", "VARCHAR(100) — Target index for the forecast",
            "forecast_value", "FLOAT — Predicted index value",
            "method", "VARCHAR(50) — SMA, ExpSmooth, Bayesian, Rule",
            "horizon_days", "INTEGER — Forecast horizon in days (7, 30, or 90)",
            "confidence", "FLOAT — Forecast confidence score (0.0-1.0)",
            "created_at", "TIMESTAMPTZ DEFAULT NOW() — Forecast generation time",
        ]),
        ("events", [
            "id", "UUID, PRIMARY KEY",
            "article_id", "UUID, FK → articles.id — Source article reference",
            "event_type", "VARCHAR(50) — Strike, Sanction, Deployment, etc.",
            "region", "VARCHAR(100) — Geographic region of the event",
            "actors_json", "JSONB — Involved actors (countries, organizations)",
            "severity", "INTEGER — Severity score (1-10)",
            "timestamp", "TIMESTAMPTZ — Event occurrence timestamp",
        ]),
    ]

    for table_name, columns in tables_schema:
        elements.append(P(f"<b>{table_name}</b>", style_h3))
        schema_data = [[header_cell("Column"), header_cell("Definition")]]
        for i in range(0, len(columns), 2):
            schema_data.append([cell(columns[i]), cell(columns[i+1])])
        schema_widths = [avail_w*0.22, avail_w*0.78]
        elements.append(make_table(schema_data, schema_widths))
        elements.append(Spacer(1, 4))

    elements.append(P(
        "Additional database features include: continuous aggregates for pre-computed daily, weekly, and "
        "monthly index summaries; data retention policies that automatically compress data older than "
        "90 days and drop raw article content older than 365 days; and partial indexes on frequently "
        "queried column combinations (e.g., articles by source and publication date, index_scores by "
        "name and time range). The total estimated storage requirement is approximately 50 GB per year "
        "at the target ingestion rate of 5,000 articles per day."
    ))

    return elements


def build_api_endpoints():
    """Section 8: API Endpoints (200+ words)."""
    elements = []
    elements.append(P("8. API ENDPOINTS", style_h1))
    elements.append(hrule())

    elements.append(P(
        "The GIMS API layer exposes a comprehensive set of RESTful endpoints and a WebSocket connection "
        "for real-time data access. All endpoints are versioned (currently v1) and support JSON request "
        "and response formats. Authentication is handled via JWT tokens with role-based access control, "
        "and all endpoints implement rate limiting to prevent abuse. The API documentation is auto-generated "
        "from FastAPI's OpenAPI schema and available at the /docs endpoint. The following table describes "
        "each endpoint, its HTTP method, and its primary purpose."
    ))

    avail_w = PAGE_W - 2 * inch
    api_data = [
        [header_cell("Method"), header_cell("Endpoint"), header_cell("Description")],
        [cell("GET"), cell("/api/v1/indices"), cell("Retrieve all current index scores with timestamp and threshold classification")],
        [cell("GET"), cell("/api/v1/indices/{name}/history"), cell("Time series data for a specific index with configurable date range and granularity")],
        [cell("GET"), cell("/api/v1/articles"), cell("List processed articles with filtering by tag, entity, source, and date range")],
        [cell("GET"), cell("/api/v1/articles/{id}"), cell("Full article details including summary, why_matters, entities, and tags")],
        [cell("GET"), cell("/api/v1/forecasts"), cell("All active forecasts across all indices with confidence intervals")],
        [cell("GET"), cell("/api/v1/regions/{region}/risk"), cell("Current Regional Conflict Risk Index score and 7/30/90 day forecasts")],
        [cell("GET"), cell("/api/v1/brief/daily"), cell("Generate or retrieve the daily intelligence brief for the current date")],
        [cell("POST"), cell("/api/v1/sources"), cell("Add a new data source (RSS feed, API, or scraping target) to the ingestion pipeline")],
        [cell("WS"), cell("/ws/live"), cell("WebSocket connection for real-time index score updates and alert notifications")],
    ]
    api_widths = [avail_w*0.10, avail_w*0.35, avail_w*0.55]
    elements.append(make_table(api_data, api_widths))
    elements.append(P("Table 8.1: GIMS API Endpoint Reference", style_caption))

    elements.append(P(
        "The WebSocket endpoint at /ws/live provides a persistent connection for clients requiring "
        "real-time updates. Upon connection, clients can subscribe to specific indices or all indices. "
        "Messages are pushed within 5 seconds of any index score change, with a payload format of "
        '{"index": "us_iran_tension", "score": 72.5, "change": +3.2, "threshold": "High", '
        '"timestamp": "2026-05-15T14:30:00Z"}. The WebSocket implementation includes automatic '
        "reconnection logic, heartbeat monitoring, and backpressure handling to maintain stable "
        "connections under high-frequency update conditions. Rate limiting is set at 100 requests "
        "per minute per API key for standard users and 1,000 requests per minute for premium users."
    ))

    return elements


def build_frontend_dashboard():
    """Section 9: Frontend Dashboard Design (300+ words)."""
    elements = []
    elements.append(P("9. FRONTEND DASHBOARD DESIGN", style_h1))
    elements.append(hrule())

    elements.append(P(
        "The GIMS frontend dashboard is a Next.js 16 application that serves as the primary human "
        "interface to the platform. Built with a component-based architecture using React Server "
        "Components for initial page loads and client components for interactive features, the "
        "dashboard provides four primary views designed to support different analytical workflows. "
        "The visual design follows a dark-mode-first aesthetic with the GIMS accent color (#ce2d48) "
        "used for alerts, critical thresholds, and interactive highlights. The dashboard is fully "
        "responsive, supporting desktop, tablet, and mobile viewports, and is optimized for "
        "performance with server-side rendering, code splitting, and aggressive caching of static assets."
    ))

    elements.append(P("9.1 Global Overview", style_h2))
    elements.append(P(
        "The Global Overview serves as the default landing page and provides a high-level situational "
        "awareness display. The centerpiece is an interactive world map rendered using Deck.gl with "
        "Mapbox base tiles, displaying a region risk heat overlay that color-codes each tracked region "
        "based on its current Regional Conflict Risk Index score. Above the map, a row of key metric "
        "cards displays the current value and trend arrow (up/down/stable) for each of the five primary "
        "indices. Clicking any metric card navigates to the corresponding Index Deep-Dive view. Below "
        "the map, a scrollable ticker displays the latest processed articles with inline entity "
        "highlights and tag badges. The Global Overview auto-refreshes every 30 seconds and supports "
        "a full-screen presentation mode for operations center displays."
    ))

    elements.append(P("9.2 Index Deep-Dive", style_h2))
    elements.append(P(
        "The Index Deep-Dive view provides comprehensive analysis of a single selected index. The main "
        "panel displays a time series chart (using Recharts) showing the selected index over a "
        "configurable time range (7 days, 30 days, 90 days, 1 year). Users can toggle between raw "
        "score, decayed score, and forecast overlay views. A signal breakdown panel shows the "
        "contribution of each input signal to the current score, displayed as a stacked bar chart with "
        "hover tooltips for exact values. The trend analysis section shows SMA-7 and SMA-30 crossover "
        "status, exponential smoothing trajectory, and the 80% and 95% prediction intervals for the "
        "7-day forward forecast. Historical threshold breach events are annotated on the chart with "
        "clickable markers that reveal the contributing articles and events."
    ))

    elements.append(P("9.3 Article Intelligence Feed", style_h2))
    elements.append(P(
        "The Article Intelligence Feed provides a searchable, filterable interface to all processed "
        "articles. The feed displays articles in a reverse-chronological list with inline entity "
        "highlights (countries highlighted in blue, weapons systems in orange, dollar amounts in green) "
        "and tag badges below each article title. The search bar supports full-text search with keyword "
        "highlighting and relevance ranking. Filter controls allow narrowing by tag category, specific "
        "tags, entity type, source, date range, and minimum index impact score. Each article card can "
        "be expanded to reveal the full summary, 'Why This Matters' analysis, extracted entities table, "
        "and links to related articles based on shared tags and entities. A bulk export function allows "
        "analysts to download filtered article sets as CSV or JSON for offline analysis."
    ))

    elements.append(P("9.4 Forecast Center", style_h2))
    elements.append(P(
        "The Forecast Center aggregates all active forecasts across all indices into a unified "
        "management interface. Forecasts are displayed in a card grid format, each showing the target "
        "index, predicted value, confidence level (as both a percentage and a visual confidence bar), "
        "forecast horizon, and the method used to generate the forecast. Active scenario-based rule "
        "alerts are highlighted with color-coded severity indicators. A dedicated section shows forecasts "
        "that have diverged significantly from actual outcomes, enabling analysts to assess forecast "
        "calibration and identify systematic biases. The Forecast Center also provides a comparison "
        "view where forecasts from different methods (SMA, exponential smoothing, Bayesian) can be "
        "overlaid on the same chart for the same index, facilitating method evaluation and selection."
    ))

    return elements


def build_example_outputs():
    """Section 10: Example Outputs (400+ words)."""
    elements = []
    elements.append(P("10. EXAMPLE OUTPUTS", style_h1))
    elements.append(hrule())

    elements.append(P(
        "This section demonstrates the GIMS processing pipeline's output by applying it to two real-world "
        "news articles that reflect the types of developments the system is designed to monitor, analyze, "
        "and score. Each example shows the complete set of outputs generated by the platform, including "
        "the automated summary, strategic significance analysis, assigned tags, and quantified impact on "
        "the system's scoring indices. These examples illustrate how GIMS transforms unstructured news "
        "articles into structured, actionable intelligence products."
    ))

    # ── Article 1 ──
    elements.append(P("10.1 Pentagon to Buy 10,000 Low-Cost Missiles", style_h2))
    elements.append(hrule())

    elements.append(P("<b>Summary:</b>", style_body))
    elements.append(P(
        "The Pentagon has signed agreements with Anduril, CoAspire, Leidos, and Zone 5 to procure over "
        "10,000 low-cost cruise missiles within three years. The missiles are designed for flexible "
        "deployment across air, ground, and maritime platforms, with testing scheduled to begin in 2026 "
        "before ramping to full-scale production. The program intentionally broadens the supplier base "
        "beyond traditional defense primes to accelerate delivery timelines and incentivize private "
        "investment in manufacturing capacity, reflecting a strategic shift toward distributed production "
        "models for critical munitions."
    ))

    elements.append(P("<b>Why This Matters:</b>", style_body))
    elements.append(P(
        "This represents one of the largest single missile procurement programs in recent history, "
        "signaling a fundamental shift in US defense procurement strategy toward distributed manufacturing "
        "and cost-efficient munitions. The inclusion of non-traditional defense contractors like Anduril "
        "reflects the Pentagon's urgency to scale production amid rising global threats, particularly in "
        "the Indo-Pacific theater where large-volume munitions stockpiles are considered essential for "
        "deterrence and warfighting sustainability. The multi-domain launch capability (air, ground, and "
        "maritime) suggests preparation for high-intensity conflicts requiring massed precision strikes, "
        "a capability set that directly addresses lessons learned from the ongoing conflict in Ukraine "
        "where munition consumption rates have far exceeded pre-war planning assumptions. The $10,000 "
        "target unit cost represents a dramatic reduction from current cruise missile prices, potentially "
        "reshaping the economics of precision strike warfare."
    ))

    elements.append(P("<b>Assigned Tags:</b>", style_body))
    elements.append(bullet("Warfare Technology \u2192 Missiles, Autonomous Systems"))
    elements.append(bullet("Military Contracts \u2192 Major Procurement"))
    elements.append(bullet("Regional Conflicts \u2192 Indo-Pacific"))

    elements.append(P("<b>Index Impact Assessment:</b>", style_body))
    avail_w = PAGE_W - 2 * inch
    impact1_data = [
        [header_cell("Index"), header_cell("Score Change"), header_cell("Rationale")],
        [cell("Contract Activity Index"), cell("+12"), cell("Major multi-vendor procurement exceeding $10B total value")],
        [cell("Warfare Tech Acceleration Index"), cell("+8"), cell("Low-cost cruise missile development advancing precision strike capabilities")],
    ]
    impact_widths = [avail_w*0.35, avail_w*0.15, avail_w*0.50]
    elements.append(make_table(impact1_data, impact_widths))
    elements.append(P("Table 10.1: Index Impact for Pentagon Missile Procurement Article", style_caption))

    # ── Article 2 ──
    elements.append(Spacer(1, 12))
    elements.append(P("10.2 China Unveils Breakthrough That May One Day Propel Drones Indefinitely", style_h2))
    elements.append(hrule())

    elements.append(P("<b>Summary:</b>", style_body))
    elements.append(P(
        "Chinese researchers have demonstrated a car-mounted microwave wireless power transmission system "
        "capable of keeping drones aloft for over three hours without landing. The system beams directed "
        "microwave energy to a receiving antenna on the drone, effectively providing continuous in-flight "
        "recharging. This breakthrough addresses one of the most fundamental limitations of unmanned "
        "aerial systems: finite battery life and the need to return to base for recharging. The system "
        "was demonstrated at a research facility and represents a significant advancement in the field "
        "of wireless power transfer for airborne platforms."
    ))

    elements.append(P("<b>Why This Matters:</b>", style_body))
    elements.append(P(
        "If successfully militarized, this technology could enable persistent drone surveillance and "
        "potentially strike operations lasting days or weeks without logistical support infrastructure. "
        "It represents a significant challenge to current air defense paradigms, as drones operating from "
        "a mobile ground station could maintain continuous presence over contested areas without the "
        "vulnerability of fixed forward operating bases. The car-mounted design provides tactical "
        "mobility, allowing the charging station to reposition as operational requirements change or "
        "as threats to fixed infrastructure emerge. The technology could also have civilian applications "
        "in disaster response, infrastructure inspection, and communications relay, though its military "
        "implications are most strategically significant for US-China competition in the Indo-Pacific "
        "theater, where persistent aerial surveillance capabilities would represent a meaningful shift "
        "in the operational balance. The directed energy aspect also raises questions about potential "
        "dual-use applications in electronic warfare and counter-drone systems."
    ))

    elements.append(P("<b>Assigned Tags:</b>", style_body))
    elements.append(bullet("Emerging Tech \u2192 Directed Energy, Drones/UAV"))
    elements.append(bullet("Regional Conflicts \u2192 Indo-Pacific"))
    elements.append(bullet("Warfare Technology \u2192 Autonomous Systems"))

    elements.append(P("<b>Index Impact Assessment:</b>", style_body))
    impact2_data = [
        [header_cell("Index"), header_cell("Score Change"), header_cell("Rationale")],
        [cell("Warfare Tech Acceleration Index"), cell("+10"), cell("Significant emerging technology breakthrough with military applications")],
        [cell("Strategic Surprise Probability"), cell("+7"), cell("Unexpected capability advancement from strategic competitor")],
        [cell("Indo-Pacific Regional Risk"), cell("+5"), cell("Technology could shift operational balance in contested theater")],
    ]
    elements.append(make_table(impact2_data, impact_widths))
    elements.append(P("Table 10.2: Index Impact for China Drone Power Breakthrough Article", style_caption))

    elements.append(P(
        "These two examples demonstrate the complementary nature of the GIMS scoring indices. The Pentagon "
        "missile procurement article primarily impacts the Contract Activity Index and Warfare Technology "
        "Index, reflecting a deliberate, announced shift in US defense procurement strategy. The Chinese "
        "drone technology breakthrough, by contrast, impacts the Strategic Surprise Probability Score "
        "in addition to the Warfare Technology Index, reflecting the unexpected nature of the "
        "announcement and its potential to alter the strategic calculus in the Indo-Pacific. Together, "
        "the two articles illustrate how GIMS captures both declared strategic intentions and emerging "
        "surprise capabilities within a unified analytical framework."
    ))

    return elements


def build_deployment_plan():
    """Section 11: Deployment Plan (200+ words)."""
    elements = []
    elements.append(P("11. DEPLOYMENT PLAN", style_h1))
    elements.append(hrule())

    elements.append(P(
        "The GIMS deployment follows a phased approach spanning 16 weeks from initial development to "
        "production readiness. Each phase builds upon the previous one, enabling incremental validation "
        "and reducing integration risk. The deployment plan accounts for parallel workstreams where "
        "possible, with clear phase gates that must be passed before proceeding to the next stage. "
        "Infrastructure is provisioned incrementally to minimize costs during development while ensuring "
        "that production-scale resources are available when needed."
    ))

    avail_w = PAGE_W - 2 * inch
    deploy_data = [
        [header_cell("Phase"), header_cell("Duration"), header_cell("Components"), header_cell("Infrastructure")],
        [cell("Phase 1:\nFoundation"), cell("Weeks 1-4"),
         cell("RSS/API ingestion, web scrapers, DB schema, basic REST API, article processing pipeline"),
         cell("Single AWS EC2 t3.large + RDS PostgreSQL db.t3.medium")],
        [cell("Phase 2:\nScoring Engine"), cell("Weeks 5-8"),
         cell("Rule-based scoring engine, all 5 indices, entity extraction, tagging taxonomy, dashboard v1"),
         cell("Add ElastiCache Redis, S3 for article storage, CloudWatch monitoring")],
        [cell("Phase 3:\nForecasting"), cell("Weeks 9-12"),
         cell("Forecasting engine (SMA, ExpSmooth, Bayesian), scenario rules, daily brief generator, WebSocket"),
         cell("Add Node.js worker instances, SQS for job queue, enhanced monitoring")],
        [cell("Phase 4:\nProduction"), cell("Weeks 13-16"),
         cell("Load testing, security hardening, alerting rules, runbook documentation, user acceptance testing"),
         cell("ECS/Fargate with auto-scaling, RDS Multi-AZ, WAF, CloudFront CDN")],
    ]
    deploy_widths = [avail_w*0.13, avail_w*0.12, avail_w*0.40, avail_w*0.35]
    elements.append(make_table(deploy_data, deploy_widths))
    elements.append(P("Table 11.1: GIMS Deployment Phases", style_caption))

    elements.append(P(
        "Each phase concludes with a formal review that evaluates: functional completeness against the "
        "phase requirements; system performance under simulated load; security posture assessment including "
        "vulnerability scanning and access control validation; and documentation completeness for all "
        "deployed components. The production deployment includes automated CI/CD pipelines using GitHub "
        "Actions, with staging environments that mirror production configuration for final validation. "
        "Post-deployment, a 30-day stabilization period provides dedicated support for issue resolution "
        "and performance tuning before transitioning to steady-state operations."
    ))

    return elements


def build_security_considerations():
    """Section 12: Security Considerations (200+ words)."""
    elements = []
    elements.append(P("12. SECURITY CONSIDERATIONS", style_h1))
    elements.append(hrule())

    elements.append(P(
        "Given the sensitive nature of geopolitical intelligence data, security is a foundational "
        "requirement for the GIMS platform rather than an afterthought. The security architecture "
        "implements defense-in-depth principles, with multiple overlapping security controls at every "
        "layer of the system. All security measures are designed to comply with NIST SP 800-53 "
        "moderate baseline controls and are documented in the system security plan."
    ))

    elements.append(P("<b>Data Classification:</b>", style_body))
    elements.append(P(
        "All data processed by GIMS is classified as UNCLASSIFIED // For Official Use Only (FOUO), "
        "also known as Controlled Unclassified Information (CUI). The system is designed to handle CUI "
        "in compliance with Executive Order 13556 and the CUI Regulation (32 CFR Part 2002). No "
        "classified data is processed by the system, and all data sources are limited to publicly "
        "available open-source information."
    ))

    elements.append(P("<b>Encryption:</b>", style_body))
    elements.append(P(
        "All data at rest is encrypted using AES-256 encryption via AWS KMS (Key Management Service) "
        "with customer-managed keys. Database-level encryption (TDE) provides an additional layer of "
        "protection. All data in transit is encrypted using TLS 1.3, with HSTS headers enforced on all "
        "API endpoints. Certificate pinning is implemented for mobile clients."
    ))

    elements.append(P("<b>Access Control:</b>", style_body))
    elements.append(P(
        "Role-based access control (RBAC) is implemented at both the API and database layers. User roles "
        "include Administrator, Analyst, and Viewer, each with progressively restricted permissions. "
        "Authentication uses JWT tokens with a 15-minute expiration and refresh token rotation. All "
        "authentication events are logged to an immutable audit trail stored in a separate security "
        "logging database."
    ))

    elements.append(P("<b>API Security:</b>", style_body))
    elements.append(P(
        "Rate limiting is enforced at 100 requests per minute per user (configurable per role). API "
        "keys are required for all programmatic access and are subject to automatic rotation every 90 "
        "days. Input validation and parameterized queries prevent SQL injection, and output encoding "
        "prevents cross-site scripting. The API gateway implements IP allowlisting for internal services."
    ))

    elements.append(P("<b>Source Reliability & Misinformation Detection:</b>", style_body))
    elements.append(P(
        "Each data source is assigned a reliability score (0-100) based on historical accuracy, editorial "
        "standards, and independence. Articles from sources scoring below 40 are flagged for mandatory "
        "analyst review before being included in index calculations. A cross-referencing system compares "
        "reporting across multiple sources and flags claims that appear in only a single source without "
        "independent corroboration. This system helps mitigate the risk of misinformation or deliberate "
        "disinformation campaigns influencing the platform's intelligence outputs."
    ))

    return elements


def build_ai_roadmap():
    """Section 13: AI Integration Roadmap (200+ words)."""
    elements = []
    elements.append(P("13. AI INTEGRATION ROADMAP", style_h1))
    elements.append(hrule())

    elements.append(P(
        "While the current GIMS implementation relies entirely on rule-based processing for its core "
        "analytical functions, the platform has been designed with future AI/ML integration in mind. "
        "The roadmap below outlines a phased approach to introducing machine learning capabilities, "
        "beginning with enhancing existing rule-based components and progressing to entirely new "
        "predictive analytics capabilities. Each phase includes validation against the existing "
        "rule-based baseline to ensure that ML-driven improvements are measurable and do not degrade "
        "output quality."
    ))

    avail_w = PAGE_W - 2 * inch
    ai_data = [
        [header_cell("Phase"), header_cell("Capability"), header_cell("ML Technique"), header_cell("Timeline")],
        [cell("Phase 1"), cell("NER Enhancement"),
         cell("spaCy Transformer models fine-tuned on defense/government corpus for improved entity recognition accuracy"),
         cell("Month 4-5")],
        [cell("Phase 2"), cell("Automated Summarization"),
         cell("BART/T5 sequence-to-sequence models fine-tuned on a curated defense news corpus (50K+ articles)"),
         cell("Month 6-7")],
        [cell("Phase 3"), cell("Anomaly Detection"),
         cell("Isolation Forest for real-time signal anomaly detection; LSTM autoencoders for index trajectory anomalies"),
         cell("Month 8-9")],
        [cell("Phase 4"), cell("Predictive Analytics"),
         cell("Gradient boosting (XGBoost) for short-term index prediction; time-series Transformer models for 90-day forecasts"),
         cell("Month 10-12")],
    ]
    ai_widths = [avail_w*0.10, avail_w*0.18, avail_w*0.52, avail_w*0.20]
    elements.append(make_table(ai_data, ai_widths))
    elements.append(P("Table 13.1: AI/ML Integration Roadmap", style_caption))

    elements.append(P(
        "A critical design principle of the AI integration roadmap is that no ML component will replace "
        "the existing rule-based engine — it will augment it. All ML-generated outputs will include "
        "confidence scores and will be presented alongside rule-based outputs, allowing analysts to "
        "compare and choose the most appropriate basis for their assessments. This approach ensures "
        "that the system maintains its commitment to transparency and explainability even as it "
        "incorporates more sophisticated analytical methods. Additionally, all ML models will be "
        "trained on curated, labeled datasets maintained by human analysts, with regular retraining "
        "cycles to prevent model drift and ensure continued accuracy."
    ))

    return elements


# ─────────────────────────────────────────────────
# Main Build Function
# ─────────────────────────────────────────────────

def build_body_pdf():
    """Generate the body PDF with all sections."""
    doc = TocDocTemplate(
        BODY_PDF,
        pagesize=A4,
        topMargin=0.85*inch,
        bottomMargin=0.85*inch,
        leftMargin=inch,
        rightMargin=inch,
        title="GIMS Technical Architecture",
        author="Intelligence Division",
    )

    story = []

    # Title page (blank - cover will be merged)
    story.append(Spacer(1, 100))
    story.append(P("Global Intelligence Monitoring System (GIMS)", style_title))
    story.append(Spacer(1, 12))
    story.append(P("Technical Architecture & Strategic Intelligence Platform", style_h2))
    story.append(Spacer(1, 8))
    story.append(P("May 2026 | Version 1.0", ParagraphStyle('CenterMuted', parent=style_body, alignment=TA_CENTER, textColor=TEXT_MUTED)))
    story.append(PageBreak())

    # Table of Contents
    story.extend(build_toc())
    story.append(PageBreak())

    # Section 1: Executive Summary
    story.extend(build_executive_summary())
    story.append(PageBreak())

    # Section 2: System Architecture
    story.extend(build_system_architecture())
    story.append(PageBreak())

    # Section 3: Data Ingestion
    story.extend(build_data_ingestion())
    story.append(PageBreak())

    # Section 4: Article Processing
    story.extend(build_article_processing())
    story.append(PageBreak())

    # Section 5: Scoring Engine
    story.extend(build_scoring_engine())
    story.append(PageBreak())

    # Section 6: Forecasting Engine
    story.extend(build_forecasting_engine())
    story.append(PageBreak())

    # Section 7: Database Schema
    story.extend(build_database_schema())
    story.append(PageBreak())

    # Section 8: API Endpoints
    story.extend(build_api_endpoints())
    story.append(PageBreak())

    # Section 9: Frontend Dashboard
    story.extend(build_frontend_dashboard())
    story.append(PageBreak())

    # Section 10: Example Outputs
    story.extend(build_example_outputs())
    story.append(PageBreak())

    # Section 11: Deployment Plan
    story.extend(build_deployment_plan())
    story.append(PageBreak())

    # Section 12: Security
    story.extend(build_security_considerations())
    story.append(PageBreak())

    # Section 13: AI Roadmap
    story.extend(build_ai_roadmap())

    # Build with multiBuild for TOC
    doc.multiBuild(story)
    print(f"Body PDF generated: {BODY_PDF}")


def merge_pdfs():
    """Merge cover PDF and body PDF into final output."""
    writer = PdfWriter()

    # Add cover
    cover_reader = PdfReader(COVER_PDF)
    for page in cover_reader.pages:
        writer.add_page(page)

    # Add body
    body_reader = PdfReader(BODY_PDF)
    for page in body_reader.pages:
        writer.add_page(page)

    with open(FINAL_PDF, 'wb') as f:
        writer.write(f)

    total_pages = len(cover_reader.pages) + len(body_reader.pages)
    print(f"Final PDF merged: {FINAL_PDF} ({total_pages} pages)")
    return total_pages


# ─────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("GIMS Technical Architecture Report Generator")
    print("=" * 60)

    # Step 1: Generate cover
    print("\n[1/4] Generating cover HTML...")
    generate_cover_html()

    # Step 2: Render cover to PDF
    print("\n[2/4] Rendering cover PDF...")
    render_cover_pdf()

    # Step 3: Generate body PDF
    print("\n[3/4] Generating body PDF...")
    build_body_pdf()

    # Step 4: Merge
    print("\n[4/4] Merging PDFs...")
    total_pages = merge_pdfs()

    print("\n" + "=" * 60)
    print(f"DONE: {FINAL_PDF}")
    print(f"Total pages: {total_pages}")
    print("=" * 60)


if __name__ == '__main__':
    main()
