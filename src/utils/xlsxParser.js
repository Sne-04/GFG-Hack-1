import * as XLSX from 'xlsx'

/**
 * Parse an Excel (.xlsx / .xls) file using SheetJS.
 * Returns the same shape as parseCSV: { columns, data, rowCount }
 */
export function parseXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        // Use the first sheet
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) throw new Error('No sheets found in workbook')
        const worksheet = workbook.Sheets[sheetName]
        // Convert to array of objects; missing cells → empty string
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        if (!jsonData.length) throw new Error('Spreadsheet is empty or has no data rows')
        const columns = Object.keys(jsonData[0])
        resolve({ columns, data: jsonData, rowCount: jsonData.length })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
