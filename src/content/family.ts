import type { FamilyConfig } from '@/types'

/**
 * 家族身份配置 —— 全站唯一的家族身份来源。
 *
 * 接入新家族时只需修改本文件（及 members / announcements / albums），
 * `src/app/` 与 `src/components/` 下的代码保持不变。
 *
 * 标记「待补充」的字段需在资料确认后填写，并同步更新 PRD.md 附录。
 */
export const family: FamilyConfig = {
  surname: '伍',
  name: '伍氏家族',
  shortName: '伍氏',
  hallName: '待补充',
  ancestor: {
    name: '待补充',
    origin: '待补充',
    brief: '待补充',
  },
  generationPoem: '待补充',
  description:
    '待补充。本栏用于陈列家族源流、迁徙与繁衍概况。资料确认后，' +
    '在家中长辈的口述与族谱旧本基础上整理成文，录入本页即可对外展示。',
  contact: {
    address: '待补充',
    email: '待补充',
  },
  theme: {
    primary: '#8B2E2E', // 朱红：标题、强调
    ink: '#22303C', // 墨青：正文与世系树连线
    paper: '#DCEAF5', // 浅蓝：底色主调
    accent: '#3A6EA5', // 靛蓝：分隔线、角饰、印章点缀
  },
}
