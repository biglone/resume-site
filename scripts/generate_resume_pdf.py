from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "liu-yuanlong-resume.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)


def register_cjk_fonts():
    candidates = [
        ("/System/Library/Fonts/STHeiti Light.ttc", "/System/Library/Fonts/STHeiti Medium.ttc"),
        ("/System/Library/Fonts/Hiragino Sans GB.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"),
    ]
    for regular, bold in candidates:
        if Path(regular).exists() and Path(bold).exists():
            try:
                pdfmetrics.registerFont(TTFont("ResumeSans", regular, subfontIndex=0))
                pdfmetrics.registerFont(TTFont("ResumeSans-Bold", bold, subfontIndex=0))
                return "ResumeSans", "ResumeSans-Bold"
            except TypeError:
                pdfmetrics.registerFont(TTFont("ResumeSans", regular))
                pdfmetrics.registerFont(TTFont("ResumeSans-Bold", bold))
                return "ResumeSans", "ResumeSans-Bold"
    raise RuntimeError("No Chinese-capable macOS font found")


REGULAR, BOLD = register_cjk_fonts()

INK = colors.HexColor("#14252a")
MUTED = colors.HexColor("#55676b")
TEAL = colors.HexColor("#177f83")
LINE = colors.HexColor("#b9c6c5")
PALE = colors.HexColor("#eef5f3")


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="ResumeName", fontName=BOLD, fontSize=22, leading=25, alignment=TA_CENTER,
    textColor=INK, spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="ResumeContact", fontName=REGULAR, fontSize=9.2, leading=13, alignment=TA_CENTER,
    textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="Section", fontName=BOLD, fontSize=12.2, leading=15, textColor=INK,
    spaceBefore=6, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="SmallLabel", fontName=BOLD, fontSize=8, leading=10, textColor=TEAL,
    spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="Body", fontName=REGULAR, fontSize=8.65, leading=12.2, textColor=INK,
    spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="BodyMuted", parent=styles["Body"], textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="ResumeBullet", parent=styles["Body"], leftIndent=10, firstLineIndent=-6,
    bulletIndent=0, spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="Role", fontName=BOLD, fontSize=9.5, leading=12, textColor=INK,
))
styles.add(ParagraphStyle(
    name="Company", fontName=BOLD, fontSize=10.2, leading=13, textColor=INK,
))
styles.add(ParagraphStyle(
    name="ProjectTitle", fontName=BOLD, fontSize=9.3, leading=12, textColor=INK,
))
styles.add(ParagraphStyle(
    name="ProjectMeta", fontName=REGULAR, fontSize=8, leading=10.5, textColor=TEAL,
))
styles.add(ParagraphStyle(
    name="Footer", fontName=REGULAR, fontSize=7.5, leading=9, textColor=MUTED,
))


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def bullet(text):
    return Paragraph(f"• {text}", styles["ResumeBullet"])


def section(title):
    return [
        Spacer(1, 3),
        p(title, "Section"),
        HRFlowable(width="100%", thickness=0.8, color=INK, spaceBefore=0, spaceAfter=5),
    ]


def right_meta(text):
    return Paragraph(text, ParagraphStyle(
        "RightMeta", parent=styles["BodyMuted"], alignment=TA_RIGHT, fontSize=8.1,
    ))


def experience(company, role, period, location, bullets, projects=None):
    flow = [
        Table([[p(company, "Company"), right_meta(f"{period}<br/>{location}")]], colWidths=[125 * mm, 45 * mm], style=TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ])),
        p(role, "Role"),
    ]
    for item in bullets:
        flow.append(bullet(item))
    if projects:
        for title, items in projects:
            flow.append(Spacer(1, 2))
            flow.append(p(title, "ProjectTitle"))
            for item in items:
                flow.append(bullet(item))
    flow.append(Spacer(1, 4))
    return KeepTogether(flow)


def project(title, meta, description, bullets):
    flow = [p(title, "ProjectTitle"), p(meta, "ProjectMeta"), p(description, "BodyMuted")]
    flow.extend(bullet(item) for item in bullets)
    flow.append(Spacer(1, 4))
    return KeepTogether(flow)


def footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 13 * mm, width - 18 * mm, 13 * mm)
    canvas.setFont(REGULAR, 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 8.5 * mm, "刘元龙 · C++ / Qt / 音频设备软件工程师")
    canvas.drawRightString(width - 18 * mm, 8.5 * mm, f"{doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
    topMargin=14 * mm, bottomMargin=18 * mm,
    title="刘元龙个人简历", author="刘元龙",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="resume", frames=frame, onPage=footer)])

story = []
story += [
    p("刘元龙", "ResumeName"),
    p("15370348006（微信同号）  |  leslie_mc@163.com  |  苏州", "ResumeContact"),
    p("C++ / Qt 跨平台桌面与音频设备软件工程师  |  期望薪资：35K-50K", "ResumeContact"),
    Spacer(1, 7),
]

story += section("个人概况")
story.append(p(
    "10年+软件开发经验，长期专注于 C++/Qt 桌面应用、音频与设备通信、实时音视频和跨平台交付。具备从设备接入、数据处理、算法协作、桌面 UI 到 Web 管理端和部署发布的完整产品经验；同时独立实践 Electron、React、Go、Python、AI Agent、TTS 和 Jetson 边缘部署。擅长在存量系统中做模块拆分、性能优化、故障定位和可测试化改造。"
))

story += section("核心技术栈")
skill_rows = [
    [p("语言与基础", "SmallLabel"), p("C++/C++17、C#/.NET、TypeScript/JavaScript、Python、Go、Rust；数据结构、并发、网络编程、设计模式与代码重构。", "Body")],
    [p("桌面与客户端", "SmallLabel"), p("Qt/QML、Qt Graphics、Electron、WPF/MVVM、Tauri；Windows/Linux/macOS 跨平台构建、安装包、自动更新和现场诊断。", "Body")],
    [p("音频与视觉", "SmallLabel"), p("OpenCV、FFmpeg、CUDA、FIR/IIR、增益/混音/降噪、ORB 特征识别、TTS、sherpa-onnx；音频采集、帧处理、声源定位和报告输出。", "Body")],
    [p("设备与服务", "SmallLabel"), p("串口、TCP/IP、MQTT、HTTP/WebSocket、VISA.NET、Audiobus、ADB/Android Device Owner、SQLite/MySQL/PostgreSQL、OpenAPI。", "Body")],
    [p("工程化", "SmallLabel"), p("CMake/vcpkg、Docker、GitLab CI/GitHub Actions、GoogleTest、Jest/Vitest/Playwright、Velopack、Linux/Jetson。", "Body")],
]
story.append(Table(skill_rows, colWidths=[29 * mm, 141 * mm], style=TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LINEBELOW", (0, 0), (-1, -2), 0.35, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
])))

story += section("工作经历")
story.append(experience(
    "苏州清声学科技有限公司", "软件开发工程师 · 研发部", "2022.10 - 至今", "苏州",
    [
        "参与声学监控、声学成像、空间音频、音频播报和多端设备管理产品，覆盖 C++/Qt/QML、Electron/React、C#/WPF 与 Web 服务。",
    ],
    [
        ("Whistle 智能声学监控平台", [
            "参与音视频接收、解码、分帧、时间同步、识别、声源定位、车牌识别和证据生成链路；面向短事件 2 秒、长事件 5 秒的处理约束。",
            "定位 XMOS 固件 UDP 反射忙等阻塞 uIP 事件循环的问题，推动从重启规避转为根因修复；维护 CMake/vcpkg、Docker 和 GitLab CI 跨平台交付。",
        ]),
        ("Acoustic Camera / ACMS / 设备软件链路", [
            "参与 Qt/QML、OpenCV、FFmpeg、CUDA、MQTT、SQLite 和 React 管理端协作；CUDA 热点优化约 35→16ms、25→3ms、30→4ms。",
            "参与 PTZ、红外摄像头、设备配置、校准、报告、独立部署控制台和实时状态同步，处理硬件时序与 UI 状态一致性。",
        ]),
        ("音频服务、空间音频与产测平台", [
            "参与 ABS 的 HTTP/TCP、TTS 引擎、SSE 日志、协议测试和 Deb/NSIS/Docker 发布；参与 Electron 串口协议、CRC16、IPC 与多平台打包。",
            "参与聚音屏自动化测试平台的 VISA.NET、Audiobus、串口设备库、测试调度、Mock 接口和 Velopack 发布。",
        ]),
    ],
))
story.append(experience(
    "苏州汇川技术有限公司", "软件开发工程师 · 研发管理部", "2021.04 - 2022.10", "苏州",
    [
        "参与 SCADA 图形组态子系统的技术预研、选型、需求/概要设计和模块实现。",
        "负责属性子系统架构设计，以及基于 Qt Graphics Framework 的自定义图元和画布交互开发。",
    ],
))
story.append(experience(
    "苏州梦想人软件科技有限公司", "C++ 开发工程师 · 研发部", "2019.08 - 2021.03", "苏州",
    [
        "主导 Qt 图书制作编辑器维护、定制版本开发、代码重构和性能优化，围绕模块边界和用户制作流程降低维护风险。",
        "基于 OpenCV 优化 AR SDK：通过图像预处理、ORB 特征提取参数调整和真实采集场景验证提升识别与跟踪稳定性。",
    ],
))
story.append(experience(
    "苏州广立信息技术有限公司", "软件工程师 · 研究部", "2016.05 - 2019.08", "苏州",
    [
        "负责 Qt 即时通讯和智慧校园 PC 客户端的功能开发、维护与版本迭代，涉及 TCP/IP、SQLite/MySQL 和 Linux 环境。",
        "独立完成截图工具、图片浏览器、文件管理器、上线提醒等桌面功能模块，并负责班级管理、事务管理和应急消息模块。",
    ],
))

story += section("代表性项目经历")
story.append(project(
    "代码库分析型项目集 · 公司项目",
    "C++/Qt · 音频设备 · 实时处理 · 跨平台工程化",
    "围绕清声学项目形成从底层组件、音频算法、设备控制、桌面工作台到管理端的技术链路。",
    [
        "实时系统：音视频采集/同步、鸣笛识别、声源定位、证据生成和 WebSocket/WebRTC 预览。",
        "设备软件：串口、MQTT、TCP、VISA.NET、Audiobus、ADB/Device Owner，以及设备状态、校准、升级和诊断。",
        "工程交付：CMake/vcpkg、Docker、GitLab CI、GoogleTest、Mock 设备库、Velopack 和跨平台安装发布。",
    ],
))
story.append(project(
    "CodeHarbor AI 多模型 Matrix 网关",
    "独立项目 · TypeScript/Node.js · Matrix · SQLite · Vitest/Playwright",
    "将 Codex、Claude、Gemini CLI 接入 Matrix 房间，处理长任务、会话、附件和多用户并发。",
    [
        "用 SQLite 持久化房间、任务和会话映射，增加重复事件保护、用户/房间/全局限流和 /stop 取消。",
        "抽象图片、语音、生成文件和进度消息适配，支持 Whisper/OpenAI 转写回退、NPM 发布和 GitHub Actions。",
    ],
))
story.append(project(
    "Plover 计划驱动 GUI 自动化",
    "独立项目 · Python/FastAPI · gRPC · React/Vite · Playwright",
    "将 GUI 自动化任务外化为可审查、可修复、可回放的版本化计划。",
    [
        "采用 Planner / Executor / Frontend 分层，支持步骤级结果、失败检测、局部修复、人工审核和运行时间线。",
        "通过真实桌面执行器、Mock executor、Docker、浏览器 E2E 和安全恢复测试验证自动化链路。",
    ],
))
story.append(project(
    "AI 与边缘语音工程实践",
    "个人项目 · C++/Python · RAG · FastAPI · Qwen3-TTS · Jetson",
    "从 C++ 推理优化、RAG 代码问答到 Jetson TTS 服务，形成 AI 工程和边缘部署实践。",
    [
        "AIGC 项目覆盖 KV Cache、INT8、AVX2 SIMD、tree-sitter、ChromaDB、LangChain、MMR 和 Gradio；仓库记录约 30 倍首 token 加速、75% 内存节省等实验目标。",
        "Qwen3-TTS 服务支持 CustomVoice、VoiceDesign、VoiceClone、同步/流式/SSE 音频输出，通过 Docker、NVIDIA runtime 和模型缓存适配 Jetson。",
    ],
))
story.append(project(
    "个人全栈与产品化项目",
    "Go/React/PostgreSQL · TypeScript 服务端 · Docker · Cloudflare Tunnel",
    "持续独立构建可部署的软件产品，覆盖文件分享、内容订阅、Matrix 运维、章节视频流水线和本地图书浏览。",
    [
        "SharePier：分片续传、本地/S3 存储抽象、分享密码/过期/次数、配额和审计日志。",
        "FeedFlow / Matrix Open Stack：外部内容源、Webhook 部署、数据库迁移、Token、限流、审计和备份恢复。",
        "Video Automation / 帆书浏览站：声明式 2K 章节视频流水线，以及 React/Vite 本地内容产品和主题系统。",
    ],
))

story += section("教育经历与其他")
edu_rows = [
    [p("昆明理工大学", "Company"), p("计算机系统结构 · 硕士", "Body"), right_meta("2013.09 - 2016.06")],
    [p("淮阴工学院", "Company"), p("计算机科学与技术（嵌入式系统软件设计方向）· 本科", "Body"), right_meta("2009.09 - 2013.06")],
]
story.append(Table(edu_rows, colWidths=[34 * mm, 91 * mm, 45 * mm], style=TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LINEBELOW", (0, 0), (-1, -2), 0.35, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
])))
story.extend([
    Spacer(1, 5),
    bullet("英语：CET-6；证书：计算机三级。"),
    bullet("求职方向：高级 C++/Qt、跨平台桌面、音频/设备软件、实时处理或技术负责人方向。"),
    bullet("期望薪资：35K-50K；个人项目与作品集：https://resume.biglone.tech/；GitHub：https://github.com/biglone。"),
])

doc.build(story)
print(OUTPUT)
