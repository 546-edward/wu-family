# 家族管理网站 PRD

| 项目 | 内容 |
|---|---|
| 项目代号 | WuFamily |
| 文档版本 | v1.0 |
| 首期实例 | 伍氏家族 |
| 当前阶段 | 第一版（纯展示 MVP） |
| 最后更新 | 2026-09-19 |

---

## 1. 项目概述

### 1.1 背景与目标

为家族建立一个对外展示与内部事务记录的网站。第一版聚焦"展示"：让族人及访客能看到家族简介、世系脉络、公告与影像资料，形成家族数字门面。

目标：

1. 一个能直接访问、稳定运行的公开网站
2. 家族信息结构化沉淀，不再散落于微信群与纸质资料
3. 内容可维护——非技术人员改文字、换图片不需要懂代码
4. 架构可演进——第二版加后台与数据库时，页面代码无需重写

### 1.2 第一版范围界定

第一版只做**静态展示站**，共 4 个页面，内容全部来自项目内的数据文件。

| 页面 | 路径 | 内容 |
|---|---|---|
| 首页 | `/` | 家族简介、堂号、始祖、大事记时间线、最新公告 |
| 世系树 | `/genealogy` | 递归渲染的家族树，节点可展开收起，点击查看成员详情 |
| 公告 | `/announcements` | 公告列表，按发布时间倒序 |
| 相册 | `/gallery` | 相册分组展示，点击查看大图 |

**内容维护方式**：直接编辑 `src/content/` 下的数据文件与 `public/photos/` 下的图片，提交后重新部署生效。第一版不提供在线编辑能力。

### 1.3 首期实例：伍氏家族

本系统设计为**通用家族站模板**，伍氏家族为首个应用实例。伍氏相关的全部身份信息集中在单一配置文件 `src/content/family.ts` 中（详见第 3 章）。

> 待补充信息：堂号、始祖名讳、郡望、字辈诗。在资料确认前，PRD 与数据文件中以「待补充」占位。

---

## 2. 非目标（明确不做）

以下内容**不在第一版范围内**，以避免范围蔓延。均列入第 10 章的后续规划。

| 不做项 | 原因 |
|---|---|
| 数据库 | 第一版内容是低频变更的静态资料，文件即数据源，引入数据库徒增部署复杂度 |
| 登录与账号体系 | 第一版无写操作，无需鉴权 |
| 管理后台 | 内容维护由开发者通过改文件完成，第一版可接受 |
| 活动报名 | 涉及名额、审核、通知，属于独立子系统 |
| 财务与份子钱台账 | 涉及真实资金与审批流，风险高，应单独立项 |
| 成员名录独立页 | 信息已由世系树覆盖，避免重复 |
| 移动端专项适配 | 桌面优先；Tailwind 自带基础响应式，窄屏可正常浏览即可，不额外投入 |
| 小程序 | 需要独立技术栈与审核流程 |
| 全文搜索 | 第一版数据量小，浏览器 Ctrl+F 即可满足 |
| 评论与互动 | 需要账号体系与内容审核 |

---

## 3. 通用性设计原则

**核心要求：这套系统是通用家族站模板，不是伍家专用站。切换家族或修改家族信息时，只允许改动数据文件，不允许改动组件与页面代码。**

### 3.1 家族身份集中配置

家族的全部身份信息集中在唯一来源 `src/content/family.ts`：

```ts
export const family = {
  surname: '伍',              // 姓氏
  name: '伍氏家族',            // 站点全称
  shortName: '伍氏',           // 短称，用于导航栏
  hallName: '待补充',          // 堂号
  ancestor: {                 // 始祖
    name: '待补充',
    origin: '待补充',          // 郡望 / 发源地
    brief: '待补充',
  },
  generationPoem: '待补充',    // 字辈诗
  description: '待补充',       // 家族简介
  contact: {                  // 联系方式
    address: '待补充',
    email: '待补充',
  },
  theme: {                    // 主题色
    primary: '#8B2E2E',       // 朱红
    ink: '#22303C',           // 墨青
    paper: '#DCEAF5',         // 浅蓝
    accent: '#3A6EA5',        // 靛蓝（分隔线、角饰、印章点缀）
  },
}
```

### 3.2 组件零硬编码约束

以下位置**必须**从 `family.ts` 读取，不得写死：

- 导航栏品牌名 → `family.shortName`
- 页脚版权信息 → `family.name`
- 页面 `<title>` 与 `<meta description>` → `family.name` / `family.description`
- 首页家族简介、堂号、始祖段落 → `family.*`
- 全站主题色 → `family.theme`（含义、墨色、纸色、点缀金）

### 3.3 换家族的操作成本

接入一个新家族，仅需：

1. 修改 `src/content/family.ts`（身份信息）
2. 修改 `src/content/members.ts`（世系数据）
3. 修改 `src/content/announcements.ts`（公告）
4. 修改 `src/content/albums.ts`（相册）+ 替换 `public/photos/` 下的图片

`src/app/` 与 `src/components/` 下的所有文件保持不变。

### 3.4 验收标准

代码评审时，在 `src/app/` 和 `src/components/` 中检索「伍」「吴」等家族专属字样，**应当零命中**。所有此类字样只允许出现在 `src/content/` 目录内。

---

## 4. 技术选型

### 4.1 技术栈

| 层 | 选型 | 版本 |
|---|---|---|
| 框架 | Next.js（App Router） | 最新稳定版 |
| 语言 | TypeScript | 最新稳定版 |
| 样式 | Tailwind CSS | 最新稳定版 |
| 包管理 | npm | 随 Node |
| 运行时 | Node.js | v22（本机已验证） |

**无数据库、无 API 路由、无鉴权、无状态管理库。** 全站构建为静态页面。

### 4.2 选型理由

- **前后端一体**：单人开发维护成本最低，无需另起后端服务
- **静态输出**：所有页面在构建时生成，可直接托管于任意静态服务或 CDN，无服务器运行成本
- **演进平滑**：第二版接数据库时，Next.js 可原地升级为含服务端逻辑的全栈应用，不需要换框架
- **Tailwind**：中式主题配色通过配置注入，不写散落的 CSS 文件

### 4.3 演进路径

```
第一版（当前）   数据文件 + 静态页面
     ↓ 增加在线编辑需求
第二版           接入 SQLite/PostgreSQL + Prisma，新增管理后台与登录
     ↓ 服务多个家族
第三版           多租户隔离，各自独立子站
```

第二版改造的关键在于**数据出口层 `src/lib/data.ts`**（见 5.3）：页面只依赖该模块导出的函数，届时只替换该模块的内部实现为数据库查询，页面零改动。

---

## 5. 数据结构

### 5.1 类型定义

文件：`src/types.ts`

```ts
/** 家族身份配置 */
export interface FamilyConfig {
  surname: string
  name: string
  shortName: string
  hallName: string
  ancestor: { name: string; origin: string; brief: string }
  generationPoem: string
  description: string
  contact: { address: string; email: string }
  theme: { primary: string; ink: string; paper: string }
}

/** 家族成员（树形嵌套） */
export interface Member {
  id: string
  name: string
  gender: 'M' | 'F'
  generation: number        // 世代，始祖为 1
  branch?: string           // 房支
  birthYear?: number
  deathYear?: number
  hometown?: string
  bio?: string              // 生平简介
  spouseName?: string       // 配偶姓名
  children?: Member[]       // 子代，递归
}

/** 公告 */
export interface Announcement {
  id: string
  title: string
  content: string
  authorName: string
  publishedAt: string       // ISO 日期字符串
  isPinned?: boolean        // 是否置顶
}

/** 相册 */
export interface Album {
  id: string
  title: string
  description?: string
  coverUrl: string
  photos: { url: string; caption?: string }[]
}

/** 大事记 */
export interface Milestone {
  year: string
  title: string
  description?: string
}
```

**设计说明**：成员采用**树形嵌套**（`children` 递归）而非 `fatherId` 扁平关联。第一版无数据库，嵌套结构在数据文件中书写与阅读最直观，且天然表达世系。第二版迁移到关系型数据库时，在 `data.ts` 内部做扁平化转换，对外接口不变。

### 5.2 内容文件组织

```
src/content/
├── family.ts          家族身份配置（FamilyConfig）
├── members.ts         世系数据（Member 树）+ 大事记（Milestone[]）
├── announcements.ts   公告（Announcement[]）
└── albums.ts          相册（Album[]）
```

### 5.3 数据出口层

文件：`src/lib/data.ts`

页面**一律**通过以下函数取数，禁止直接 import `src/content/` 下的文件：

```ts
export function getFamilyConfig(): FamilyConfig
export function getMemberTree(): Member
export function getAnnouncements(): Announcement[]
export function getAlbums(): Album[]
export function getMilestones(): Milestone[]
```

该模块是第一版与第二版之间的**唯一接缝**。第二版接数据库后，仅需把上述函数的实现从「读数据文件」改为「查询数据库」，返回类型保持不变，所有页面代码无需修改。

---

## 6. 页面设计

### 6.1 首页 `/`

自上而下：

1. **首屏** — 家族名称（`family.name`）、堂号、一句家族简介；浅蓝底色，标题用朱红
2. **家族简介** — `family.description` 全文
3. **始祖与郡望** — `family.ancestor` 的姓名、发源地、简介
4. **字辈诗** — `family.generationPoem`，居中排版
5. **大事记** — `Milestone[]` 时间线，竖向排列
6. **最新公告** — 取 `getAnnouncements()` 前 3 条，附「查看全部」入口

**视觉基调**：浅蓝底 + 回纹暗格 + 四角靛蓝晕染，内容置于半透明面板上；
分隔线用淡—靛蓝—淡渐变，堂号与「置顶」标记用朱红印章式标签。
导航栏品牌名 36px、菜单链接 20px。
实现方式见 README 的「底色与装饰」一节。

### 6.2 世系树 `/genealogy`

核心页面。左侧为递归渲染的家族树，右侧（或弹层）显示选中成员的详情。

- **节点渲染**：`MemberNode` 递归组件，每个节点显示姓名、世代、房支
- **展开收起**：有 `children` 的节点显示折叠按钮，默认展开前两代
- **详情展示**：点击节点显示 `MemberDetail` 卡片，含姓名、性别、生卒年、籍贯、配偶、生平
- **去重**：同一成员不可重复渲染（成员在各代中位置唯一，嵌套结构天然保证）
- **视觉**：连线用 `family.theme.ink`，节点卡片用 `family.theme.paper`

### 6.3 公告 `/announcements`

- 置顶公告（`isPinned: true`）排在最前，其余按 `publishedAt` 倒序
- 列表项显示标题、作者、发布日期
- 内容全文展开（第一版不做详情页跳转）

### 6.4 相册 `/gallery`

- 按 `Album` 分组，每组显示标题、描述与图片网格
- 图片网格用 CSS Grid，桌面 4 列
- 点击图片查看大图（第一版用浏览器原生 `<dialog>` 实现，不引入灯箱库）
- 图片存放于 `public/photos/`，`Album.photos[].url` 使用 `/photos/xxx.jpg` 形式的路径

### 6.5 导航与全局布局

- **导航栏**：左侧品牌名（`family.shortName`），右侧 4 个页面链接；当前页高亮
- **页脚**：家族全称、联系方式（`family.contact`）、版权年份
- **布局**：`src/app/layout.tsx` 承载导航与页脚，背景色 `family.theme.paper`
- **字体**：中文衬线字体优先（标题用宋体系，正文用无衬线），营造传统质感

---

## 7. 目录结构

```
WuFamily/
├── PRD.md                      本文档
├── README.md                   启动与维护说明
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── public/
│   └── photos/                 相册图片
└── src/
    ├── app/
    │   ├── layout.tsx          全局布局（导航 + 页脚）
    │   ├── globals.css
    │   ├── page.tsx            首页
    │   ├── genealogy/page.tsx  世系树
    │   ├── announcements/page.tsx
    │   └── gallery/page.tsx
    ├── components/
    │   ├── Nav.tsx             导航栏
    │   ├── Footer.tsx          页脚
    │   ├── MemberNode.tsx      世系树递归节点
    │   ├── MemberDetail.tsx    成员详情卡片
    │   ├── MilestoneTimeline.tsx
    │   └── PhotoGrid.tsx       相册网格与大图
    ├── content/                数据文件（唯一允许出现家族字样的地方）
    │   ├── family.ts
    │   ├── members.ts
    │   ├── announcements.ts
    │   └── albums.ts
    ├── lib/
    │   └── data.ts             数据出口层（V2 接数据库的唯一接缝）
    └── types.ts
```

---

## 8. 实施步骤

每个里程碑完成后独立提交一次，每次提交时项目均处于可运行状态。

| # | 里程碑 | 交付物 | 验收方式 |
|---|---|---|---|
| 1 | 仓库与文档 | `.gitignore`、`PRD.md` | `git log` 可查，`git status` 干净 |
| 2 | 脚手架 | Next.js + TS + Tailwind 项目骨架 | `npm run dev` 打开空白首页 |
| 3 | 数据层 | `types.ts`、`content/*`、`lib/data.ts` | 数据文件含伍氏 4 代约 20 人示例 |
| 4 | 全局布局 | `layout.tsx`、`Nav.tsx`、`Footer.tsx` | 4 个路由均可跳转，导航高亮正确 |
| 5 | 首页 | `page.tsx`、`MilestoneTimeline.tsx` | 简介、始祖、字辈、大事记、最新公告齐全 |
| 6 | 世系树 | `genealogy/page.tsx`、`MemberNode.tsx`、`MemberDetail.tsx` | 树可展开收起，点击显示详情 |
| 7 | 公告与相册 | `announcements/page.tsx`、`gallery/page.tsx`、`PhotoGrid.tsx` | 置顶排序正确，相册可看大图 |
| 8 | 视觉打磨 | 中式配色与排版微调 | 主题色来自 `family.theme` |

**里程碑 6 为唯一具备实现难度的部分**（递归组件），其余为静态渲染。

---

## 9. 版本管理约定

### 9.1 提交粒度

- **一个里程碑一次提交**，不积攒大批量改动
- 每次提交后项目必须处于**可运行状态**，禁止提交半成品
- 提交前用 `git status` 确认无遗漏、无多余文件

### 9.2 提交信息规范

格式：`<类型>: <中文描述>`

| 类型 | 用途 | 示例 |
|---|---|---|
| `docs` | 文档 | `docs: 初始化项目，添加 PRD 文档` |
| `chore` | 脚手架、配置、依赖 | `chore: 配置 .gitignore` |
| `feat` | 新页面、新功能 | `feat: 实现世系树页面` |
| `fix` | 修复缺陷 | `fix: 修正公告置顶排序错误` |
| `style` | 视觉调整（不改行为） | `style: 调整首页配色` |
| `refactor` | 重构（不改行为） | `refactor: 抽取数据出口层` |

描述使用中文，动词开头，不写句号。

### 9.3 分支策略

- MVP 阶段**直接在 `main` 分支开发**，不开特性分支
- 第二版引入多人协作后，再切换至 Git Flow（`feature/*` → `develop` → `main`）

### 9.4 首次提交序列（预期）

```
docs: 初始化项目，添加 PRD 文档
chore: 配置 .gitignore
chore: 搭建 Next.js + TypeScript + Tailwind 脚手架
feat: 建立数据层与类型定义
feat: 实现全局布局与导航
feat: 实现首页
feat: 实现世系树
feat: 实现公告页与相册页
style: 视觉打磨
```

### 9.5 禁止事项

- 不提交 `node_modules`、`.next` 等构建产物（已由 `.gitignore` 覆盖）
- 不提交任何含密钥的文件（`.env*`）
- 不使用 `git push --force` 覆盖远端历史
- 不提交无法运行的代码

---

## 10. 后续版本规划（V2 预留）

第一版刻意预留了以下演进空间，实现时不得破坏这些接缝：

| 能力 | 预留方式 |
|---|---|
| 内容在线编辑 | `src/lib/data.ts` 为唯一数据出口，替换内部实现即可接数据库 |
| 成员增删改 | `Member` 类型已含稳定 `id` 字段，可直接作为数据库主键 |
| 登录与权限 | 目前无用户概念，V2 新增 `User` 表，与 `Member` 通过 `memberId` 关联 |
| 多家族复用 | 家族身份已全部集中于 `family.ts`，V2 可按域名加载不同配置实现多租户 |
| 活动报名 | `Announcement` 结构可扩展为 `Event`，增加报名字段 |
| 财务台账 | 独立表，与成员通过 `memberId` 关联 |
| 移动端优化 | 现有 Tailwind 响应式类可平滑升级，无需重写 |

---

## 附录：待补充清单

以下资料确认后需填入 `src/content/family.ts` 并同步更新本文档 3.1 节：

- [ ] 堂号
- [ ] 始祖名讳
- [ ] 郡望 / 发源地
- [ ] 字辈诗
- [ ] 家族简介正文
- [ ] 联系地址与邮箱
