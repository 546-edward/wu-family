import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * 注意：本版本已**移除** `output: 'export'`。
   *
   * 原因：新增了管理后台（登录、发布公告、上传 Excel），需要服务端
   * 处理写操作与 SQLite 读写。纯静态导出无法实现这些能力。
   *
   * 因此部署方式由「任意静态托管」变为「需运行 Node 服务」：
   *   npm run dev     开发
   *   npm run build && npm start   生产
   */
  images: {
    // 相册使用原生 <img>，未启用 Next.js 图片优化
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      /**
       * Server Action 请求体上限。
       *
       * 默认仅 1MB，小于 Excel 上传允许的 5MB，会导致较大文件在进入
       * 校验逻辑前就被 Next.js 以 413 拒绝。此处放宽到 6MB，
       * 留给 multipart 边界与文件名字段一点余量；
       * 真正的业务上限仍由 src/lib/excel.ts 的 MAX_FILE_BYTES 控制。
       */
      bodySizeLimit: '6mb',
    },
  },
  /**
   * 不在构建时生成 AGENTS.md / CLAUDE.md，
   * 保持仓库文件与 PRD 第 7 章的目录结构一致。
   */
  agentRules: false,
}

export default nextConfig
