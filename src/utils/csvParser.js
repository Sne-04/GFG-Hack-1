import Papa from 'papaparse'

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
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

export function getSampleRows(data, n = 3) {
  return data.slice(0, n)
}

export function getCategoricalColumns(columns, data) {
  return columns.filter(col => {
    const vals = [...new Set(data.map(r => r[col]).filter(v => v != null))]
    return typeof vals[0] === 'string' && vals.length <= 20 && vals.length >= 2
  }).slice(0, 4)
}
