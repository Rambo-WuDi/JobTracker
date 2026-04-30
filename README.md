# JobTracker

JobTracker是一款 Chrome 扩展程序：当你在浏览招聘网站详情页时导入感兴趣的岗位，按批次保存，支持导出岗位到 NotebookLM 利用AI分析岗位和你的职业匹配。

## 功能

- 一键导入当前招聘详情页的岗位、公司、地点、薪资、职责和要求。
- 支持批次管理，把不同岗位方向分别收集。
- 新增批次时可以命名，支持删除当前批次。
- 岗位列表默认折叠，展开后查看岗位信息、职责和要求。
- 支持删除单个职位，也可以清空当前批次。
- 数据保存在 Chrome 本地 `storage.local`，不会上传到第三方服务、无需服务器、无需账户、无需外部API调用，仅仅是一款 Chrome 扩展程序。
- 批量单独/合并导出当前批次的 Markdown，适合作为 NotebookLM 的资料来源上传。
- 批量单独/合并导出CSV，方便后续用表格做筛选和统计。

## 安装到 Chrome

### 自动安装

将此github发给你的Agent（Claude Code、Codex等），并告诉它“安装此插件”：
(https://github.com/Rambo-WuDi/JobTracker)

### 手动安装

1. 打开 `chrome://extensions/`。
2. 开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」。
4. 选择本目录：`chrome-job-notebooklm`。
5. 打开招聘详情页，点击浏览器工具栏中的扩展图标，Chrome 会在侧边栏中打开 JobTracker。

## 推荐工作流

1. 为每个职业方向创建一个批次，例如「AI 产品经理」或「数据分析师」。
2. 在该批次下收集 10-30 个感兴趣或符合自己的岗位。
3. 点击「导出到 NotebookLM 」，选择新建 NotebookLM 或选择读取 NotebookLM 。
4. 扩展会把当前批次岗位单独/合并成 Markdown 文件并打开 NotebookLM 。
5. JobTracker 自动尝试新建/读取选择 notebook 并添加粘贴文本来源；如果页面结构变化导致失败，点击「复制内容」后手动粘贴。

## 当前限制

- 不自动登录、不绕过付费墙、不批量爬站，只导入用户当前正在浏览的详情页面（非大纲页面或列表页面）。
- 各招聘网站 DOM 差异很大，抽取器采用通用启发式规则，无法保证信息可以被识别或导入完全准确。
- NotebookLM 官方帮助页显示支持 Markdown、Text、PDF、URL、Google Docs/Slides/Sheets 等来源；本扩展会生成 Markdown 并拉起 NotebookLM ，但不会模拟页面上传操作。在使用插件前建议先注册 NotebookLM 。
- JobTracker 使用 Chrome Side Panel API。Chrome 允许用户在浏览器设置中选择侧边栏位于左侧或右侧，默认通常显示在右侧。

## 执照

MIT

由 Rambo 创建