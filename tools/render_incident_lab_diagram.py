from __future__ import annotations

from dataclasses import dataclass
from html import escape
from math import atan2, cos, pi, sin
from pathlib import Path
from xml.sax.saxutils import quoteattr

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "diagrams"
DRAWIO_PATH = OUT_DIR / "agent-incident-lab-flow.drawio"
SVG_PATH = OUT_DIR / "agent-incident-lab-flow.svg"
PNG_PATH = OUT_DIR / "agent-incident-lab-flow.png"

WIDTH = 1680
HEIGHT = 1040
FONT_PATH = Path("C:/Windows/Fonts/msyh.ttc")


@dataclass(frozen=True)
class Box:
    key: str
    x: int
    y: int
    w: int
    h: int
    label: str
    fill: str
    stroke: str


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    label: str = ""
    color: str = "#2f5f69"


BOXES = [
    Box("brief", 90, 190, 230, 96, "事故简报\n课程助教错误承诺延期", "#fff7e8", "#b66a13"),
    Box("evidence", 385, 190, 250, 96, "资料源与证据\n公告 / 作业要求 / 边界规则", "#eef8f6", "#0f766e"),
    Box("raw", 680, 190, 250, 96, "原始 Agent 回答\n迟交三天 / 不影响成绩", "#fff1f2", "#be123c"),
    Box("tests", 975, 190, 250, 96, "事故对抗测试\n延期 / 成绩 / 传闻污染", "#f5f3ff", "#6d28d9"),
    Box("findings", 1270, 190, 250, 96, "失败证据链\nquote + evidence + impact", "#fff1f2", "#be123c"),
    Box("report", 385, 500, 250, 104, "事故复盘报告\n证据 / 补丁 / 剩余风险", "#fffbeb", "#ca8a04"),
    Box("compare", 680, 500, 250, 104, "Before / After\n高风险失败消失", "#f0fdf4", "#15803d"),
    Box("replay", 975, 500, 250, 104, "修复后回放\n拒绝无依据确认并建议转人工", "#f0fdf4", "#15803d"),
    Box("patch", 1270, 500, 250, 104, "修复补丁\nPrompt / 知识库 / 上下文策略", "#ecfeff", "#0891b2"),
    Box("guard", 90, 790, 250, 92, "迁移保护\n旁路构建，验收后切主入口", "#ffffff", "#64748b"),
    Box("p0", 385, 790, 250, 92, "P0：可信闭环\n一个真实事故跑通", "#ffffff", "#64748b"),
    Box("p1", 680, 790, 250, 92, "P1：展示质量\n时间线 / diff / 响应式", "#ffffff", "#64748b"),
    Box("future", 975, 790, 250, 92, "复赛扩展\n真实 API / 上传 / CI 回归", "#ffffff", "#64748b"),
]

EDGES = [
    Edge("brief", "evidence"),
    Edge("evidence", "raw"),
    Edge("raw", "tests"),
    Edge("tests", "findings"),
    Edge("findings", "patch", "生成修复计划", "#be123c"),
    Edge("patch", "replay"),
    Edge("replay", "compare"),
    Edge("compare", "report"),
    Edge("guard", "p0", "保护"),
    Edge("p0", "p1"),
    Edge("p1", "future", "后续"),
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    index = 1 if bold else 0
    return ImageFont.truetype(str(FONT_PATH), size=size, index=index)


def center(box: Box) -> tuple[float, float]:
    return box.x + box.w / 2, box.y + box.h / 2


def edge_points(source: Box, target: Box) -> tuple[tuple[float, float], tuple[float, float]]:
    sx, sy = center(source)
    tx, ty = center(target)
    dx = tx - sx
    dy = ty - sy
    if abs(dx) >= abs(dy):
        return (source.x + source.w if dx > 0 else source.x, sy), (target.x if dx > 0 else target.x + target.w, ty)
    return (sx, source.y + source.h if dy > 0 else source.y), (tx, target.y if dy > 0 else target.y + target.h)


def draw_arrow(draw: ImageDraw.ImageDraw, start: tuple[float, float], end: tuple[float, float], color: str) -> None:
    draw.line([start, end], fill=color, width=3)
    angle = atan2(end[1] - start[1], end[0] - start[0])
    size = 13
    p1 = end
    p2 = (end[0] - size * cos(angle - pi / 6), end[1] - size * sin(angle - pi / 6))
    p3 = (end[0] - size * cos(angle + pi / 6), end[1] - size * sin(angle + pi / 6))
    draw.polygon([p1, p2, p3], fill=color)


def draw_centered_text(draw: ImageDraw.ImageDraw, box: Box, text_font: ImageFont.FreeTypeFont) -> None:
    lines = box.label.splitlines()
    metrics = [draw.textbbox((0, 0), line, font=text_font) for line in lines]
    heights = [bottom - top for _, top, _, bottom in metrics]
    total_height = sum(heights) + 8 * (len(lines) - 1)
    y = box.y + (box.h - total_height) / 2
    for line, bounds, line_height in zip(lines, metrics, heights):
        line_width = bounds[2] - bounds[0]
        x = box.x + (box.w - line_width) / 2
        draw.text((x, y), line, fill="#17201e", font=text_font)
        y += line_height + 8


def svg_text(box: Box) -> str:
    lines = box.label.splitlines()
    line_height = 22
    start_y = box.y + (box.h - line_height * len(lines)) / 2 + 17
    tspans = [
        f'<tspan x="{box.x + box.w / 2:.0f}" y="{start_y + i * line_height:.0f}">{escape(line)}</tspan>'
        for i, line in enumerate(lines)
    ]
    return (
        '<text text-anchor="middle" font-size="16" font-family="Microsoft YaHei, Arial" '
        f'font-weight="700" fill="#17201e">{"".join(tspans)}</text>'
    )


def render_svg() -> str:
    box_by_key = {box.key: box for box in BOXES}
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
        "<defs>",
        '<marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 Z" fill="context-stroke"/></marker>',
        "</defs>",
        f'<rect width="{WIDTH}" height="{HEIGHT}" fill="#eef2f1"/>',
        '<text x="840" y="70" text-anchor="middle" font-family="Microsoft YaHei, Arial" font-size="34" font-weight="800" fill="#17201e">Agent Incident Lab：事故回放与修复架构</text>',
        '<text x="840" y="112" text-anchor="middle" font-family="Microsoft YaHei, Arial" font-size="17" fill="#43504c">从一次真实 Agent 错答出发：资料源 → 原始回答 → 对抗测试 → 证据链 → 修复补丁 → 回放对比 → 复盘报告</text>',
    ]
    for x, y, w, h, title in [
        (60, 150, 1560, 180, "P0 演示主线：可信事故闭环"),
        (60, 440, 1560, 220, "修复与回放"),
        (60, 730, 1560, 190, "交付边界与迁移保护"),
    ]:
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="#ffffff" stroke="#c9d3cf" stroke-width="2"/>')
        parts.append(f'<text x="{x + 24}" y="{y + 34}" font-family="Microsoft YaHei, Arial" font-size="18" font-weight="800" fill="#17201e">{escape(title)}</text>')
    for edge in EDGES:
        start, end = edge_points(box_by_key[edge.source], box_by_key[edge.target])
        parts.append(
            f'<line x1="{start[0]:.0f}" y1="{start[1]:.0f}" x2="{end[0]:.0f}" y2="{end[1]:.0f}" stroke="{edge.color}" stroke-width="3" marker-end="url(#arrow)"/>'
        )
        if edge.label:
            parts.append(f'<text x="{(start[0] + end[0]) / 2:.0f}" y="{(start[1] + end[1]) / 2 - 9:.0f}" text-anchor="middle" font-family="Microsoft YaHei, Arial" font-size="14" font-weight="700" fill="{edge.color}">{escape(edge.label)}</text>')
    for box in BOXES:
        parts.append(f'<rect x="{box.x}" y="{box.y}" width="{box.w}" height="{box.h}" rx="8" fill="{box.fill}" stroke="{box.stroke}" stroke-width="2"/>')
        parts.append(svg_text(box))
    parts.append("</svg>")
    return "\n".join(parts)


def render_png() -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#eef2f1")
    draw = ImageDraw.Draw(image)
    title_font = font(34, True)
    subtitle_font = font(17)
    section_font = font(18, True)
    box_font = font(16, True)
    label_font = font(14, True)

    draw.text((WIDTH / 2, 66), "Agent Incident Lab：事故回放与修复架构", fill="#17201e", font=title_font, anchor="mm")
    draw.text((WIDTH / 2, 110), "从一次真实 Agent 错答出发：资料源 → 原始回答 → 对抗测试 → 证据链 → 修复补丁 → 回放对比 → 复盘报告", fill="#43504c", font=subtitle_font, anchor="mm")

    for x, y, w, h, title in [
        (60, 150, 1560, 180, "P0 演示主线：可信事故闭环"),
        (60, 440, 1560, 220, "修复与回放"),
        (60, 730, 1560, 190, "交付边界与迁移保护"),
    ]:
        draw.rounded_rectangle((x, y, x + w, y + h), radius=14, fill="#ffffff", outline="#c9d3cf", width=2)
        draw.text((x + 24, y + 32), title, fill="#17201e", font=section_font, anchor="lm")

    box_by_key = {box.key: box for box in BOXES}
    for edge in EDGES:
        start, end = edge_points(box_by_key[edge.source], box_by_key[edge.target])
        draw_arrow(draw, start, end, edge.color)
        if edge.label:
            draw.text(((start[0] + end[0]) / 2, (start[1] + end[1]) / 2 - 13), edge.label, fill=edge.color, font=label_font, anchor="mm")

    for box in BOXES:
        draw.rounded_rectangle((box.x, box.y, box.x + box.w, box.y + box.h), radius=8, fill=box.fill, outline=box.stroke, width=2)
        draw_centered_text(draw, box, box_font)

    image.save(PNG_PATH)


def drawio_style(box: Box) -> str:
    return (
        "rounded=1;whiteSpace=wrap;html=1;"
        f"fillColor={box.fill};strokeColor={box.stroke};"
        "fontFamily=Microsoft YaHei;fontSize=16;fontStyle=1;"
    )


def render_drawio() -> str:
    cells = [
        '<mxCell id="0"/>',
        '<mxCell id="1" parent="0"/>',
    ]
    for box in BOXES:
        value = escape(box.label).replace("\n", "&lt;br&gt;")
        cells.append(
            f'<mxCell id="{box.key}" value={quoteattr(value)} style={quoteattr(drawio_style(box))} vertex="1" parent="1">'
            f'<mxGeometry x="{box.x}" y="{box.y}" width="{box.w}" height="{box.h}" as="geometry"/></mxCell>'
        )
    for index, edge in enumerate(EDGES, start=1):
        style = f"endArrow=block;html=1;rounded=0;strokeWidth=3;strokeColor={edge.color};fontFamily=Microsoft YaHei;fontSize=13;fontStyle=1;"
        cells.append(
            f'<mxCell id="edge{index}" value={quoteattr(escape(edge.label))} style={quoteattr(style)} edge="1" parent="1" source="{edge.source}" target="{edge.target}">'
            '<mxGeometry relative="1" as="geometry"/></mxCell>'
        )
    content = "".join(cells)
    return (
        '<mxfile host="app.diagrams.net" modified="2026-06-23T00:00:00.000Z" agent="Codex" version="24.7.17">'
        '<diagram id="agent-incident-lab" name="Agent Incident Lab Flow">'
        f'<mxGraphModel dx="1680" dy="1040" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{WIDTH}" pageHeight="{HEIGHT}" math="0" shadow="0"><root>{content}</root></mxGraphModel>'
        '</diagram></mxfile>'
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DRAWIO_PATH.write_text(render_drawio(), encoding="utf-8")
    SVG_PATH.write_text(render_svg(), encoding="utf-8")
    render_png()
    print(f"wrote {DRAWIO_PATH}")
    print(f"wrote {SVG_PATH}")
    print(f"wrote {PNG_PATH}")


if __name__ == "__main__":
    main()
