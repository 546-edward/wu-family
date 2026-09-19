import type { Album, FamilyConfig, Member, Milestone } from '@/types'
import { family } from '@/content/family'
import { memberTree, milestones } from '@/content/members'
import { albums } from '@/content/albums'

/**
 * 静态内容出口层（客户端安全）。
 *
 * 本模块只读取 `src/content/` 下的数据文件，**不引入数据库**，
 * 因此可以被客户端组件（如 Nav、Footer、世系树）安全引用。
 *
 * 与 `src/lib/data.ts` 的分工：
 * - `content.ts`（本文件）：家族身份、世系、相册、大事记 —— 低频变更，仍是数据文件
 * - `data.ts`：对外统一取数入口；其中公告改读数据库，仅限服务端使用
 *
 * 之所以拆开：公告改为查库后，`data.ts` 会依赖 better-sqlite3，
 * 若客户端组件直接引用会把原生模块打进浏览器包而导致构建失败。
 */

/** 家族身份配置 */
export function getFamilyConfig(): FamilyConfig {
  return family
}

/** 世系树根节点（始祖） */
export function getMemberTree(): Member {
  return memberTree
}

/** 相册列表 */
export function getAlbums(): Album[] {
  return albums
}

/** 大事记时间线（按年份升序） */
export function getMilestones(): Milestone[] {
  return [...milestones].sort((a, b) => a.year.localeCompare(b.year))
}
