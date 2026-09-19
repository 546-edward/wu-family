import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * 全站静态导出：所有页面在构建时生成，
   * 可直接托管于任意静态服务或 CDN，无服务器运行成本。
   */
  output: 'export',
  images: {
    // 静态导出不支持 Next.js 图片优化服务，相册使用原生 <img> 即可
    unoptimized: true,
  },
  /**
   * 不在构建时生成 AGENTS.md / CLAUDE.md，
   * 保持仓库文件与 PRD 第 7 章的目录结构一致。
   */
  agentRules: false,
}

export default nextConfig
