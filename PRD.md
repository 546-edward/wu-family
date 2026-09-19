# 家族管理网站 PRD

| 项目 | 内容 |
|---|---|
| 项目代号 | WuFamily |
| 文档版本 | v2.0 |
| 首期实例 | 伍氏家族 |
| 当前阶段 | 第二版（静态展示 + 简易管理后台） |
| 最后更新 | 2026-09-19 |

> **版本演进说明**
>
> v1.0 为纯展示 MVP，明确不做数据库、登录与后台（见第 2 章原非目标表）。
> 实际使用中产生了「管理人员需要自行发布公告、上传表格」的需求，
> 因此 v2.0 提前实现了原属 V2 规划的部分能力：
>
> - 接入 SQLite，公告改为数据库存储，可在后台在线发布
> - 新增管理员登录（单账号）
> - 公告支持随附附件（文档、表格、图片等）
>
> **代价**：网站不再能纯静态托管，部署时需 Node 服务常驻。
> 第 2 章、第 4 章已相应更新。V1 预留的数据出口层接缝（5.3）
> 发挥了预期作用 —— 公告换数据源时，前台四个页面代码零修改。

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

## 2. 范围界定（v2.0 已更新）

### 2.1 v2.0 新增能力

| 能力 | 实现方式 |
|---|---|
| 管理员登录 | 单账号，签名 Cookie 会话，密码 bcrypt 哈希存储 |
| 公告在线发布 | SQLite 存储，后台可新建 / 编辑 / 置顶 / 删除，前台即时生效 |
| 公告附件 | 发布公告时可上传多个附件；图片前台内联预览，其余提供下载 |

### 2.2 仍不做（保持范围可控）

| 不做项 | 原因 |
|---|---|
| 多账号与权限分级 | 当前为单管理员场景；`users` 表已预留，扩展时无需改表结构 |
| 账号注册 / 找回密码 | 密码由环境变量配置，运维层面处理即可 |
| 世系树的在线编辑 | 世系属低频变更且结构敏感，仍由改数据文件维护 |
| 相册后台管理 | 同上；图片替换频率低 |
| 附件内容解析 | 附件只做上传与下载/预览，不解析其内容（如把 Excel 导入成员） |
| 活动报名 | 涉及名额、审核、通知，属于独立子系统 |
| 财务与份子钱台账 | 涉及真实资金与审批流，风险高，应单独立项 |
| 成员名录独立页 | 信息已由世系树覆盖，避免重复 |
| 移动端专项适配 | 桌面优先；Tailwind 自带基础响应式，窄屏可正常浏览即可 |
| 小程序 | 需要独立技术栈与审核流程 |
| 全文搜索 | 数据量小，浏览器 Ctrl+F 即可满足 |
| 评论与互动 | 需要账号体系与内容审核 |

### 2.3 已付出的代价

v1.0 的核心卖点之一是「纯静态、零服务器成本」。接入后台后：

- 移除了 `output: 'export'`，**必须运行 Node 服务**，不能再传到静态托管
- 需自行保障 `data/` 目录的备份与权限
- 上线到公网需配置 HTTPS，否则密码与会话可被窃听

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
| 框架 | Next.js（App Router，服务端渲染） | 16.3.5 |
| 语言 | TypeScript | 5.9 |
| 样式 | Tailwind CSS（CSS-first 配置） | 4.3 |
| 数据库 | SQLite（better-sqlite3，同步 API） | 13 |
| 密码哈希 | bcryptjs | 3 |
| 包管理 | npm | 随 Node |
| 运行时 | Node.js | v22（本机已验证） |

无 API 路由（写操作走 Server Actions）、无状态管理库、无 ORM。

### 4.2 选型理由

- **前后端一体**：单人开发维护成本最低，无需另起后端服务
- **SQLite**：单文件数据库，无需单独部署数据库服务；家族站数据量小（公告、表格），
  且通过 `better-sqlite3` 的同步 API 避免了异步状态管理的复杂度
- **不用 Prisma 等 ORM**：表结构简单，直接用 SQL 更透明，也少一层构建步骤
- **Server Actions 而非 REST API**：写入逻辑与表单同文件，无需手写接口与客户端请求代码
- **服务端渲染**：公告由后台在线发布，必须能在请求时读库，
  因此不再使用静态导出（见 2.3）
- **Tailwind**：中式主题配色通过配置注入，不写散落的 CSS 文件

### 4.3 演进路径

```
第一版          数据文件 + 静态页面（纯展示）
     ↓ 需要在线发布与上传
第二版（当前）   SQLite + 管理后台 + 登录（单账号）
     ↓ 多人维护
第三版           多账号与权限分级（users 表已预留）
     ↓ 服务多个家族
第四版           多租户隔离，各自独立子站
```

第二版的改造验证了 v1.0 预留接缝的价值：公告由数据文件改为数据库查询时，
**前台四个页面的取数代码零修改**，仅新增了 `content.ts` / `queries.ts` 两个模块。

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

### 5.2 内容与数据存储

低频变更内容仍是数据文件（改完重新构建生效）：

```
src/content/
├── family.ts          家族身份配置（FamilyConfig）
├── members.ts         世系数据（Member 树）+ 大事记（Milestone[]）
├── announcements.ts   公告（**仅作为首次导入的数据源与内容兜底**）
└── albums.ts          相册（Album[]）
```

公告与附件元信息改由 SQLite 存储，运行时位于 `data/`（已 gitignore）：

```
data/
├── wufamily.db        SQLite 数据库
└── uploads/           公告附件原件（非公开目录）
```

**数据表**：

| 表 | 用途 | 关键字段 |
|---|---|---|
| `users` | 管理员（当前单账号，已预留多账号） | `username`、`password_hash` |
| `announcements` | 公告 | `id`、`title`、`content`、`author_name`、`published_at`、`is_pinned` |
| `attachments` | 公告附件 | `id`、`announcement_id`、`file_name`、`stored_name`、`mime_type`、`size_bytes` |

`attachments.announcement_id` 外键指向 `announcements.id` 并带
`ON DELETE CASCADE`：删除公告时附件记录自动清理，磁盘文件由
应用层在删除时一并删掉。

首次启动会自动建表，并执行以下初始化：

1. 公告表为空时导入 `announcements.ts` 的既有内容，保证升级后网站不变空
2. 删除早期版本遗留的 `uploads` / `upload_rows` 表（若其有数据则先导出
   到 `data/legacy-backup/uploads.json`，不静默丢失）
3. 清理孤儿附件记录（公告已删但附件残留）与对应磁盘文件

### 5.3 数据出口层

因公告需查数据库，出口层拆为两个模块：

| 模块 | 内容 | 可用位置 |
|---|---|---|
| `src/lib/content.ts` | 家族身份、世系、相册、大事记（纯静态） | 服务端 + 客户端组件 |
| `src/lib/data.ts` | 上述全部 + 公告（读数据库） | 仅服务端（`server-only`） |

两者**导出签名一致**：

```ts
export function getFamilyConfig(): FamilyConfig
export function getMemberTree(): Member
export function getAnnouncements(): Announcement[]
export function getAlbums(): Album[]
export function getMilestones(): Milestone[]
```

**拆分原因**：`data.ts` 依赖 better-sqlite3 原生模块，无法在浏览器运行。
若客户端组件（如 `Nav.tsx`）直接引用 `data.ts`，构建会将原生模块打进浏览器包而失败。
因此纯静态部分单独放入 `content.ts` 供客户端使用。

**约束**：页面不得直接 import `src/content/`，也不得直接写 SQL；
公告的读写一律经 `src/lib/queries.ts`。

### 5.4 渲染模式

| 页面 | 模式 | 原因 |
|---|---|---|
| 全部页面 | 动态 | 导航栏需根据登录态显示「管理员登录 / 管理后台」；首页与公告页还需实时反映后台发布 |

全站动态渲染的代价：放弃静态预渲染带来的极致响应速度。
实测本机响应时间为 23–200ms，对家族站完全够用；
若日后需要提升性能，可将导航的登录态改为客户端获取，让无状态页面回到预渲染。

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

### 6.3 公告

**列表页 `/announcements`**

- 置顶公告（`isPinned: true`）排在最前，其余按 `publishedAt` 倒序
- 每条显示标题、作者、发布日期与**正文摘要**（前 140 字，超出加省略号），
  用 `line-clamp-3` 限制最多三行
- 标题与「阅读全文 →」均可点击，进入 `/announcements/[id]` 查看全文

**详情页 `/announcements/[id]`**

- 展示公告全文，保留原有换行
- 顶部返回列表，底部提供同列表顺序的**上一条 / 下一条**导航
- 标题与描述写入页面 `<title>` 与 `<meta description>`，便于分享
- id 不存在时返回 404

列表只给摘要、全文放详情页，避免列表页被长文撞得很长；
首页「最新公告」的三条也直接链接到各自详情页。

### 6.4 相册 `/gallery`

- 按 `Album` 分组，每组显示标题、描述与图片网格
- 图片网格用 CSS Grid，桌面 4 列
- 点击图片查看大图（第一版用浏览器原生 `<dialog>` 实现，不引入灯箱库）
- 图片存放于 `public/photos/`，`Album.photos[].url` 使用 `/photos/xxx.jpg` 形式的路径

### 6.5 导航与全局布局

- **导航栏**：左侧品牌名（`family.shortName`），右侧 4 个展示页面链接 + 管理入口；
  当前页高亮；品牌名 36px、链接 20px（窄屏各降一级）
- **管理入口**：未登录显示「管理员登录」→ `/admin/login`；
  已登录显示「管理后台」→ `/admin`。登录态由 `layout.tsx`（服务端）
  通过 `isAuthenticated()` 判定后作为 prop 传给导航
- **页脚**：家族全称、联系方式（`family.contact`）、版权年份
- **布局**：`src/app/layout.tsx` 承载导航与页脚，背景色来自 `family.theme`
- **字体**：中文衬线字体优先（标题用宋体系，正文用无衬线），营造传统质感

### 6.6 访问控制

| 角色 | 可读 | 可写 |
|---|---|---|
| 访客（无需登录） | 全部展示内容 | 无 |
| 管理员 | 展示内容 + 后台 | 公告、附件 |

**原原则：展示内容默认对所有人开放，写入必须登录。**

权限在服务端强制，不依赖前端隐藏：

- 后台页面调 `requireAuth()` 重定向
- **每个 Server Action 独立校验**，绕过页面直接 POST 也会被拒
- 会话 Cookie 带 HMAC 签名，伪造无效

导航栏的管理入口仅用于提供路径，不承担鉴权职责。

### 6.7 管理后台 `/admin/*`

后台不向前台导航暴露入口，直接访问 `/admin` 即可（未登录会跳转登录页）。
整站设置 `noindex`，不被搜索引擎收录。

| 路径 | 内容 |
|---|---|
| `/admin/login` | 用户名 + 密码登录 |
| `/admin` | 概览：公告总数 / 置顶数 / 附件总数，快捷入口 |
| `/admin/announcements` | 公告列表：新建、编辑、置顶切换、删除 |
| `/admin/announcements/new` | 新建公告表单 |
| `/admin/announcements/[id]` | 编辑公告 |
| `/api/attachments/[id]` | 附件下载；图片为内联预览（非后台路由） |

**公告表单字段**：标题、正文、署名、发布日期、是否置顶、附件（可多选）。
发布后前台首页与公告页立即生效（`revalidatePath` + 动态渲染）。

**公告附件**：

- 表单底部可选择文件（可多选），随公告一起提交
- 编辑时已有附件单独列出，可逐个删除（即时生效），也可继续追加
- 前台详情页：图片附件内联展示大图；其余格式列为下载项
- 附件存放在非公开目录 `data/uploads/`，**不经静态服务直接暴露**；
  下载经 `/api/attachments/[id]` 校验后读取

### 6.8 鉴权

- **单账号**：用户名与密码由环境变量配置，首次启动写入 `users` 表
- **密码存储**：bcrypt 哈希，不存明文
- **会话**：签名 Cookie（HMAC-SHA256），httpOnly + SameSite=Lax，有效期 7 天，
  校验用 `timingSafeEqual` 比较签名
- **两层守卫**：页面调 `requireAuth()` 重定向；**每个 Server Action 内部也独立校验**。
  后者必需 —— Server Action 不经过 layout，不单独校验就能被未登录者直接构造请求写入数据
- **防账号探测**：账号不存在时也执行一次 bcrypt 比较，避免通过响应时间判断账号是否存在
- **失败提示**统一为「用户名或密码错误」，不区分账号错还是密码错

### 6.9 附件上传限制

| 项目 | 限制 |
|---|---|
| 格式 | doc / docx / pdf / txt / rtf / xls / xlsx / csv / ppt / pptx / jpg / jpeg / png / gif / webp / bmp / zip |
| 大小 | 单个 ≤ 20MB（`MAX_FILE_BYTES`） |
| 数量 | 每条公告 ≤ 10 个（`MAX_ATTACHMENTS`） |

**安全处理**：

- **白名单**扩展名而非黑名单，未列出的格式一律拒绝；
  刻意排除 `.html` / `.svg` / `.js` 等可在浏览器中执行或嵌入脚本的格式，
  避免上传后被当作网页渲染造成 XSS
- 存储文件名**随机生成**，不使用用户提供的名字：既避免覆盖，
  也避免路径穿越（如 `../../etc/passwd`）
- 下载路由再次校验最终路径落在 `UPLOAD_DIR` 内（双保险）
- 响应带 `X-Content-Type-Options: nosniff`；非图片一律以 `attachment` 返回，
  不在浏览器内联渲染
- 中文文件名按 RFC 5987 编码（`filename*=UTF-8''`），避免下载后乱码

> 实现注意：
>
> 1. Next.js 的 Server Action 请求体默认上限为 1MB。`next.config.ts` 中已把
>    `experimental.serverActions.bodySizeLimit` 放宽到 `6mb` 以容纳多附件；
>    单文件上限仍由 `MAX_FILE_BYTES` 控制。
> 2. 附件删除按钮位于公告表单内部，需加 `formNoValidate`，
>    否则外层表单的 `required` 字段未填时浏览器会阻止提交。
> 3. 该按钮**不能用 `name` 传参** —— Next.js 会把 Server Action 的 ID
>    写到按钮的 `name` 属性上，覆盖业务参数；应改用同名 hidden input。

---

## 7. 目录结构

```
WuFamily/
├── PRD.md                      本文档
├── README.md                   启动与维护说明
├── .env.example                环境变量示例（复制为 .env.local）
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs          Tailwind 4 的 PostCSS 插件
├── eslint.config.mjs
├── data/                       运行时数据（已 gitignore）
│   ├── wufamily.db             SQLite 数据库
│   └── uploads/                公告附件原件（非公开）
├── public/
│   └── photos/                 相册图片
└── src/
    ├── app/
    │   ├── layout.tsx          前台全局布局（导航 + 页脚）
    │   ├── globals.css
    │   ├── page.tsx            首页（动态）
    │   ├── genealogy/page.tsx  世系树（静态）
    │   ├── announcements/page.tsx  公告（动态）
    │   ├── gallery/page.tsx    相册（静态）
    │   └── admin/
    │       ├── layout.tsx      后台外观
    │       ├── page.tsx        概览
    │       ├── AdminNav.tsx / LogoutButton.tsx / actions.ts
    │       ├── login/          登录页 + Server Action + 表单
    │       ├── announcements/  公告管理
    │       │   ├── page.tsx          列表
    │       │   ├── new/page.tsx      新建
    │       │   ├── [id]/page.tsx     编辑
    │       │   ├── AnnouncementForm.tsx
    │       │   └── actions.ts        增删改与置顶
    ├── components/
    │   ├── Nav.tsx             导航栏
    │   ├── Footer.tsx          页脚
    │   ├── GenealogyTree.tsx   世系树交互区（客户端）
    │   ├── MemberNode.tsx      世系树递归节点
    │   ├── MemberDetail.tsx    成员详情卡片
    │   ├── MilestoneTimeline.tsx
    │   └── PhotoGrid.tsx       相册网格与大图
    ├── content/                数据文件（唯一允许出现家族字样的地方）
    │   ├── family.ts
    │   ├── members.ts
    │   ├── announcements.ts    （仅作首次导入的种子数据）
    │   └── albums.ts
    ├── lib/
    │   ├── db.ts               SQLite 连接、建表、初始化
    │   ├── queries.ts          数据库读写
    │   ├── content.ts          静态内容出口（客户端安全）
    │   ├── data.ts             统一取数出口（服务端）
    │   ├── auth.ts             登录与会话
    │   ├── guard.ts            requireAuth() 鉴权守卫
    │   ├── attachments.ts      附件服务端校验（白名单、随机命名）
    │   └── attachments-shared.ts 附件共享常量与工具（客户端安全）
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

**第二版（v2.0）新增里程碑**：

| # | 里程碑 | 交付物 | 验收方式 |
|---|---|---|---|
| 9 | 底色与导航调整 | 浅蓝底色、导航字体调大 | 对比度实测达标 |
| 10 | 数据库与鉴权 | `db.ts`、`queries.ts`、`auth.ts`、`guard.ts`、`.env.example` | 首次启动自动建表、种子公告、创建管理员；未登录访问后台一律跳登录页 |
| 11 | 公告后台 | `admin/announcements/*` | 新建/编辑/置顶/删除均生效，前台即时可见 |
| 12 | 公告附件 | `attachments*.ts`、`api/attachments/[id]` | 多格式上传成功；非法类型被拒；图片内联、其余下载；删公告连带清理文件 |
| 13 | 数据出口层拆分 | `content.ts` / `data.ts` 分工 | 客户端组件不再引用数据库模块，构建成功 |
| 14 | 文档同步 | README、PRD 更新 | 版本说明与部署变更已写明 |

**里程碑 11–13 为具备实现难度的部分**：难点不在页面，而在于
「公告改为查库后，客户端组件不得把原生模块带进浏览器包」这一约束（见 5.3），
以及「Server Action 必须独立鉴权」（见 6.7）。

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

## 10. 后续版本规划

### 10.1 v1.0 预留接缝的使用情况

| 能力 | 预留方式 | 现状 |
|---|---|---|
| 内容在线编辑 | `data.ts` 为唯一数据出口 | ✅ 已用上：公告接入数据库，前台页面零修改 |
| 成员增删改 | `Member` 含稳定 `id` | 未启用，`id` 仍可直接作主键 |
| 登录与权限 | 预留 `User` 概念 | ✅ 已实现：`users` 表已建，当前单账号 |
| 多家族复用 | 身份集中于 `family.ts` | 保持，可按域名加载不同配置 |
| 活动报名 | `Announcement` 可扩展为 `Event` | 未实施 |
| 财务台账 | 独立表 + `memberId` | 未实施 |
| 移动端优化 | Tailwind 响应式类 | 基础响应式已可用，未专项投入 |

### 10.2 下一步建议

按性价比排序：

1. **多账号与权限分级** —— `users` 表已就位，加角色字段 + 中间件即可；
   适合多人共同维护时
2. **世系/相册后台化** —— 把 `members.ts`、`albums.ts` 也迁入数据库，
   沿用本次的 `content.ts` / `queries.ts` 分工模式
3. **附件内容解析** —— 当前附件只做上传与下载/预览；若要用上传的
   Excel 批量导入世系，需新增字段映射、校验与合并去重逻辑
4. **操作审计** —— 记录谁在何时改了什么，多人维护时有必要
5. **数据库备份脚本** —— 定时拷贝 `data/wufamily.db` 与 `data/uploads/`

### 10.3 已知技术债

- 登录接口未做速率限制。若部署到公网，建议在反向代理层
  对 `/admin/login` 加限流，防暴力破解。

---

## 附录：待补充清单

以下资料确认后需填入 `src/content/family.ts` 并同步更新本文档 3.1 节：

- [ ] 堂号
- [ ] 始祖名讳
- [ ] 郡望 / 发源地
- [ ] 字辈诗
- [ ] 家族简介正文
- [ ] 联系地址与邮箱
