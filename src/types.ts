/**
 * 全站类型定义。
 *
 * 这些类型是 `src/content/`（数据文件）与 `src/lib/data.ts`（数据出口层）
 * 之间的契约；第二版接入数据库时，类型保持不变，仅替换 data.ts 内部实现。
 */

/** 家族身份配置 —— 通用家族站的唯一身份来源 */
export interface FamilyConfig {
  /** 姓氏，如「伍」 */
  surname: string
  /** 站点全称，如「伍氏家族」 */
  name: string
  /** 短称，用于导航栏 */
  shortName: string
  /** 堂号 */
  hallName: string
  /** 始祖 */
  ancestor: {
    /** 始祖名讳 */
    name: string
    /** 郡望 / 发源地 */
    origin: string
    /** 简介 */
    brief: string
  }
  /** 字辈诗 */
  generationPoem: string
  /** 家族简介 */
  description: string
  /** 联系方式 */
  contact: {
    address: string
    email: string
  }
  /** 主题色 */
  theme: {
    /** 主色（朱红） */
    primary: string
    /** 墨色（正文 / 连线） */
    ink: string
    /** 纸色（背景） */
    paper: string
    /** 点缀色（金），用于喜庆装饰与分隔线 */
    accent: string
  }
}

/**
 * 家族成员（树形嵌套）。
 *
 * 采用 `children` 递归而非 `fatherId` 扁平关联：第一版无数据库，
 * 嵌套结构在数据文件中书写与阅读最直观，且天然表达世系。
 * 第二版迁移到关系型数据库时，在 `data.ts` 内部做扁平化转换，对外接口不变。
 */
export interface Member {
  /** 稳定标识，V2 可直接作为数据库主键 */
  id: string
  name: string
  gender: 'M' | 'F'
  /** 世代，始祖为 1 */
  generation: number
  /** 房支 */
  branch?: string
  birthYear?: number
  deathYear?: number
  hometown?: string
  /** 生平简介 */
  bio?: string
  /** 配偶姓名 */
  spouseName?: string
  /** 子代，递归 */
  children?: Member[]
}

/** 公告 */
export interface Announcement {
  id: string
  title: string
  content: string
  authorName: string
  /** ISO 日期字符串 */
  publishedAt: string
  /** 是否置顶 */
  isPinned?: boolean
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

/**
 * Excel 上传记录（通用表格）。
 * 不限定列含义，表头原样保存，便于展示任意表格。
 */
export interface Upload {
  id: string
  title: string
  fileName: string
  /** 实际存储文件名（非公开目录） */
  storedName: string
  sheetName: string
  rowCount: number
  colCount: number
  /** 表头 */
  columns: string[]
  sizeBytes: number
  uploadedAt: string
}

/** Excel 分页查询结果 */
export interface UploadPage {
  upload: Upload
  rows: { rowIndex: number; cells: string[] }[]
  page: number
  pageSize: number
  totalRows: number
  totalPages: number
}
