// Script para inspeccionar la estructura del archivo 'Reporte diario.xlsx'
// Usa exceljs para listar hojas, headers y primeras filas.
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

async function run() {
  const filenameCandidates = [
    'Reporte diario.xlsx',
    'Reporte diario.xls',
    'reporte diario.xlsx',
    'Liquidación Diaria.xlsx',
    'Liquidacion Diaria.xlsx'
  ];
  const baseDir = process.cwd();
  let foundPath = null;
  for (const f of filenameCandidates) {
    const full = path.join(baseDir, f);
    if (fs.existsSync(full)) { foundPath = full; break; }
  }
  if (!foundPath) {
    console.error('❌ No se encontró archivo plantilla.');
    process.exit(1);
  }
  console.log('📄 Analizando plantilla:', foundPath);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(foundPath);
  console.log('📚 Hojas encontradas:', wb.worksheets.length);
  const summary = [];
  wb.worksheets.forEach((ws, idx) => {
    const sheetInfo = { index: idx, name: ws.name, headers: [], sampleRows: [] };
    // Detect first non-empty row as header (heurística)
    for (let r = 1; r <= 10; r++) {
      const row = ws.getRow(r);
      const values = row.values.slice(1).map(v => (v && v.text) ? v.text : v); // remove first empty index
      const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');
      if (nonEmpty.length >= 3) { // assume header
        sheetInfo.headers = values.map(v => (v === undefined ? '' : v));
        // collect next 5 data rows
        for (let d = r + 1; d <= r + 5; d++) {
          const drow = ws.getRow(d);
            const dvals = drow.values.slice(1).map(v => (v && v.text) ? v.text : v);
            if (dvals.some(x => x !== null && x !== undefined && x !== '')) {
              sheetInfo.sampleRows.push(dvals);
            }
        }
        break;
      }
    }
    summary.push(sheetInfo);
  });
  console.log(JSON.stringify(summary, null, 2));
}

run().catch(err => { console.error(err); process.exit(1); });
