import { getFamilyConfig } from '@/lib/content'

/**
 * 全局页脚：家族全称、联系方式、版权年份。
 * 全部取自 `family`，不含硬编码家族字样。
 */
export default function Footer() {
  const family = getFamilyConfig()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-8 border-t border-brand-accent/35">
      <hr className="rule-festive" />
      <div className="mx-auto w-full max-w-6xl px-5 py-8 text-sm text-brand-ink/70 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-title text-lg tracking-widest text-brand-primary">
              {family.name}
            </p>
            <p className="mt-1 text-brand-ink/50">堂号：{family.hallName}</p>
          </div>

          <address className="not-italic leading-7">
            <p>
              <span className="text-brand-ink/45">地址：</span>
              {family.contact.address}
            </p>
            <p>
              <span className="text-brand-ink/45">邮箱：</span>
              {family.contact.email}
            </p>
          </address>
        </div>

        <p className="mt-6 border-t border-brand-accent/20 pt-4 text-xs text-brand-ink/45">
          © {year} {family.name}
        </p>
      </div>
    </footer>
  )
}
