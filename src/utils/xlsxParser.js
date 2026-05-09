import * as XLSX from 'xlsx'

/**
 * Parse an Excel file from an ArrayBuffer.
 * Returns the same shape as parseCSV: { columns, data, rowCount }
 */
export function parseXLSXFromBuffer(buffer) {
  const data = new Uint8Array(buffer)
  const workbook = XLSX.read(data, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('No sheets found in workbook')
  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
  if (!jsonData.length) throw new Error('Spreadsheet is empty or has no data rows')
  const columns = Object.keys(jsonData[0])
  return { columns, data: jsonData, rowCount: jsonData.length }
}

/**
 * Legacy wrapper: parseXLSX accepts a File object.
 * Reads it into ArrayBuffer then parses.
 */
export function parseXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        resolve(parseXLSXFromBuffer(e.target.result))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
