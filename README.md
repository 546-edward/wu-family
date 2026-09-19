# 家族管理网站（WuFamily）

通用**家族站模板**，首期实例为伍氏家族。

- **前台**：4 个展示页面（首页、世系树、公告、相册）
- **后台**：管理员登录、公告在线发布、Excel 上传与分页展示

需求详见 [`PRD.md`](./PRD.md)。

---

## 快速开始

### 1. 配置环境变量

复制示例文件并填入自己的值：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```ini
ADMIN_USERNAME=admin
ADMIN_PASSWORD=换成一个你自己的强密码
SESSION_SECRET=换成一串随机字符
```

生成随机密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

> `.env.local` 已在 `.gitignore` 中，**不会被提交**。请勿把真实密码写进代码或示例文件。

### 2. 启动

```bash
npm install
npm run dev          # 开发模式，默认 http://localhost:3000
```

生产环境：

```bash
npm run build
npm start            # 需要 Node 常驻运行
```

其他命令：

| 命令 | 说明 |
|---|---|
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |

### 首次启动会发生什么

会自动创建 `data/` 目录、建表并完成初始化：

1. 按 `.env.local` 创建管理员账号（密码以 bcrypt 哈希存储）
2. 若公告表为空，把 `src/content/announcements.ts` 里的现有公告导入数据库

因此从旧版本升级上来，网站内容不会突然变空。

### 部署

本项目**需要 Node 服务常驻**（因为后台要读写数据库），不能用纯静态托管。
可选方式：自己的一台服务器 / VPS、Docker、或支持 Node 的 PaaS。

部署到公网前请务必：

- 使用强密码，并设置随机 `SESSION_SECRET`
- 启用 HTTPS（否则登录凭据与会话 Cookie 会明文传输）
- 确认 `data/` 目录**不可被 Web 直接访问**（它不在 `public/` 下，默认安全）
- 定期备份 `data/wufamily.db` 与 `data/uploads/`

### 数据存放位置

| 路径 | 内容 |
|---|---|
| `data/wufamily.db` | SQLite 数据库（公告、上传记录、行数据、管理员） |
| `data/uploads/` | 上传的 Excel 原件 |

整个 `data/` 目录已加入 `.gitignore`，不会进入版本库。

---

## 页面

### 前台

| 路径 | 内容 |
|---|---|
| `/` | 家族简介、堂号、始祖、字辈诗、大事记时间线、最新公告 |
| `/genealogy` | 递归渲染的世系树，节点可展开收起，点击查看成员详情 |
| `/announcements` | 公告列表（摘要 + 置顶优先倒序） |
| `/announcements/[id]` | 公告详情：全文 + 上下篇导航 |
| `/gallery` | 相册分组展示，点击图片查看大图（原生 `<dialog>`） |

### 权限模型

| 角色 | 能看到 | 能修改 |
|---|---|---|
| **访客（无需登录）** | 全部展示内容：首页、世系树、公告、相册 | 不能 |
| **管理员（登录后）** | 同上 + 管理后台 | 公告发布/编辑/删除，Excel 上传/删除 |

导航栏右侧始终提供入口：未登录显示「管理员登录」，登录后变为「管理后台」。
该入口仅决定**按钮文案**，真正的权限拦截在服务端（见下）。

### 后台

| 路径 | 内容 |
|---|---|
| `/admin/login` | 管理员登录 |
| `/admin` | 概览（公告与表格统计、快捷入口） |
| `/admin/announcements` | 公告列表：新建、编辑、置顶切换、删除 |
| `/admin/announcements/new` | 新建公告 |
| `/admin/excel` | 上传 Excel、已上传表格列表 |
| `/admin/excel/[id]` | 表格展示：分页 + 行展开查看明细 |

后台所有页面与接口均需登录，且已设置 `noindex` 不被搜索引擎收录。

**访客看到的后台入口是安全的**：点击「管理员登录」只会看到登录表单，
不会泄露任何后台数据（已实测确认）。

**访问控制是服务端强制的**，不依赖前端隐藏：

- 后台页面调用 `requireAuth()`，未登录重定向到登录页
- **每个 Server Action 内部也独立校验**，未登录者即使绕过页面、
  直接构造 POST 请求也会被拒（返回 307）
- 会话 Cookie 带 HMAC 签名，伪造 Cookie 会被拒

因此“只有登录管理员才能改内容”不是靠界面隐藏实现的，而是服务端拦截。

---

## 后台使用说明

### 发布公告

后台 →「公告管理」→「新建公告」。必填标题、正文、署名、发布日期，
可勾选「置顶显示」。发布后前台首页与公告页**立即生效**（无需重新构建）。

署名与日期可自由填写，用于展示「谁在何时发布」。

### 上传 Excel

后台 →「Excel 管理」→ 选择文件 →「上传并解析」。

处理规则：

| 项目 | 限制 |
|---|---|
| 格式 | 仅 `.xlsx`（不支持 `.xls` / `.csv`） |
| 大小 | ≤ 5MB |
| 行数 | 最多 5000 行（超出部分截断） |
| 列数 | 最多 60 列 |
| 表头 | 首行作为表头；空表头以「列N」占位 |
| 工作表 | 只取第一个工作表 |

上传后进入表格页：

- **分页**：每页 20 行，页码写在 URL 里（`?page=2`），刷新与分享保持位置
- **行展开**：点某行右侧「展开」，以「字段 — 值」列出该行完整内容，便于看长文本

> 说明：解析只读取单元格的文本内容，**不计算公式、不执行宏**；
> 原文件保存在非公开目录 `data/uploads/`，不提供直接下载。

### 安全提醒

- 本后台没有注册与找回密码功能：改密码需修改 `.env.local` 后删除
  `data/wufamily.db` 重新初始化（或直接改库里的 `password_hash`）
- 登录失败会统一提示「用户名或密码错误」，不区分是账号错还是密码错
- 会话有效期 7 天，Cookie 为 httpOnly + SameSite=Lax
- **任何知道密码的人都能发布公告、上传文件到你的服务器**，请勿弱口令

---

## 如何维护内容

低频变更的内容仍是数据文件（改完重新构建生效）；公告改由后台在线管理。

| 位置 | 内容 | 维护方式 |
|---|---|---|
| `src/content/family.ts` | 家族身份：姓氏、名称、堂号、始祖、字辈诗、简介、联系方式、主题色 | 改文件 |
| `src/content/members.ts` | 世系数据（树形嵌套） + 大事记 | 改文件 |
| `src/content/albums.ts` | 相册 | 改文件 |
| `public/photos/` | 相册图片 | 换文件 |
| 公告 | — | **后台在线管理** |
| Excel 表格 | — | **后台上传管理** |

`src/content/announcements.ts` 保留作为**首次导入的数据源与内容兜底**：
若数据库中的公告被清空，删除 `data/wufamily.db` 重启即可重新导入。

字段定义见 `src/types.ts`，每个字段都有注释。

### 常见编辑操作

**改家族名称 / 堂号 / 简介**

编辑 `src/content/family.ts`。导航栏品牌名、页脚、浏览器标题都会自动跟着变。
| `src/content/albums.ts` | 相册 | `Album[]` |
| `public/photos/` | 相册图片 | — |

字段定义见 `src/types.ts`，每个字段都有注释。

### 常见编辑操作

**改家族名称 / 堂号 / 简介**

编辑 `src/content/family.ts`。导航栏品牌名、页脚、浏览器标题都会自动跟着变。

**改主题色**

编辑 `src/content/family.ts` 的 `theme`：

```ts
theme: {
  primary: '#8B2E2E',   // 朱红，用于标题、强调
  ink:     '#22303C',   // 墨青，用于正文与世系树连线
  paper:   '#DCEAF5',   // 浅蓝，用于页面底色
  accent:  '#3A6EA5',   // 靛蓝，用于分隔线、角饰、印章点缀
},
```

改完重新构建即可，无需改动任何样式代码。

**加一位成员**

在 `src/content/members.ts` 的树中找到其父节点，往 `children` 数组里追加一项。
`generation` 填父节点 `generation + 1`，`id` 需全树唯一（建议 `g<世代>-<序号>`）：

```ts
{
  id: 'g4-13',
  name: '某某',
  gender: 'M',
  generation: 4,
  branch: '长房',
  birthYear: 1965,
  hometown: '某地',
  spouseName: '某某',
  bio: '生平简介。',
  // 有子代时继续嵌套 children
}
```

**加一条公告**

在 `src/content/announcements.ts` 数组里追加。文件里**不必预排序**，
`getAnnouncements()` 会自动按「置顶优先 + 发布时间倒序」处理：

```ts
{
  id: 'a-2026-06',
  title: '公告标题',
  content: '正文。使用 \n\n 分段。',
  authorName: '署名',
  publishedAt: '2026-10-01',   // ISO 日期
  isPinned: false,             // 置顶填 true
}
```

**加相册 / 换图片**

1. 把图片放进 `public/photos/`
2. 在 `src/content/albums.ts` 的 `albums` 中新增一项，`photos[].url` 写 `/photos/文件名.jpg`
3. `coverUrl` 通常取该相册第一张图

第一版为便于直接演示，仓库内放的是**占位 SVG**（浅蓝底 + 文字标签）。
替换真实照片时改为 `.jpg` 路径并放入同名文件即可。

---

## 底色与装饰

全站背景与装饰**不使用任何图片资源**，纯 CSS 实现，因此不增加 HTTP 请求，
静态导出与离线打开均正常。换家族换配色后，背景会跟着主题自动变化。

### 底色（`src/app/globals.css` 的 `body`）

由多层 `background-image` 叠加而成：

| 层 | 内容 | 作用 |
|---|---|---|
| 1 | 底色基底 `--theme-paper` | 浅蓝基调 |
| 2–3 | `repeating-linear-gradient` ×2 | 极细斜向条纹，模拟纸纤维 |
| 4 | 内联 SVG 回纹（万字不到头） | 中式暗格肌理，透明度仅 6% |
| 5–8 | `radial-gradient` ×4 | 四角靛蓝晕染，营造装裱感 |
| — | `radial-gradient` 中央提亮 | 保证正文区亮度与可读性 |

`background-attachment: fixed`，滚动时纹理不跟随移动。

### 装饰元素

页面内容包裹在半透明面板 `.paper-panel` 中（白色混入底色，保留蓝调），
两侧露出底色纹理；以下工具类可直接复用：

| 类名 | 效果 |
|---|---|
| `.paper-panel` | 半透明面板 + 淡蓝描边 |
| `.rule-festive` | 淡—靛蓝—淡 渐变分隔线 |
| `.seal-tag` | 朱红印章式标签（用于「堂号」「置顶」） |
| `.card-cn` / `.card-cn-hover` | 淡蓝描边卡片 + 悬停描边加深 |

首页首屏四角另有一组回纹角饰（内联 SVG，跟随 `--theme-accent`）。

### 导航栏

品牌名 36px（移动端 30px），菜单链接 20px（移动端 18px）。

### 可读性

底色叠加强度经过控制，实测正文对比度 **13.0:1**、标题 **7.9:1**，
均高于 WCAG AA 标准（正文 ≥ 4.5，大字 ≥ 3.0）。
若调整底色浓淡，建议重新核对对比度。

---

## 通用性：换一个家族要改什么

本项目是**通用模板**，不是伍家专用站。组件与页面代码中不含任何家族专属字样
（PRD 3.4 验收标准：在 `src/app/` 与 `src/components/` 中检索「伍」「吴」应零命中）。

接入新家族**只需改数据，不改代码**：

1. 改 `src/content/family.ts`（身份信息、主题色）
2. 改 `src/content/members.ts`（世系、大事记）
3. 改 `src/content/announcements.ts`（公告）
4. 改 `src/content/albums.ts`（相册）+ 替换 `public/photos/` 下的图片

`src/app/` 与 `src/components/` 下的文件保持不变。

---

## 架构：为什么这样分层

```
src/content/        数据文件（低频变更内容）
src/lib/db.ts       SQLite 连接与建表
data/               运行时数据（数据库 + 上传原件，不入库）
      ↓
src/lib/content.ts  静态内容出口（客户端安全，不含数据库）
src/lib/queries.ts  数据库读写（公告、上传记录、行数据）
src/lib/data.ts     统一取数出口（服务端，标注 server-only）
src/lib/auth.ts     登录与会话       src/lib/guard.ts  鉴权守卫
      ↓
src/app/            页面           src/components/  组件
```

**硬性约束**：页面**不得**直接 `import` `src/content/`，也不得直接写 SQL，
一律经数据出口层取数。

### 两个出口模块的分工

| 模块 | 包含 | 可用位置 |
|---|---|---|
| `src/lib/content.ts` | 家族身份、世系、相册、大事记（纯静态文件） | 服务端 + **客户端组件** |
| `src/lib/data.ts` | 上述全部 + 公告（读数据库） | **仅服务端** |

**为什么要拆成两个**：公告改读数据库后，`data.ts` 会依赖 better-sqlite3 这个原生模块。
它无法在浏览器中运行，一旦被客户端组件（如 `Nav.tsx`）引用，构建就会失败。
因此把纯静态部分单独放入 `content.ts` 供客户端使用，带数据库的 `data.ts` 标注
`server-only`，误用时会直接报错而不是静默出错。

设计副作用：世系树拆为服务端页面 + 客户端组件 `GenealogyTree`，
数据由服务端取好后经 props 传入，客户端不再依赖数据层。

### 数据出口签名未变

```ts
getFamilyConfig(): FamilyConfig
getMemberTree(): Member
getAnnouncements(): Announcement[]   // 已排序：置顶优先 + 时间倒序
getAlbums(): Album[]
getMilestones(): Milestone[]
```

这正是 PRD 5.3 预留的接缝：公告从「读文件」换成「查数据库」时，
**对外签名保持不变，前台 4 个页面的取数代码零修改**。

### 动态渲染的必要性

首页与公告页使用 `export const dynamic = 'force-dynamic'`。
若不这样，它们会在构建时预渲染成静态页 —— 后台新发布的公告就要等
下一次重新构建才会出现在前台，不符合「在线发布」的预期。
相册与世系树仍是静态预渲染（内容来自文件，不随运行时变化）。

### 为什么成员用树形嵌套

`Member` 用 `children` 递归而非 `fatherId` 扁平关联：
嵌套结构在数据文件中书写与阅读最直观，天然表达世系，同时保证
**递归渲染不会出现重复节点**（每位成员在树中只出现一次）。

### 鉴权设计

- **签名 Cookie 会话**：`base64(payload).hmacSHA256(payload)`，密钥为 `SESSION_SECRET`；
  校验时用 `timingSafeEqual` 比较签名
- **两层守卫**：页面调用 `requireAuth()` 重定向；**每个 Server Action 内部也独立校验**。
  这一点必需：Server Action 不经过 layout，不单独校验就能被未登录者直接构造请求写入数据
- **防用户名探测**：账号不存在时也执行一次 bcrypt 比较，避免通过响应时间判断账号是否存在
- 密码以 bcrypt 哈希存储，不存明文

### 技术栈

Next.js 16（App Router，服务端渲染）、React 19、TypeScript 5、
Tailwind CSS 4（CSS-first 配置，主题令牌见 `src/app/globals.css`）、
better-sqlite3（数据库）、exceljs（Excel 解析）、bcryptjs（密码哈希）、Node.js v22。

---

## 目录结构

```
WuFamily/
├── PRD.md                      需求文档
├── README.md                   本文件
├── .env.example                环境变量示例（复制为 .env.local 使用）
├── next.config.ts              Next.js 配置（含 Server Action 体积上限）
├── postcss.config.mjs          Tailwind 4 的 PostCSS 插件
├── eslint.config.mjs           ESLint 扁平配置
├── data/                       运行时数据（已 gitignore，不入库）
│   ├── wufamily.db             SQLite 数据库
│   └── uploads/                上传的 Excel 原件（非公开）
├── public/photos/              相册图片
└── src/
    ├── app/
    │   ├── layout.tsx          前台全局布局（导航 + 页脚 + 主题色注入）
    │   ├── globals.css         主题令牌、中文排版、底色、世系树连线
    │   ├── page.tsx            首页（动态）
    │   ├── genealogy/page.tsx  世系树（动态）
    │   ├── announcements/page.tsx      公告列表（摘要，动态）
    │   ├── announcements/[id]/page.tsx 公告详情（全文，动态）
    │   ├── gallery/page.tsx    相册（动态）
    │   └── admin/              管理后台
    │       ├── layout.tsx      后台外观（标题 + 导航 + 退出）
    │       ├── page.tsx        概览
    │       ├── login/          登录页与 Server Action
    │       ├── announcements/  公告增删改（actions.ts / 表单 / 列表）
    │       └── excel/          上传、列表、分页表格展示
    ├── components/
    │   ├── Nav.tsx             导航栏
    │   ├── Footer.tsx          页脚
    │   ├── GenealogyTree.tsx   世系树交互区（客户端）
    │   ├── MemberNode.tsx      世系树递归节点
    │   ├── MemberDetail.tsx    成员详情卡片
    │   ├── MilestoneTimeline.tsx
    │   └── PhotoGrid.tsx       相册网格与大图
    ├── content/                数据文件（唯一允许出现家族字样的地方）
    ├── lib/
    │   ├── db.ts               SQLite 连接、建表、初始化
    │   ├── queries.ts          数据库读写（公告 / 上传 / 行数据）
    │   ├── content.ts          静态内容出口（客户端安全）
    │   ├── data.ts             统一取数出口（服务端）
    │   ├── auth.ts             登录、会话签发与校验
    │   ├── guard.ts            requireAuth() 鉴权守卫
    │   └── excel.ts            Excel 解析与上传校验
    └── types.ts                类型定义
```

---

## 待补充资料

以下资料确认后填入 `src/content/family.ts`，数据文件中现以「待补充」占位：

- [ ] 堂号
- [ ] 始祖名讳
- [ ] 郡望 / 发源地
- [ ] 字辈诗
- [ ] 家族简介正文
- [ ] 联系地址与邮箱

另外，`src/content/members.ts` 中的世系与大事记、`src/content/announcements.ts`
中的公告目前均为**演示用示例数据**，人名与年份为占位，需替换为真实资料。
