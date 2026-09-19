import type { Album } from '@/types'

/**
 * 相册数据（示例数据）。
 *
 * 图片存放于 `public/photos/`，`url` 使用 `/photos/xxx.svg` 形式的路径。
 * 第一版为便于直接演示，占位图采用 SVG（纯色底 + 文字标签）；
 * 替换真实照片时改为 `.jpg` 路径并放入同名文件即可。
 *
 * 若部署在子路径下，请在 `next.config.ts` 中设置 `basePath`。
 */
export const albums: Album[] = [
  {
    id: 'al-ancestral-hall',
    title: '祖屋与祠堂',
    description: '祖屋正厅、门楼与祠堂内外景。示例占位图，待替换为实拍照片。',
    coverUrl: '/photos/hall-01.svg',
    photos: [
      { url: '/photos/hall-01.svg', caption: '祠堂正门' },
      { url: '/photos/hall-02.svg', caption: '正厅梁架' },
      { url: '/photos/hall-03.svg', caption: '天井与廊庑' },
      { url: '/photos/hall-04.svg', caption: '门楼匾额' },
    ],
  },
  {
    id: 'al-gathering',
    title: '历年聚会',
    description: '历年清明祭祖与族亲聚会的合影。示例占位图，待替换为实拍照片。',
    coverUrl: '/photos/gathering-01.svg',
    photos: [
      { url: '/photos/gathering-01.svg', caption: '某年清明祭祖合影' },
      { url: '/photos/gathering-02.svg', caption: '族亲茶叙' },
      { url: '/photos/gathering-03.svg', caption: '席间合影' },
    ],
  },
  {
    id: 'al-documents',
    title: '旧谱与文书',
    description: '旧族谱书影、契约与家书等家族文书。示例占位图，待替换为实拍照片。',
    coverUrl: '/photos/document-01.svg',
    photos: [
      { url: '/photos/document-01.svg', caption: '旧谱书影' },
      { url: '/photos/document-02.svg', caption: '契约文书' },
      { url: '/photos/document-03.svg', caption: '家书一通' },
    ],
  },
]
