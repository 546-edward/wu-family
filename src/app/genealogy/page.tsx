import type { Metadata } from 'next'
import { getMemberTree } from '@/lib/data'
import GenealogyTree from '@/components/GenealogyTree'

export const metadata: Metadata = {
  title: '世系树',
  description: '家族世系脉络，可逐代展开，点击成员查看详情。',
}

/**
 * 世系树页面（服务端）。
 * 取好数据后交给客户端组件渲染交互部分。
 */
export default function GenealogyPage() {
  const root = getMemberTree()
  return <GenealogyTree root={root} />
}
