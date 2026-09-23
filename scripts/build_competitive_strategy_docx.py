#!/usr/bin/env python3

import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt

import build_vexa_docx as base


TITLE = "Vexa Competitive Product Strategy and Nine Day Delivery Plan"
SUBTITLE = "Competitor analysis product differentiation implementation status and delivery priorities"


def add_cover(doc):
    for _ in range(3):
        doc.add_paragraph()

    title = doc.add_paragraph(style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    title.add_run(TITLE)
    title_ppr = title._p.get_or_add_pPr()
    title_border = title_ppr.find(qn("w:pBdr"))
    if title_border is not None:
        title_ppr.remove(title_border)

    subtitle = doc.add_paragraph(style="Document Subtitle")
    subtitle.add_run(SUBTITLE)

    doc.add_paragraph("Prepared for the Vexa product design engineering and leadership team", style="Small Metadata")
    doc.add_paragraph("Version 1.0", style="Small Metadata")
    doc.add_paragraph("18 September 2026", style="Small Metadata")
    doc.add_paragraph("Status Implementation baseline", style="Small Metadata")

    intro = doc.add_paragraph()
    intro.paragraph_format.space_before = Pt(25)
    intro.paragraph_format.line_spacing = 1.2
    run = intro.add_run(
        "This report defines where Vexa should compete, which proven product patterns to adopt, "
        "which market gaps to exploit, what has already been implemented, and what the team must "
        "ship during the remaining nine day window."
    )
    base.set_run_font(run, "Aptos", 11.2, color=base.TEXT)

    conclusion = doc.add_paragraph()
    conclusion.paragraph_format.space_before = Pt(9)
    conclusion.paragraph_format.line_spacing = 1.2
    run = conclusion.add_run(
        "Recommendation: position Vexa as an evidence first Attention OS rather than another AI "
        "inbox or general chatbot. Lead with explainable priorities, relationship and opportunity "
        "intelligence, neutral cross ecosystem context, and one visible approval model for every action."
    )
    base.set_run_font(run, "Aptos", 11.2, bold=True, color=base.PURPLE_DARK)


def add_contents(doc, markdown):
    doc.add_heading("Contents", level=1)
    p = doc.add_paragraph()
    base.add_inline_runs(
        p,
        "The report moves from the market evidence to Vexa's defensible product position and the concrete nine day release plan.",
        10.8,
    )
    for section in base.top_level_sections(markdown):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.18)
        p.paragraph_format.first_line_indent = Inches(-0.18)
        p.paragraph_format.space_after = Pt(3)
        base.set_run_font(p.add_run(section), "Aptos", 9.6, color=base.TEXT)
    doc.add_page_break()


def configure_header(section):
    base.configure_body_section(section)
    header = section.header.paragraphs[0]
    header.clear()
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    base.set_run_font(header.add_run("Vexa Competitive Product Strategy"), "Aptos", 8, color=base.MID_GRAY)


def configure_properties(doc):
    settings = doc.settings._element
    update_fields = OxmlElement("w:updateFields")
    update_fields.set(qn("w:val"), "true")
    settings.append(update_fields)
    core = doc.core_properties
    core.title = TITLE
    core.subject = "Competitor analysis product differentiation and nine day implementation plan"
    core.keywords = "Vexa Kinso competitive strategy product roadmap Attention OS"
    core.author = "Vexa Team"


def strategy_table_widths(headers):
    lowered = [header.lower() for header in headers]
    if lowered == ["capability", "category leaders", "vexa product requirement", "current state"]:
        return [1.25, 1.35, 2.7, 1.5]
    return base.table_widths(headers)


def content_body(markdown):
    match = re.search(r"^## Executive decision\s*$", markdown, flags=re.MULTILINE)
    return markdown[match.start():] if match else markdown


def build(source_path, output_path):
    markdown = source_path.read_text(encoding="utf-8")
    doc = Document()
    base.configure_styles(doc)
    base.configure_cover_section(doc)
    configure_properties(doc)
    add_cover(doc)

    body_section = doc.add_section(WD_SECTION_START.NEW_PAGE)
    configure_header(body_section)
    add_contents(doc, markdown)

    original_widths = base.table_widths
    base.table_widths = strategy_table_widths
    try:
        base.parse_markdown_into_doc(doc, content_body(markdown))
    finally:
        base.table_widths = original_widths

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(output_path)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: build_competitive_strategy_docx.py SOURCE.md OUTPUT.docx")
    build(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == "__main__":
    main()
