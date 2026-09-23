#!/usr/bin/env python3

import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


PURPLE = "3D3470"
PURPLE_DARK = "241D47"
PURPLE_LIGHT = "F1EFF8"
PALE_BLUE = "F3F6FC"
LIGHT_GRAY = "D9D9D9"
MID_GRAY = "666666"
TEXT = "181A24"
WHITE = "FFFFFF"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, color=LIGHT_GRAY, size="4"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        node = borders.find(qn(tag))
        if node is None:
            node = OxmlElement(tag)
            borders.append(node)
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), size)
        node.set(qn("w:space"), "0")
        node.set(qn("w:color"), color)


def set_cell_margins(cell, top=90, start=100, bottom=90, end=100):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn("w:" + margin))
        if node is None:
            node = OxmlElement("w:" + margin)
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def prevent_row_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    tr_pr.append(cant_split)


def repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_repeat_header(row):
    repeat_table_header(row)


def set_col_width(cell, inches):
    cell.width = Inches(inches)
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(int(inches * 1440)))
    tc_w.set(qn("w:type"), "dxa")


def set_run_font(run, name, size=None, bold=None, italic=None, color=None):
    run.font.name = name
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:hAnsi"), name)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if color is not None:
        run.font.color.rgb = RGBColor.from_string(color)


def normalize_text(text):
    replacements = {
        "\u2013": "-",
        "\u2014": " - ",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u00a0": " ",
        "\u2192": "->",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def clean_heading(text, top_level=False):
    text = normalize_text(text.strip())
    if top_level:
        text = re.sub(r"^(\d+)\.\s*", r"\1 ", text)
    else:
        text = re.sub(r"^\d+(?:\.\d+)+\s*", "", text)
    text = text.replace("&", "and")
    text = re.sub(r"[^A-Za-z0-9 ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def add_inline_runs(paragraph, text, base_size=10.5, color=TEXT):
    text = normalize_text(text)
    pattern = re.compile(r"(\*\*.+?\*\*|`.+?`)")
    pos = 0
    for match in pattern.finditer(text):
        if match.start() > pos:
            run = paragraph.add_run(text[pos:match.start()])
            set_run_font(run, "Aptos", base_size, color=color)
        token = match.group(0)
        if token.startswith("**"):
            run = paragraph.add_run(token[2:-2])
            set_run_font(run, "Aptos", base_size, bold=True, color=color)
        else:
            run = paragraph.add_run(token[1:-1])
            set_run_font(run, "Aptos Mono", max(9, base_size - 0.5), color=color)
        pos = match.end()
    if pos < len(text):
        run = paragraph.add_run(text[pos:])
        set_run_font(run, "Aptos", base_size, color=color)


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run("Page ")
    set_run_font(run, "Aptos", 8.5, color=MID_GRAY)
    field = OxmlElement("w:fldSimple")
    field.set(qn("w:instr"), "PAGE")
    text_run = OxmlElement("w:r")
    run_properties = OxmlElement("w:rPr")
    run_fonts = OxmlElement("w:rFonts")
    run_fonts.set(qn("w:ascii"), "Aptos")
    run_fonts.set(qn("w:hAnsi"), "Aptos")
    font_size = OxmlElement("w:sz")
    font_size.set(qn("w:val"), "17")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), MID_GRAY)
    run_properties.extend([run_fonts, font_size, color])
    text = OxmlElement("w:t")
    text.text = "1"
    text_run.extend([run_properties, text])
    field.append(text_run)
    paragraph._p.append(field)


def add_manual_list_item(doc, text, number=None, size=10.3):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.31)
    p.paragraph_format.first_line_indent = Inches(-0.23)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.08
    marker = f"{number}." if number is not None else "\u2022"
    marker_run = p.add_run(marker + "  ")
    set_run_font(marker_run, "Aptos", size, color=TEXT)
    add_inline_runs(p, text, size)
    return p


def configure_styles(doc):
    styles = doc.styles

    normal = styles["Normal"]
    normal.font.name = "Aptos"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor.from_string(TEXT)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.12

    title = styles["Title"]
    title.font.name = "Aptos Display"
    title._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
    title._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
    title.font.size = Pt(29)
    title.font.bold = True
    title.font.color.rgb = RGBColor(0, 0, 0)
    title.paragraph_format.space_after = Pt(14)
    title_ppr = title._element.get_or_add_pPr()
    title_border = title_ppr.find(qn("w:pBdr"))
    if title_border is not None:
        title_ppr.remove(title_border)

    for style_name, size, before, after in (
        ("Heading 1", 17, 16, 7),
        ("Heading 2", 13, 12, 5),
        ("Heading 3", 11.5, 9, 4),
    ):
        style = styles[style_name]
        style.font.name = "Aptos Display"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True

    for style_name in ("List Bullet", "List Number"):
        style = styles[style_name]
        style.font.name = "Aptos"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
        style.font.size = Pt(10.3)
        style.font.color.rgb = RGBColor.from_string(TEXT)
        style.paragraph_format.space_after = Pt(2.5)
        style.paragraph_format.line_spacing = 1.08

    if "Document Subtitle" not in styles:
        subtitle = styles.add_style("Document Subtitle", WD_STYLE_TYPE.PARAGRAPH)
    else:
        subtitle = styles["Document Subtitle"]
    subtitle.font.name = "Aptos"
    subtitle._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    subtitle._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    subtitle.font.size = Pt(14)
    subtitle.font.color.rgb = RGBColor.from_string(PURPLE_DARK)
    subtitle.paragraph_format.space_after = Pt(18)

    if "Small Metadata" not in styles:
        metadata = styles.add_style("Small Metadata", WD_STYLE_TYPE.PARAGRAPH)
    else:
        metadata = styles["Small Metadata"]
    metadata.font.name = "Aptos"
    metadata._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
    metadata._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
    metadata.font.size = Pt(9.5)
    metadata.font.color.rgb = RGBColor.from_string(MID_GRAY)
    metadata.paragraph_format.space_after = Pt(3)


def add_cover(doc):
    for _ in range(4):
        doc.add_paragraph()

    title = doc.add_paragraph(style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    title.add_run("Vexa Product Requirements and Delivery Plan")
    title_ppr = title._p.get_or_add_pPr()
    title_border = title_ppr.find(qn("w:pBdr"))
    if title_border is not None:
        title_ppr.remove(title_border)

    subtitle = doc.add_paragraph(style="Document Subtitle")
    subtitle.add_run("Product requirements technical recommendations complete work breakdown and nine day demo plan")

    doc.add_paragraph("Prepared for the Vexa team", style="Small Metadata")
    doc.add_paragraph("Version 1.0", style="Small Metadata")
    doc.add_paragraph("18 September 2026", style="Small Metadata")
    doc.add_paragraph("Status Draft for team review and implementation", style="Small Metadata")

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(24)
    run = p.add_run(
        "This document consolidates the original Vexa HTML briefing, the complete implementation scope, "
        "recommended architecture, delivery priorities, acceptance criteria, risks, and team decisions."
    )
    set_run_font(run, "Aptos", 11, color=TEXT)
    p.paragraph_format.line_spacing = 1.2


def add_executive_summary(doc):
    doc.add_heading("Executive Summary", level=1)
    p = doc.add_paragraph()
    add_inline_runs(
        p,
        "The team can deliver a credible Vexa demonstration within nine calendar days if it proves the complete "
        "Vexa interaction with a limited set of live integrations. Building every documented integration and "
        "production control in that period is not realistic from a greenfield repository.",
        11,
    )

    p = doc.add_paragraph()
    add_inline_runs(
        p,
        "The recommended demonstration uses Gmail, Google Calendar, Google Drive, one messaging service, and one "
        "news source as live connections. Platforms blocked by credentials or application review should use "
        "fixture-backed adapters that share the production connector contract.",
        11,
    )

    for item in (
        "The primary journey is a proactive briefing that combines multiple sources and identifies what needs attention.",
        "The Orb answers cross-source questions with inspectable citations and states when information may be incomplete.",
        "Vexa prepares an action in the user's style and requires approval of the exact destination and payload before execution.",
        "Protect displays connected access, source history, approvals, execution results, export controls, and deletion controls.",
    ):
        add_manual_list_item(doc, item)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    add_inline_runs(
        p,
        "Immediate team decision: approve the demo journeys, live integration set, ownership, credentials, and success "
        "criteria before implementation begins.",
        10.5,
    )


def top_level_sections(markdown):
    sections = []
    for line in markdown.splitlines():
        if line.startswith("## "):
            sections.append(clean_heading(line[3:], top_level=True))
    return sections


def add_contents(doc, sections):
    doc.add_page_break()
    doc.add_heading("Contents", level=1)
    intro = doc.add_paragraph()
    add_inline_runs(intro, "The contents list covers the product specification, delivery plan, and complete implementation work breakdown.")
    for section in sections:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.18)
        p.paragraph_format.first_line_indent = Inches(-0.18)
        p.paragraph_format.space_after = Pt(2.5)
        run = p.add_run(section)
        set_run_font(run, "Aptos", 9.4, color=TEXT)
    doc.add_page_break()


def table_widths(headers):
    lowered = [h.lower() for h in headers]
    count = len(headers)
    if lowered == ["id", "work item", "target"]:
        return [0.72, 5.25, 0.85]
    if lowered == ["day", "outcome"]:
        return [0.8, 6.0]
    if count == 2 and lowered[0] == "id":
        return [1.0, 5.8]
    if count == 2 and lowered[0] == "entity":
        return [2.0, 4.8]
    if count == 2 and lowered[0] == "category":
        return [2.2, 4.6]
    if count == 2:
        return [2.0, 4.8]
    if count == 3 and "risk" in lowered:
        return [1.45, 1.65, 3.7]
    if count == 3:
        return [1.35, 3.95, 1.5]
    return [6.8 / count] * count


def add_table(doc, rows):
    if not rows:
        return
    headers = rows[0]
    widths = table_widths(headers)
    table = doc.add_table(rows=len(rows), cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.style = "Table Grid"

    for col_index, width in enumerate(widths):
        table.columns[col_index].width = Inches(width)
    grid_columns = table._tbl.tblGrid.gridCol_lst
    for col_index, width in enumerate(widths):
        if col_index < len(grid_columns):
            grid_columns[col_index].set(qn("w:w"), str(int(width * 1440)))

    first_header = headers[0].strip().lower()
    id_column = first_header == "id"
    entity_column = first_header == "entity"
    day_column = first_header == "day"

    for r_index, row_values in enumerate(rows):
        row = table.rows[r_index]
        prevent_row_split(row)
        if r_index == 0:
            set_repeat_table_header(row)
        for c_index, value in enumerate(row_values):
            cell = row.cells[c_index]
            set_col_width(cell, widths[c_index])
            set_cell_margins(cell)
            set_cell_border(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if r_index == 0:
                set_cell_shading(cell, PURPLE_DARK)
            elif r_index % 2 == 0:
                set_cell_shading(cell, PURPLE_LIGHT)
            else:
                set_cell_shading(cell, WHITE)

            cell.text = ""
            p = cell.paragraphs[0]
            if c_index == 0 and (id_column or day_column):
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif c_index == len(headers) - 1 and value in ("Demo", "Post-demo"):
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            add_inline_runs(p, value, 8.6, WHITE if r_index == 0 else TEXT)
            for run in p.runs:
                if r_index == 0:
                    run.bold = True
                elif c_index == 0 and (id_column or day_column or entity_column):
                    run.bold = True

    after = doc.add_paragraph()
    after.paragraph_format.space_after = Pt(1)


def parse_markdown_into_doc(doc, markdown):
    lines = markdown.splitlines()
    body_start = 0
    horizontal_rules_seen = 0
    for i, line in enumerate(lines):
        if line.strip() == "---":
            horizontal_rules_seen += 1
            if horizontal_rules_seen == 1:
                body_start = i + 1
                break
    lines = lines[body_start:]

    paragraph_buffer = []
    code_buffer = []
    in_code = False
    major_page_break_sections = {4, 5, 8, 9, 11, 16, 24}

    def flush_paragraph():
        nonlocal paragraph_buffer
        if paragraph_buffer:
            text = " ".join(item.strip() for item in paragraph_buffer).strip()
            if text:
                p = doc.add_paragraph()
                add_inline_runs(p, text)
            paragraph_buffer = []

    i = 0
    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip()

        if line.startswith("```"):
            flush_paragraph()
            if in_code:
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.35)
                p.paragraph_format.right_indent = Inches(0.25)
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(7)
                p.paragraph_format.keep_together = True
                for idx, code_line in enumerate(code_buffer):
                    run = p.add_run(normalize_text(code_line))
                    set_run_font(run, "Aptos Mono", 9.2, color=PURPLE_DARK)
                    if idx < len(code_buffer) - 1:
                        run.add_break()
                code_buffer = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_buffer.append(line)
            i += 1
            continue

        if not line.strip():
            flush_paragraph()
            i += 1
            continue

        if line.strip() == "---":
            flush_paragraph()
            i += 1
            continue

        if line.startswith("## "):
            flush_paragraph()
            heading = clean_heading(line[3:], top_level=True)
            match = re.match(r"^(\d+)\s", heading)
            if match and int(match.group(1)) in major_page_break_sections:
                if doc.paragraphs and doc.paragraphs[-1].text.strip():
                    doc.add_page_break()
            doc.add_heading(heading, level=1)
            i += 1
            continue

        if line.startswith("### "):
            flush_paragraph()
            doc.add_heading(clean_heading(line[4:], top_level=False), level=2)
            i += 1
            continue

        if line.startswith("#### "):
            flush_paragraph()
            doc.add_heading(clean_heading(line[5:], top_level=False), level=3)
            i += 1
            continue

        if line.lstrip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|?\s*:?-{3,}", lines[i + 1]):
            flush_paragraph()
            table_lines = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                table_lines.append(lines[i].strip())
                i += 1
            rows = []
            for index, table_line in enumerate(table_lines):
                values = [normalize_text(v.strip()) for v in table_line.strip("|").split("|")]
                if index == 1 and all(re.match(r"^:?-{3,}:?$", value) for value in values):
                    continue
                rows.append(values)
            add_table(doc, rows)
            continue

        bullet_match = re.match(r"^\s*-\s+(.+)$", line)
        if bullet_match:
            flush_paragraph()
            add_manual_list_item(doc, bullet_match.group(1), size=10.3)
            i += 1
            continue

        numbered_match = re.match(r"^\s*(\d+)\.\s+(.+)$", line)
        if numbered_match:
            flush_paragraph()
            add_manual_list_item(doc, numbered_match.group(2), number=numbered_match.group(1), size=10.3)
            i += 1
            continue

        if line.startswith("> "):
            flush_paragraph()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.35)
            p.paragraph_format.right_indent = Inches(0.3)
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(7)
            run = p.add_run(normalize_text(line[2:]))
            set_run_font(run, "Aptos", 10.5, italic=True, color=PURPLE_DARK)
            i += 1
            continue

        paragraph_buffer.append(line)
        i += 1

    flush_paragraph()


def configure_cover_section(doc):
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.72)
    section.bottom_margin = Inches(0.68)
    section.left_margin = Inches(0.82)
    section.right_margin = Inches(0.82)
    section.header_distance = Inches(0.32)
    section.footer_distance = Inches(0.34)
    section.header.paragraphs[0].text = ""
    section.footer.paragraphs[0].text = ""


def configure_body_section(section):
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.72)
    section.bottom_margin = Inches(0.68)
    section.left_margin = Inches(0.82)
    section.right_margin = Inches(0.82)
    section.header_distance = Inches(0.32)
    section.footer_distance = Inches(0.34)
    section.header.is_linked_to_previous = False
    section.footer.is_linked_to_previous = False

    header = section.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run("Vexa Product Requirements and Delivery Plan")
    set_run_font(run, "Aptos", 8, color=MID_GRAY)

    footer = section.footer
    add_page_number(footer.paragraphs[0])

    sect_pr = section._sectPr
    pg_num_type = sect_pr.find(qn("w:pgNumType"))
    if pg_num_type is None:
        pg_num_type = OxmlElement("w:pgNumType")
        sect_pr.append(pg_num_type)
    pg_num_type.set(qn("w:start"), "1")


def configure_document_properties(doc):

    settings = doc.settings._element
    update_fields = OxmlElement("w:updateFields")
    update_fields.set(qn("w:val"), "true")
    settings.append(update_fields)

    core = doc.core_properties
    core.title = "Vexa Product Requirements and Delivery Plan"
    core.subject = "Product requirements technical recommendations work breakdown and demo delivery plan"
    core.keywords = "Vexa product requirements technical specification implementation plan"


def build(source_path, output_path):
    markdown = source_path.read_text(encoding="utf-8")
    doc = Document()
    configure_styles(doc)
    configure_cover_section(doc)
    configure_document_properties(doc)
    add_cover(doc)
    body_section = doc.add_section(WD_SECTION_START.NEW_PAGE)
    configure_body_section(body_section)
    add_executive_summary(doc)
    add_contents(doc, top_level_sections(markdown))
    parse_markdown_into_doc(doc, markdown)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(output_path)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: build_vexa_docx.py SOURCE.md OUTPUT.docx")
    build(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == "__main__":
    main()
