import Papa from 'papaparse'

/**
 * Read a File as text using FileReader.
 * This is a workaround for the macOS/Chrome bug where PapaParse's
 * internal FileReader fails with "NotReadableError" on drag-and-dropped
 * files. By reading the text ourselves first, we bypass that issue.
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the file. Please try selecting it using the file picker instead of dragging.'))
    reader.readAsText(file)
  })
}

export async function parseCSV(file) {
  // Step 1: Read file as text (avoids browser permission bug)
  const text = await readFileAsText(file)

  // Step 2: Parse the text string with PapaParse
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error('Invalid CSV file'))
          return
        }
        resolve({
          data: results.data,
          columns: results.meta.fields || [],
          rowCount: results.data.length
        })
      },
      error: (err) => reject(err)
    })
  })
}

export function getSchema(columns, data) {
  return columns.map(col => {
    const sample = data.slice(0, 5).map(r => r[col]).filter(v => v != null)
    const type = typeof sample[0] === 'number' ? 'number' : 'string'
    return { name: col, type, sample: sample.slice(0, 3).join(', ') }
  })
}

export function getSampleRows(data, n = 50) {
  return data.slice(0, n)
}

export function getCategoricalColumns(columns, data) {
  const skipWords = ['id', 'name', 'code', 'number', 'address', 'phone', 'mail', 'pan', 'pin', 'ifsc']
  return columns.filter(col => {
    const colLower = String(col).toLowerCase()
    if (skipWords.some(w => colLower.includes(w))) return false
    
    const vals = [...new Set(data.map(r => r[col]).filter(v => v != null && String(v).trim() !== ''))]
    return typeof vals[0] === 'string' && vals.length <= 10 && vals.length >= 2
  }).slice(0, 4)
}
