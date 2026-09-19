import type {
  Album,
  Announcement,
  FamilyConfig,
  Member,
  Milestone,
} from '@/types'
import { family } from '@/content/family'
import { memberTree, milestones } from '@/content/members'
import { announcements } from '@/content/announcements'
import { albums } from '@/content/albums'

/**
 * 数据出口层 —— 页面与内容之间的唯一接缝。
 *
 * 约束：`src/app/` 与 `src/components/` 下的文件**一律**通过本模块取数，
 * 不得直接 import `src/content/` 下的文件。
 *
 * V2 接入数据库时，仅需把下列函数的实现从「读数据文件」改为「查询数据库」，
 * 返回类型保持不变，所有页面代码无需修改。
 */

/** 家族身份配置 */
export function getFamilyConfig(): FamilyConfig {
  return family
}

/** 世系树根节点（始祖） */
export function getMemberTree(): Member {
  return memberTree
}

/**
 * 公告列表：置顶优先，其余按发布时间倒序。
 * 排序在出口层统一处理，避免各页面重复实现。
 */
export function getAnnouncements(): Announcement[] {
  return [...announcements].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1
    }
    return b.publishedAt.localeCompare(a.publishedAt)
  })
}

/** 相册列表 */
export function getAlbums(): Album[] {
  return albums
}

/** 大事记时间线（按年份升序） */
export function getMilestones(): Milestone[] {
  return [...milestones].sort((a, b) => a.year.localeCompare(b.year))
}
