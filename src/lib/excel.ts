import 'server-only'
import ExcelJS from 'exceljs'

/**
 * Excel 解析（通用表格）。
 *
 * 安全约束：
 * - 只读取单元格的**文本值**，不计算公式、不执行任何宏
 * - 限制文件大小、行数与列数，防止超大文件耗尽内存
 * - .xlsx 本质是 zip，exceljs 只解析其中的 XML 数据，不做反序列化执行
 */

/** 单文件大小上限：5MB */
export const MAX_FILE_BYTES = 5 * 1024 * 1024
/** 最多解析行数（不含表头） */
export const MAX_ROWS = 5000
/** 最多列数 */
export const MAX_COLS = 60

export interface ParsedSheet {
  sheetName: string
  columns: string[]
  rows: string[][]
}

/** 把单元格值统一转成可展示的字符串 */
function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''

  // 公式单元格：只取缓存结果，不重新计算
  if (typeof value === 'object' && 'result' in value) {
    return cellToString((value as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue)
  }
  if (typeof value === 'object' && 'richText' in value) {
    return (value as ExcelJS.CellRichTextValue).richText
      .map((r) => r.text)
      .join('')
  }
  if (typeof value === 'object' && 'text' in value) {
    return String((value as ExcelJS.CellHyperlinkValue).text ?? '')
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return String(value)
}

/** 去掉行尾连续空单元格，减少无效数据 */
function trimTrailing(cells: string[]): string[] {
  let end = cells.length
  while (end > 0 && cells[end - 1] === '') end--
  return cells.slice(0, end)
}

/**
 * 解析上传的 xlsx（取第一个工作表）。
 * 首行作为表头；表头为空时以「列N」占位。
 */
export async function parseWorkbook(buffer: Buffer): Promise<ParsedSheet> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer as unknown as ArrayBuffer)

  const ws = wb.worksheets[0]
  if (!ws) throw new Error('文件中没有工作表')

  const colCount = Math.min(ws.columnCount || 0, MAX_COLS)
  if (colCount === 0) throw new Error('工作表为空')

  // 表头
  const headerRow = ws.getRow(1)
  const columns: string[] = []
  for (let c = 1; c <= colCount; c++) {
    const raw = cellToString(headerRow.getCell(c).value).trim()
    columns.push(raw || `列${c}`)
  }

  // 数据行
  const rows: string[][] = []
  const lastRow = Math.min(ws.rowCount || 0, MAX_ROWS + 1)
  for (let r = 2; r <= lastRow; r++) {
    const row = ws.getRow(r)
    const cells: string[] = []
    for (let c = 1; c <= colCount; c++) {
      cells.push(cellToString(row.getCell(c).value).trim())
    }
    const trimmed = trimTrailing(cells)
    // 整行为空则跳过
    if (trimmed.length === 0) continue
    // 补齐到列数，便于表格对齐
    while (trimmed.length < colCount) trimmed.push('')
    rows.push(trimmed)
  }

  if (rows.length === 0) throw new Error('表中没有数据行（首行被识别为表头）')

  return { sheetName: ws.name, columns, rows }
}

/** 校验上传文件的基本约束 */
export function validateFile(file: {
  name: string
  size: number
}): { ok: true } | { ok: false; error: string } {
  const lower = file.name.toLowerCase()
  if (!lower.endsWith('.xlsx')) {
    return { ok: false, error: '仅支持 .xlsx 格式（不支持 .xls 与 .csv）' }
  }
  if (file.size === 0) {
    return { ok: false, error: '文件为空' }
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `文件超过 ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB 上限`,
    }
  }
  return { ok: true }
}
