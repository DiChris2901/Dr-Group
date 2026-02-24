/**
 * Refactor LiquidacionesPage.jsx:
 * 1. Add imports for liquidacionesHelpers + VirtualTable
 * 2. Remove standalone definitions moved to helpers (LOG_COLORS_BY_TYPE, formatCurrencyCompact, formatCurrencyCOP)
 * 3. Remove VirtualTable, useMeasure, TabPanel definitions
 * 4. Remove useCallback-wrapped pure functions (replace with imported helpers)
 * 5. Remove react-window import (moved to VirtualTable.jsx)
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'LiquidacionesPage.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Original: ${lines.length} lines`);

const skip = new Set();
const replacements = new Map();

function findLine(pattern, startFrom = 0) {
  for (let i = startFrom; i < lines.length; i++) {
    if (lines[i].includes(pattern)) return i;
  }
  return -1;
}

function findFunctionEnd(startLine) {
  let braceCount = 0;
  let started = false;
  for (let i = startLine; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { braceCount++; started = true; }
      if (ch === '}') braceCount--;
    }
    if (started && braceCount === 0) return i;
  }
  return -1;
}

function markRange(start, end, label) {
  if (start === -1 || end === -1) { console.log(`  SKIP (not found): ${label}`); return; }
  for (let i = start; i <= end; i++) skip.add(i);
  console.log(`  REMOVE [${start+1}-${end+1}]: ${label}`);
}

// 1. Remove `import { FixedSizeList as VirtualList } from 'react-window';`
const reactWindowLine = findLine("FixedSizeList as VirtualList");
if (reactWindowLine >= 0) markRange(reactWindowLine, reactWindowLine, 'react-window import');

// 2. Remove LOG_COLORS_BY_TYPE constant
const logColorsStart = findLine('const LOG_COLORS_BY_TYPE');
if (logColorsStart >= 0) {
  // Find the closing };
  let end = logColorsStart;
  for (let i = logColorsStart; i < lines.length; i++) {
    if (lines[i].includes('};')) { end = i; break; }
  }
  markRange(logColorsStart, end, 'LOG_COLORS_BY_TYPE');
}

// 3. Remove formatCurrencyCompact function
const fccLine = findLine('function formatCurrencyCompact');
if (fccLine >= 0) {
  let start = fccLine;
  if (lines[start - 1]?.trim() === '') start--;
  const end = findFunctionEnd(fccLine);
  markRange(start, end, 'formatCurrencyCompact');
}

// 4. Remove formatCurrencyCOP function
const fcopLine = findLine('function formatCurrencyCOP');
if (fcopLine >= 0) {
  let start = fcopLine;
  if (lines[start - 1]?.trim() === '') start--;
  const end = findFunctionEnd(fcopLine);
  markRange(start, end, 'formatCurrencyCOP');
}

// 5. Remove useMeasure hook
const useMeasureLine = findLine('function useMeasure()');
if (useMeasureLine >= 0) {
  let start = useMeasureLine;
  if (lines[start - 1]?.trim() === '') start--;
  // useMeasure returns [ref, size] — find the function end
  const end = findFunctionEnd(useMeasureLine);
  markRange(start, end, 'useMeasure');
}

// 6. Remove VirtualTable component
const vtLine = findLine('function VirtualTable(');
if (vtLine >= 0) {
  let start = vtLine;
  if (lines[start - 1]?.trim() === '') start--;
  const end = findFunctionEnd(vtLine);
  markRange(start, end, 'VirtualTable');
}

// 7. Remove TabPanel component
const tpLine = findLine('function TabPanel(');
if (tpLine >= 0) {
  let start = tpLine;
  if (lines[start - 1]?.trim() === '') start--;
  const end = findFunctionEnd(tpLine);
  markRange(start, end, 'TabPanel');
}

// 8. Remove useCallback-wrapped pure functions and replace with imports
// parseFechaToDate
const parseFechaLine = findLine('const parseFechaToDate = useCallback(');
if (parseFechaLine >= 0) {
  // Find the closing `}, []);` 
  let end = parseFechaLine;
  for (let i = parseFechaLine; i < lines.length; i++) {
    if (lines[i].trim() === '}, []);') { end = i; break; }
  }
  let start = parseFechaLine;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'parseFechaToDate useCallback');
}

// formatearFechaSinTimezone
const formatFechaLine = findLine('const formatearFechaSinTimezone = useCallback(');
if (formatFechaLine >= 0) {
  let end = formatFechaLine;
  for (let i = formatFechaLine; i < lines.length; i++) {
    if (lines[i].trim() === '}, []);') { end = i; break; }
  }
  let start = formatFechaLine;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'formatearFechaSinTimezone useCallback');
}

// calcularDiasMes
const calcDiasLine = findLine('const calcularDiasMes = useCallback(');
if (calcDiasLine >= 0) {
  let end = calcDiasLine;
  for (let i = calcDiasLine; i < lines.length; i++) {
    if (lines[i].trim() === '}, []);') { end = i; break; }
  }
  let start = calcDiasLine;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'calcularDiasMes useCallback');
}

// determinarNovedad
const detNovedadLine = findLine('const determinarNovedad = useCallback(');
if (detNovedadLine >= 0) {
  let end = detNovedadLine;
  for (let i = detNovedadLine; i < lines.length; i++) {
    if (lines[i].trim() === '}, []);') { end = i; break; }
  }
  let start = detNovedadLine;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'determinarNovedad useCallback');
}

// convertirFechaAPeriodo
const convFechaLine = findLine('const convertirFechaAPeriodo = useCallback(');
if (convFechaLine >= 0) {
  let end = convFechaLine;
  for (let i = convFechaLine; i < lines.length; i++) {
    if (lines[i].trim() === '}, []);') { end = i; break; }
  }
  let start = convFechaLine;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'convertirFechaAPeriodo useCallback');
}

// ============================================================
// Build output
// ============================================================
const output = [];

// Where to insert new imports
const xlsxImportLine = findLine("import * as XLSX from 'xlsx'");
const virtualTableUsages = findLine('VirtualTable');

// New import lines to add
const helpersImport = `import {
  LOG_COLORS_BY_TYPE,
  formatCurrencyCompact,
  formatCurrencyCOP,
  parseFechaToDate,
  formatearFechaSinTimezone,
  calcularDiasMes,
  determinarNovedad,
  convertirFechaAPeriodo
} from './liquidaciones/liquidacionesHelpers';`;

const virtualTableImport = `import VirtualTable, { TabPanel } from '../components/common/VirtualTable';`;

for (let i = 0; i < lines.length; i++) {
  if (replacements.has(i)) {
    output.push(replacements.get(i));
    continue;
  }
  if (skip.has(i)) continue;
  
  output.push(lines[i]);
  
  // Insert helpers import after XLSX import
  if (i === xlsxImportLine) {
    output.push(helpersImport);
    output.push(virtualTableImport);
  }
}

// Clean up consecutive blank lines
let result = output.join('\n');
result = result.replace(/\n{4,}/g, '\n\n');

// Also remove `useCallback` from the React import if it's no longer used
// Check if useCallback is still used in the result
const useCallbackCount = (result.match(/useCallback\(/g) || []).length;
if (useCallbackCount === 0) {
  result = result.replace('useCallback, ', '');
}

fs.writeFileSync(filePath, result, 'utf8');
const finalLines = result.split('\n').length;
console.log(`\nFinal: ${finalLines} lines (saved ${lines.length - finalLines} lines)`);
