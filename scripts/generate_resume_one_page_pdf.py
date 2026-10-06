from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, HRFlowable, PageTemplate, Paragraph, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "liu-yuanlong-resume-one-page.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)


def register_fonts():
    regular = "/System/Library/Fonts/STHeiti Light.ttc"
    bold = "/System/Library/Fonts/STHeiti Medium.ttc"
    try:
        pdfmetrics.registerFont(TTFont("ResumeOnePage", regular, subfontIndex=0))
        pdfmetrics.registerFont(TTFont("ResumeOnePage-Bold", bold, subfontIndex=0))
    except TypeError:
        pdfmetrics.registerFont(TTFont("ResumeOnePage", regular))
        pdfmetrics.registerFont(TTFont("ResumeOnePage-Bold", bold))
    return "ResumeOnePage", "ResumeOnePage-Bold"


REGULAR, BOLD = register_fonts()
INK = colors.HexColor("#18272b")
MUTED = colors.HexColor("#5c6d70")
TEAL = colors.HexColor("#147f83")
LINE = colors.HexColor("#b9c7c6")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Name", fontName=BOLD, fontSize=18, leading=21, alignment=TA_CENTER, textColor=INK))
styles.add(ParagraphStyle(name="Contact", fontName=REGULAR, fontSize=7.6, leading=9.5, alignment=TA_CENTER, textColor=MUTED))
styles.add(ParagraphStyle(name="Section", fontName=BOLD, fontSize=10.8, leading=13, textColor=INK, spaceBefore=4, spaceAfter=2))
styles.add(ParagraphStyle(name="Body", fontName=REGULAR, fontSize=8.0, leading=10.2, textColor=INK, spaceAfter=1.3))
styles.add(ParagraphStyle(name="Muted", parent=styles["Body"], textColor=MUTED))
styles.add(ParagraphStyle(name="Label", fontName=BOLD, fontSize=7.7, leading=9.2, textColor=TEAL))
styles.add(ParagraphStyle(name="Company", fontName=BOLD, fontSize=8.6, leading=10.5, textColor=INK))
styles.add(ParagraphStyle(name="Meta", fontName=REGULAR, fontSize=7.4, leading=9, alignment=TA_RIGHT, textColor=MUTED))
styles.add(ParagraphStyle(name="Project", fontName=BOLD, fontSize=8.1, leading=9.8, textColor=INK))


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def section(title):
    return [Spacer(1, 2), p(title, "Section"), HRFlowable(width="100%", thickness=0.65, color=INK, spaceBefore=0, spaceAfter=3)]


def bullet(text):
    return p("• " + text)


def footer(canvas, doc):
    canvas.saveState()
    width, _ = A4
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(14 * mm, 10 * mm, width - 14 * mm, 10 * mm)
    canvas.setFont(REGULAR, 6.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(14 * mm, 6.3 * mm, "刘元龙 · C++ / Qt / 全栈软件工程师")
    canvas.drawRightString(width - 14 * mm, 6.3 * mm, str(doc.page))
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT), pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm,
    topMargin=10 * mm, bottomMargin=14 * mm, title="刘元龙一页精简版简历", author="刘元龙",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="one-page")
doc.addPageTemplates([PageTemplate(id="resume", frames=frame, onPage=footer)])

story = [
    p("刘元龙", "Name"),
    p("15370348006（微信同号）  |  leslie_mc@163.com  |  苏州", "Contact"),
    p("GitHub: <link href=\"https://github.com/biglone\">github.com/biglone</link>  |  个人网站: <link href=\"https://resume.biglone.tech\">resume.biglone.tech</link>", "Contact"),
    p("高级 C++/Qt · 全栈软件工程师  |  期望薪资：35K-50K", "Contact"),
    Spacer(1, 3),
]

story += section("职业定位")
story.append(p("近10年软件开发经验，以 C++/Qt 跨平台桌面与音频设备软件为主，兼具 React/TypeScript、Go、Electron 和 Python 全栈交付能力。擅长实时数据链路、设备协议、性能优化、故障定位与从开发到部署的工程闭环。"))

story += section("核心能力")
skills = [
    [p("C++ / 桌面", "Label"), p("C++17、Qt/QML、Qt Graphics、CMake/vcpkg、并发、TCP/IP、Windows/Linux/macOS", "Body"), p("全栈 / 服务", "Label"), p("React、Vue、TypeScript、Go、Python、C#/.NET、Electron、REST/WebSocket、SQLite/MySQL/PostgreSQL", "Body")],
    [p("音频 / 视觉", "Label"), p("OpenCV、FFmpeg、CUDA、FIR/IIR、混音/降噪、ORB、TTS、实时帧处理", "Body"), p("交付 / 质量", "Label"), p("Docker、GitLab CI、GitHub Actions、GoogleTest、Playwright、Jetson 部署", "Body")],
]
story.append(Table(skills, colWidths=[27 * mm, 64 * mm, 27 * mm, 64 * mm], style=TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
])))

story += section("工作经历")
experience_rows = [
    [p("苏州清声学科技有限公司", "Company"), p("软件开发工程师 · 2022.10-至今", "Meta")],
    [p("", "Body"), p("• 负责多个声学与设备软件模块开发，参与声学监控、声学成像、设备控制、Web 管理端和产测平台建设，覆盖 C++/Qt、React/Vue、Electron、C#/WPF。<br/>• 参与 C++ 设备端、React/Vue 管理端与接口服务协作，处理采集→分析→定位→取证链路、设备协议、状态同步和报告交付。<br/>• 优化 CUDA 热点约 35→16ms、25→3ms、30→4ms；参与 2 秒短事件/5 秒长事件证据链路和 Windows/Linux 跨平台发布。", "Body")],
    [p("苏州汇川技术有限公司", "Company"), p("软件开发工程师 · 2021.04-2022.10", "Meta")],
    [p("", "Body"), p("• 参与监控系统图形组态子系统的技术预研、技术选型和概要设计，负责属性子系统架构与模块实现。<br/>• 基于 Qt Graphics 设计自定义图元及编辑行为，处理对象模型、属性面板、选中/移动和状态同步等交互边界。", "Body")],
    [p("苏州梦想人软件科技有限公司", "Company"), p("C++开发工程师 · 2019.08-2021.03", "Meta")],
    [p("", "Body"), p("• 主导 Qt 编辑器维护、定制版本开发、代码重构和性能优化，梳理公共能力与定制版本边界，改善稳定性和内容制作效率。<br/>• 负责 AR SDK 图像识别与跟踪优化，通过 OpenCV 图像预处理、ORB 特征参数调整和失败样本分析，提升图书页识别与跟踪稳定性。", "Body")],
    [p("苏州广立信息技术有限公司", "Company"), p("软件工程师 · 2016.05-2019.08", "Meta")],
    [p("", "Body"), p("• 负责 Qt 即时通讯和智慧校园 PC 客户端，覆盖 TCP/IP、SQLite/MySQL、Linux 以及班级、事务、应急消息等业务模块。<br/>• 独立交付截图、图片浏览、文件管理和上线提醒模块，处理剪贴板、文件生命周期、消息状态和异常反馈等桌面交互问题。", "Body")],
]
story.append(Table(experience_rows, colWidths=[52 * mm, 130 * mm], style=TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4), ("TOPPADDING", (0, 0), (-1, -1), 1),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 1), ("SPAN", (0, 1), (0, 1)),
    ("SPAN", (0, 3), (0, 3)), ("SPAN", (0, 5), (0, 5)), ("SPAN", (0, 7), (0, 7)),
])))

story += section("精选项目")
projects = [
    [p("声学监控与设备软件", "Project"), p("C++/Qt、OpenCV、FFmpeg、CUDA、MQTT；覆盖采集→分析→定位→取证、设备状态闭环和跨平台交付。", "Body")],
    [p("AI 工具链", "Project"), p("CodeHarbor / Plover：TypeScript/Node.js、Matrix、Python、gRPC；覆盖多模型任务编排、会话持久化、GUI 自动化、可回放执行和 E2E 测试。", "Body")],
    [p("AI 与边缘语音", "Project"), p("C++/Python、RAG、Qwen3-TTS、Jetson；实践推理优化、代码检索、流式/SSE 音频输出与 GPU 部署。", "Body")],
]
story.append(Table(projects, colWidths=[32 * mm, 150 * mm], style=TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
])))

story += section("教育与其他")
story.append(p("昆明理工大学 · 计算机系统结构硕士（2013.09-2016.06）　|　淮阴工学院 · 计算机科学与技术本科（2009.09-2013.06）"))
story.append(p("英语 CET-6 · 计算机三级"))
story.append(p("求职方向：高级 C++/Qt、跨平台桌面与音频设备软件，兼顾 Web 全栈与实时系统开发。"))

doc.build(story)
print(OUTPUT)
