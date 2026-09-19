import 'server-only'
import type {
  Album,
  Announcement,
  FamilyConfig,
  Member,
  Milestone,
} from '@/types'
import { listAnnouncements, getAnnouncement as queryAnnouncement } from '@/lib/queries'
import {
  getAlbums as getStaticAlbums,
  getFamilyConfig as getStaticFamilyConfig,
  getMemberTree as getStaticMemberTree,
  getMilestones as getStaticMilestones,
} from '@/lib/content'

/**
 * 数据出口层 —— 页面与内容之间的唯一接缝（服务端）。
 *
 * 约束：页面**一律**通过本模块或 `src/lib/content.ts` 取数，
 * 不得直接 import `src/content/` 下的文件，也不得直接写 SQL。
 *
 * 演进历史：
 * - V1：全部读 `src/content/` 下的数据文件
 * - V2（当前）：公告改读 SQLite，可由后台在线发布；
 *   家族身份、世系、相册、大事记仍为数据文件（低频变更，无需后台）
 *
 * 本模块标注 `server-only`：因为公告查询依赖 better-sqlite3，
 * 客户端组件请改用 `src/lib/content.ts`（同样签名，纯静态数据）。
 */

/** 家族身份配置 */
export function getFamilyConfig(): FamilyConfig {
  return getStaticFamilyConfig()
}

/** 世系树根节点（始祖） */
export function getMemberTree(): Member {
  return getStaticMemberTree()
}

/**
 * 公告列表：置顶优先，其余按发布时间倒序。
 * 数据来自数据库（后台可增删改），排序在 SQL 层完成。
 */
export function getAnnouncements(): Announcement[] {
  return listAnnouncements()
}

/**
 * 取单条公告详情；不存在返回 null（页面据此返回 404）。
 * 供 `/announcements/[id]` 详情页使用。
 */
export function getAnnouncement(id: string): Announcement | null {
  return queryAnnouncement(id)
}

/** 相册列表 */
export function getAlbums(): Album[] {
  return getStaticAlbums()
}

/** 大事记时间线（按年份升序） */
export function getMilestones(): Milestone[] {
  return getStaticMilestones()
}
