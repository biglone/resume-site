/**
 * Converts internal repository-analysis wording into language suitable for
 * an employer-facing project portfolio. Technical facts stay intact; only
 * generation notes and author-facing prompts are removed or reframed.
 */
export function prepareProjectAnalysis(markdown: string): string {
  return markdown
    .replace(/^> 独立项目分析档案.*(?:\n|$)/m, '')
    .replace(
      /面试时应优先讲清业务目标、关键边界、个人负责模块，以及设计如何降低实时性、稳定性、兼容性或交付风险。/g,
      '重点呈现业务目标、系统边界、个人职责与工程交付结果。'
    )
    .replaceAll('扫描证据与可信边界', '项目范围与技术背景')
    .replaceAll('证据置信度', '资料来源')
    .replaceAll('源码/项目深读', '系统设计与实现')
    .replaceAll('我在项目中的贡献表达', '我的职责与交付结果')
    .replaceAll('源码抽出的架构', '系统设计要点');
}
