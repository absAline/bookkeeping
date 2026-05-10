# AI辅助个人智能记账系统

基于 Astro 的单页记账应用，支持收支记录、图表分析、AI 智能分类和消费建议，数据存储在浏览器本地。

## 技术栈
- Astro 6.3
- Chart.js 4.4（图表可视化）
- localStorage（数据持久化）
- Express.js（本地后台编辑器）

## 项目结构
```
bookkeeping/                  # Astro 前端应用
├── src/
│   ├── pages/
│   │   └── index.astro      # 主页面（单页应用）
│   ├── utils/
│   │   └── store.js          # 数据层（CRUD / 分类 / AI 分析）
│   └── styles/
│       └── global.css        # 全局样式
├── public/                   # 静态资源
├── astro.config.mjs
├── package.json
└── tsconfig.json
admin/                        # 本地后台编辑器（端口 4324，位于项目根目录）
```

## 快速开始
```bash
cd bookkeeping
npm install
npm run dev
# 访问 http://localhost:4321
```

## 功能特性

### 收支概览
- 三卡片展示：收入 / 支出 / 结余
- 按月筛选
- 本月支出排行（带进度条）

### 账单管理
- 记账表单（类型 / 金额 / 分类 / 日期 / 备注）
- 编辑 / 删除已有账单
- 按月 / 按类型筛选
- 备注关键词搜索
- 清空本月数据

### 图表分析
- 收支趋势折线图（每日收入/支出）
- 支出分类饼图（环形图）
- 按月切换

### AI 智能分类
- 输入备注时自动识别消费类别（餐饮/交通/购物等）
- 关键词匹配引擎，覆盖 10+ 消费场景
- 实时提示识别结果

### AI 消费分析建议
- 日均消费计算
- 高占比分类预警（超过总支出 40%）
- 每日预算建议（日均消费 × 80%）

### 数据导入导出
- 导出 JSON / CSV
- 导入 JSON 数据
- 数据存储在浏览器 localStorage

## AI 工具使用
- AI 辅助编写项目框架和核心逻辑
- AI 自动分类引擎（关键词匹配算法）
- AI 消费分析建议算法（规则引擎）

## 部署
```bash
cd bookkeeping
npm run build
npm run preview
```
- 构建产物在 `dist/` 目录
- 可部署到 Vercel/Netlify
- 本地后台编辑器：`cd ../admin && npm start`（端口 4324，从 bookkeeping 目录运行）
