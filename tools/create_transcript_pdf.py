from __future__ import annotations

import re
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

SOURCE = Path(r"C:\Users\User\.codex\attachments\1fde2159-d906-4ee8-823e-898563718d1d\pasted-text.txt")
OUTPUT = Path(r"C:\PROJECTS\SWEET1LIVE\output\pdf\august-31-meeting-conversation.pdf")

INK = colors.HexColor("#241A17")
MUTED = colors.HexColor("#766A65")
PAPER = colors.HexColor("#F8F4EE")
GOLD = colors.HexColor("#B58B2A")
DIVIDER = colors.HexColor("#DED4CA")
SPEAKERS = {
    "Global Solutions": (colors.HexColor("#2F5D62"), colors.HexColor("#EAF3F2")),
    "Kelvin Kibiru Peter": (colors.HexColor("#8B4A35"), colors.HexColor("#F8ECE7")),
    "Stephen Nyansoho": (colors.HexColor("#65528A"), colors.HexColor("#F1EDF8")),
}


def clean(text: str) -> str:
    return (
        text.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2011", "-")
        .replace("\u00a0", " ")
        .strip()
    )


def parse_transcript(raw: str) -> tuple[str, str, list[dict[str, str]]]:
    lines = raw.splitlines()
    title = clean(lines[0]) if lines else "Meeting transcript"
    recording = ""
    turns: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    pattern = re.compile(r"^(\d{1,2}:\d{2}(?::\d{2})?) - (.+)$")

    for line in lines[1:]:
        stripped = line.strip()
        if stripped.startswith("VIEW RECORDING"):
            recording = stripped.split(": ", 1)[-1]
            continue
        match = pattern.match(stripped)
        if match:
            if current:
                turns.append(current)
            speaker = re.sub(r"\s*\([^)]*@[^)]*\)\s*$", "", match.group(2))
            current = {"time": match.group(1), "speaker": clean(speaker), "body": ""}
        elif current and stripped:
            current["body"] = clean(f"{current['body']} {stripped}")
    if current:
        turns.append(current)
    return title, recording, turns


class TranscriptDoc(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=23 * mm,
            bottomMargin=20 * mm,
            title="Impromptu Google Meet Meeting - August 31",
            author="Meeting participants",
            subject="Conversation-style transcript",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates(
            [
                PageTemplate(id="cover", frames=frame, onPage=self.cover_page),
                PageTemplate(id="conversation", frames=frame, onPage=self.conversation_page),
            ]
        )

    def cover_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, A4[0], A4[1], stroke=0, fill=1)
        canvas.setFillColor(GOLD)
        canvas.rect(0, A4[1] - 6 * mm, A4[0], 6 * mm, stroke=0, fill=1)
        canvas.restoreState()

    def conversation_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, A4[0], A4[1], stroke=0, fill=1)
        canvas.setFont("Arial", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, A4[1] - 12 * mm, "IMPROMPTU GOOGLE MEET - AUGUST 31")
        canvas.drawRightString(A4[0] - 20 * mm, 11 * mm, f"{doc.page}")
        canvas.setStrokeColor(DIVIDER)
        canvas.line(20 * mm, A4[1] - 15 * mm, A4[0] - 20 * mm, A4[1] - 15 * mm)
        canvas.restoreState()


def turn_flowables(turn: dict[str, str], styles: dict[str, ParagraphStyle], continued: bool = False):
    speaker = turn["speaker"]
    accent, background = SPEAKERS.get(speaker, (INK, colors.white))
    body = turn["body"]
    if len(body) > 1400:
        chunks: list[str] = []
        current: list[str] = []
        length = 0
        for word in body.split():
            if current and length + len(word) + 1 > 1400:
                chunks.append(" ".join(current))
                current, length = [], 0
            current.append(word)
            length += len(word) + 1
        if current:
            chunks.append(" ".join(current))
        result = []
        for index, chunk in enumerate(chunks):
            result.extend(
                turn_flowables(
                    {**turn, "body": chunk},
                    styles,
                    continued=continued or index > 0,
                )
            )
        return result

    display_speaker = f"{speaker} (continued)" if continued else speaker
    action_parts = re.split(r"(?=ACTION ITEM:)", body)
    main = action_parts[0].strip()
    contents = [
        Paragraph(
            f'<font color="{accent.hexval()}"><b>{escape(display_speaker)}</b></font>'
            f' <font color="{MUTED.hexval()}">  {escape(turn["time"])}</font>',
            styles["speaker"],
        )
    ]
    if main:
        contents.extend([Spacer(1, 2 * mm), Paragraph(escape(main), styles["body"])])
    for action in action_parts[1:]:
        action = re.sub(r"\s*- WATCH:.*$", "", action).strip()
        contents.extend(
            [
                Spacer(1, 3 * mm),
                Table(
                    [[Paragraph(f"<b>{escape(action)}</b>", styles["action"]) ]],
                    colWidths=[145 * mm],
                    style=TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF3C9")),
                            ("BOX", (0, 0), (-1, -1), 0.6, GOLD),
                            ("LEFTPADDING", (0, 0), (-1, -1), 8),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                            ("TOPPADDING", (0, 0), (-1, -1), 6),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                        ]
                    ),
                ),
            ]
        )
    card = Table(
        [[contents]],
        colWidths=[165 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        ),
    )
    return [KeepTogether([card, Spacer(1, 3.2 * mm)])]


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    title, recording, turns = parse_transcript(SOURCE.read_text(encoding="utf-8"))

    pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
    pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
    pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold")

    sample = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle("title", parent=sample["Title"], fontName="Arial-Bold", fontSize=30, leading=36, textColor=INK, alignment=TA_CENTER, spaceAfter=8 * mm),
        "subtitle": ParagraphStyle("subtitle", fontName="Arial", fontSize=12, leading=18, textColor=MUTED, alignment=TA_CENTER),
        "meta": ParagraphStyle("meta", fontName="Arial", fontSize=9, leading=14, textColor=MUTED, alignment=TA_CENTER),
        "speaker": ParagraphStyle("speaker", fontName="Arial", fontSize=9.5, leading=12),
        "body": ParagraphStyle("body", fontName="Arial", fontSize=10.2, leading=15.2, textColor=INK),
        "action": ParagraphStyle("action", fontName="Arial", fontSize=9.3, leading=13, textColor=INK),
    }

    story = [
        Spacer(1, 45 * mm),
        Paragraph("MEETING TRANSCRIPT", styles["meta"]),
        Spacer(1, 5 * mm),
        Paragraph(escape(title), styles["title"]),
        Paragraph("A conversation-style record", styles["subtitle"]),
        Spacer(1, 18 * mm),
        Table(
            [[Paragraph("84 minutes", styles["meta"]), Paragraph("3 speakers", styles["meta"]), Paragraph(f"{len(turns)} turns", styles["meta"])]],
            colWidths=[55 * mm] * 3,
            style=TableStyle([("BOX", (0, 0), (-1, -1), 0.6, DIVIDER), ("INNERGRID", (0, 0), (-1, -1), 0.6, DIVIDER), ("BACKGROUND", (0, 0), (-1, -1), colors.white), ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 9)]),
        ),
        Spacer(1, 16 * mm),
        Paragraph("Participants", styles["meta"]),
        Spacer(1, 4 * mm),
    ]
    for speaker, (accent, _) in SPEAKERS.items():
        story.append(Paragraph(f'<font color="{accent.hexval()}"><b>{escape(speaker)}</b></font>', styles["subtitle"]))
    if recording:
        story.extend([Spacer(1, 14 * mm), Paragraph(f'<link href="{escape(recording)}" color="{GOLD.hexval()}">View the meeting recording</link>', styles["meta"])])
    story.extend([NextPageTemplate("conversation"), PageBreak()])
    for turn in turns:
        story.extend(turn_flowables(turn, styles))

    TranscriptDoc(str(OUTPUT)).build(story)
    print(OUTPUT)


if __name__ == "__main__":
    main()
