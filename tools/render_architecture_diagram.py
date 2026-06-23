from __future__ import annotations

from dataclasses import dataclass
from html import escape
from math import atan2, cos, sin, pi
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "diagrams"
SVG_PATH = OUT_DIR / "agentguard-lab-architecture.svg"
PNG_PATH = OUT_DIR / "agentguard-lab-architecture.png"

WIDTH = 1600
HEIGHT = 1000
FONT_PATH = Path("C:/Windows/Fonts/msyh.ttc")


@dataclass(frozen=True)
class Box:
    key: str
    x: int
    y: int
    w: int
    h: int
    label: str
    fill: str = "#ffffff"
    stroke: str = "#b9c8e3"


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    color: str = "#4f6f9f"
    label: str = ""


BOXES = [
    Box("sample", 110, 190, 260, 92, "左侧面板\n样例库 / Agent 配置\nSystem Prompt\n知识库 / 工具 / 历史对话"),
    Box("case", 415, 190, 280, 92, "中间面板\n测试集生成 / 运行控制\nCase 输入 / 期望 / 输出"),
    Box("result", 740, 190, 280, 92, "右侧面板\n失败归因 / 证据片段\n修复建议 / 可应用补丁"),
    Box("comparison", 1065, 190, 280, 92, "底部面板\nBefore / After 通过率\n剩余风险 / 报告预览"),
    Box("profile", 120, 455, 150, 72, "AgentProfile\n样例 / 用户配置", "#eaf2ff", "#5b82c2"),
    Box("generator", 315, 455, 170, 72, "TestCaseGenerator\n六类可靠性测试", "#eaf2ff", "#5b82c2"),
    Box("runner", 530, 455, 160, 72, "EvaluationRunner\n运行初测", "#eaf2ff", "#5b82c2"),
    Box("judge", 735, 455, 180, 72, "JudgeEngine\n规则判定 / 证据提取", "#fff7e6", "#d79b00"),
    Box("analyzer", 960, 445, 190, 92, "FailureAnalyzer\n知识缺口 / 边界缺失\n工具不清 / 上下文污染", "#fff0f0", "#d46a6a"),
    Box("advisor", 1195, 445, 200, 92, "RepairAdvisor\nPrompt / 知识库 / 工具 schema\n边界规则补丁", "#f0f8ff", "#4f8edb"),
    Box("retest", 660, 555, 230, 52, "RetestComparator\n复测 + Before/After 对比", "#f1fbf5", "#64a878"),
    Box("report", 220, 750, 210, 72, "ReportExporter\nMarkdown / HTML 报告", "#ffffff", "#d6b656"),
    Box("evidence", 535, 740, 240, 92, "CompetitionEvidence\n3 张关键截图\n3 个 Session ID\n报名帖链接 / 体验地址", "#ffffff", "#d6b656"),
    Box("post", 880, 740, 240, 92, "初赛 Demo 帖\n真实场景 + 可体验链接\n创作过程 + 核心价值", "#ffffff", "#d6b656"),
    Box("score", 1225, 740, 220, 92, "高分目标\n10 秒看懂产品\n60 秒跑完闭环\n3 分钟看到修复证据", "#ffffff", "#d6b656"),
]

EDGES = [
    Edge("sample", "case"),
    Edge("case", "result"),
    Edge("result", "comparison"),
    Edge("profile", "generator", "#3f6ea8"),
    Edge("generator", "runner", "#3f6ea8"),
    Edge("runner", "judge", "#3f6ea8"),
    Edge("judge", "analyzer", "#b95a5a"),
    Edge("analyzer", "advisor", "#b95a5a"),
    Edge("advisor", "retest", "#4b8c60", "应用修复"),
    Edge("retest", "report", "#9a7b2f"),
    Edge("report", "evidence", "#9a7b2f"),
    Edge("evidence", "post", "#9a7b2f"),
    Edge("post", "score", "#9a7b2f"),
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
        start = (source.x + source.w if dx > 0 else source.x, sy)
        end = (target.x if dx > 0 else target.x + target.w, ty)
    else:
        start = (sx, source.y + source.h if dy > 0 else source.y)
        end = (tx, target.y if dy > 0 else target.y + target.h)
    return start, end


def draw_arrow(draw: ImageDraw.ImageDraw, start: tuple[float, float], end: tuple[float, float], color: str) -> None:
    draw.line([start, end], fill=color, width=3)
    angle = atan2(end[1] - start[1], end[0] - start[0])
    size = 12
    p1 = end
    p2 = (end[0] - size * cos(angle - pi / 6), end[1] - size * sin(angle - pi / 6))
    p3 = (end[0] - size * cos(angle + pi / 6), end[1] - size * sin(angle + pi / 6))
    draw.polygon([p1, p2, p3], fill=color)


def draw_centered_text(draw: ImageDraw.ImageDraw, box: Box, text_font: ImageFont.FreeTypeFont) -> None:
    lines = box.label.splitlines()
    metrics = [draw.textbbox((0, 0), line, font=text_font) for line in lines]
    heights = [bottom - top for _, top, _, bottom in metrics]
    total_height = sum(heights) + 6 * (len(lines) - 1)
    y = box.y + (box.h - total_height) / 2
    for line, bounds, line_height in zip(lines, metrics, heights):
        line_width = bounds[2] - bounds[0]
        x = box.x + (box.w - line_width) / 2
        draw.text((x, y), line, fill="#172033", font=text_font)
        y += line_height + 6


def svg_text_lines(x: int, y: int, w: int, h: int, label: str, size: int) -> str:
    lines = label.splitlines()
    line_height = int(size * 1.35)
    total_height = line_height * len(lines)
    start_y = y + (h - total_height) / 2 + size
    tspans = []
    for i, line in enumerate(lines):
        tspans.append(f'<tspan x="{x + w / 2:.0f}" y="{start_y + i * line_height:.0f}">{escape(line)}</tspan>')
    return f'<text text-anchor="middle" font-size="{size}" font-family="Microsoft YaHei, Arial" font-weight="700" fill="#172033">{"".join(tspans)}</text>'


def render_svg(boxes: Iterable[Box], edges: Iterable[Edge]) -> str:
    box_by_key = {box.key: box for box in boxes}
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
        "<defs>",
        '<marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 Z" fill="context-stroke"/></marker>',
        "</defs>",
        '<rect width="1600" height="1000" fill="#f6f8fb"/>',
        '<text x="800" y="62" text-anchor="middle" font-family="Microsoft YaHei, Arial" font-size="28" font-weight="700" fill="#172033">AgentGuard Lab：AI Agent 可靠性评测与修复工作台架构图</text>',
        '<text x="800" y="96" text-anchor="middle" font-family="Microsoft YaHei, Arial" font-size="15" fill="#506078">输入 Agent 配置 → 生成测试集 → 运行评测 → 失败归因 → 修复建议 → 复测对比 → 导出报告</text>',
    ]
    for x, y, w, h, title, fill, stroke in [
        (70, 140, 1460, 170, "Web 工作台 UI", "#f7faff", "#9ab6e8"),
        (70, 360, 1460, 260, "核心评测与修复流水线", "#f9fbf7", "#a9c796"),
        (70, 680, 1460, 180, "比赛交付与证据链", "#fffbf0", "#d6b656"),
    ]:
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
        parts.append(f'<text x="{x + 24}" y="{y + 32}" font-family="Microsoft YaHei, Arial" font-size="18" font-weight="700" fill="#172033">{escape(title)}</text>')
    for edge in edges:
        start, end = edge_points(box_by_key[edge.source], box_by_key[edge.target])
        parts.append(
            f'<line x1="{start[0]:.0f}" y1="{start[1]:.0f}" x2="{end[0]:.0f}" y2="{end[1]:.0f}" stroke="{edge.color}" stroke-width="3" marker-end="url(#arrow)"/>'
        )
        if edge.label:
            parts.append(f'<text x="{(start[0] + end[0]) / 2:.0f}" y="{(start[1] + end[1]) / 2 - 8:.0f}" text-anchor="middle" font-family="Microsoft YaHei, Arial" font-size="13" fill="{edge.color}">{escape(edge.label)}</text>')
    for box in boxes:
        parts.append(f'<rect x="{box.x}" y="{box.y}" width="{box.w}" height="{box.h}" rx="8" fill="{box.fill}" stroke="{box.stroke}" stroke-width="2"/>')
        parts.append(svg_text_lines(box.x, box.y, box.w, box.h, box.label, 14))
    parts.append("</svg>")
    return "\n".join(parts)


def render_png() -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#f6f8fb")
    draw = ImageDraw.Draw(image)
    title_font = font(28, bold=True)
    subtitle_font = font(15)
    section_font = font(18, bold=True)
    box_font = font(14, bold=True)
    label_font = font(13)

    draw.text((WIDTH / 2, 52), "AgentGuard Lab：AI Agent 可靠性评测与修复工作台架构图", fill="#172033", font=title_font, anchor="mm")
    draw.text((WIDTH / 2, 92), "输入 Agent 配置 → 生成测试集 → 运行评测 → 失败归因 → 修复建议 → 复测对比 → 导出报告", fill="#506078", font=subtitle_font, anchor="mm")

    for x, y, w, h, title, fill, stroke in [
        (70, 140, 1460, 170, "Web 工作台 UI", "#f7faff", "#9ab6e8"),
        (70, 360, 1460, 260, "核心评测与修复流水线", "#f9fbf7", "#a9c796"),
        (70, 680, 1460, 180, "比赛交付与证据链", "#fffbf0", "#d6b656"),
    ]:
        draw.rounded_rectangle((x, y, x + w, y + h), radius=12, fill=fill, outline=stroke, width=2)
        draw.text((x + 24, y + 26), title, fill="#172033", font=section_font, anchor="lm")

    box_by_key = {box.key: box for box in BOXES}
    for edge in EDGES:
        start, end = edge_points(box_by_key[edge.source], box_by_key[edge.target])
        draw_arrow(draw, start, end, edge.color)
        if edge.label:
            draw.text(((start[0] + end[0]) / 2, (start[1] + end[1]) / 2 - 12), edge.label, fill=edge.color, font=label_font, anchor="mm")

    for box in BOXES:
        draw.rounded_rectangle((box.x, box.y, box.x + box.w, box.y + box.h), radius=8, fill=box.fill, outline=box.stroke, width=2)
        draw_centered_text(draw, box, box_font)

    image.save(PNG_PATH)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SVG_PATH.write_text(render_svg(BOXES, EDGES), encoding="utf-8")
    render_png()
    print(f"wrote {SVG_PATH}")
    print(f"wrote {PNG_PATH}")


if __name__ == "__main__":
    main()
