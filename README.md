# 家族管理网站（WuFamily）

通用**家族展示站模板**，首期实例为伍氏家族。第一版为纯展示 MVP：
4 个静态页面，内容全部来自项目内的数据文件，**无数据库、无接口、无鉴权**。

需求详见 [`PRD.md`](./PRD.md)。

---

## 快速开始

```bash
npm install
npm run dev          # 开发模式，默认 http://localhost:3000
```

生产构建与本地预览：

```bash
npm run build        # 构建，产物输出到 out/（全站静态）
npm run preview      # 用静态服务器预览 out/ 目录
```

其他命令：

| 命令 | 说明 |
|---|---|
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |

### 部署

本项目配置为 `output: 'export'`，`npm run build` 后 `out/` 目录即为完整静态站点，
可直接上传到任意静态托管（对象存储、CDN、Nginx、GitHub Pages 等），无需 Node 运行时。

> 若部署在子路径（如 `https://example.com/family/`），需在 `next.config.ts` 中
> 增加 `basePath: '/family'`，并同步调整 `src/content/albums.ts` 中的图片路径前缀。

---

## 页面

| 路径 | 内容 |
|---|---|
| `/` | 家族简介、堂号、始祖、字辈诗、大事记时间线、最新公告 |
| `/genealogy` | 递归渲染的世系树，节点可展开收起，点击查看成员详情 |
| `/announcements` | 公告列表，置顶优先，其余按发布时间倒序 |
| `/gallery` | 相册分组展示，点击图片查看大图（原生 `<dialog>`） |

---

## 如何维护内容

第一版**不提供后台**，内容维护就是改文件再重新构建。全部内容集中在 `src/content/`：

| 文件 | 内容 | 对应类型 |
|---|---|---|
| `src/content/family.ts` | 家族身份：姓氏、名称、堂号、始祖、字辈诗、简介、联系方式、主题色 | `FamilyConfig` |
| `src/content/members.ts` | 世系数据（树形嵌套） + 大事记 | `Member` / `Milestone[]` |
| `src/content/announcements.ts` | 公告 | `Announcement[]` |
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
  primary: '#8B2E2E',   // 朱红，用于标题、强调、按钮
  ink:     '#2B2B2B',   // 墨黑，用于正文与世系树连线
  paper:   '#F5F0E6',   // 米黄，用于页面背景
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

第一版为便于直接演示，仓库内放的是**占位 SVG**（米黄底 + 文字标签）。
替换真实照片时改为 `.jpg` 路径并放入同名文件即可。

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
src/content/     数据文件（唯一允许出现家族字样的地方）
      ↓ 只被下面这一层读取
src/lib/data.ts  数据出口层 —— V2 接数据库的唯一接缝
      ↓ 唯一取数入口
src/app/         页面          src/components/  组件
```

**硬性约束**：页面与组件**一律**通过 `src/lib/data.ts` 取数，
禁止直接 `import` `src/content/` 下的文件。

`src/lib/data.ts` 导出 5 个函数：

```ts
getFamilyConfig(): FamilyConfig
getMemberTree(): Member
getAnnouncements(): Announcement[]   // 已排序：置顶优先 + 时间倒序
getAlbums(): Album[]
getMilestones(): Milestone[]
```

第二版接入数据库时，**只替换这 5 个函数的内部实现**（从「读数据文件」改为「查数据库」），
返回类型保持不变，所有页面代码零改动。

### 为什么成员用树形嵌套

`Member` 用 `children` 递归而非 `fatherId` 扁平关联：第一版无数据库，
嵌套结构在数据文件中书写与阅读最直观，且天然表达世系，同时保证
**递归渲染不会出现重复节点**（每位成员在树中只出现一次）。

第二版迁移到关系型数据库时，在 `data.ts` 内部做扁平化转换，对外接口不变。

### 技术栈

Next.js 16（App Router，全站静态导出）、React 19、TypeScript 5、
Tailwind CSS 4（CSS-first 配置，主题令牌见 `src/app/globals.css`）、Node.js v22。

---

## 目录结构

```
WuFamily/
├── PRD.md                      需求文档
├── README.md                   本文件
├── next.config.ts              静态导出配置
├── postcss.config.mjs          Tailwind 4 的 PostCSS 插件
├── eslint.config.mjs           ESLint 扁平配置
├── public/photos/              相册图片
└── src/
    ├── app/
    │   ├── layout.tsx          全局布局（导航 + 页脚 + 主题色注入 + 元信息）
    │   ├── globals.css         主题令牌、中文排版、世系树连线
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
    ├── lib/data.ts             数据出口层（V2 接数据库的唯一接缝）
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
