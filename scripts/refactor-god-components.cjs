/**
 * Refactoring script for T3.3-T3.5: Extract utilities from 3 God Components
 * - NewCommitmentPage.jsx → commitmentHelpers.js
 * - CompaniesPage.jsx → companyHelpers.js
 * - UserManagementPage.jsx → uses companyHelpers.getRoleChipColor
 *
 * Strategy: line-range based surgical removal + import insertion
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'pages');

// =====================================================
// T3.4: NewCommitmentPage.jsx
// =====================================================
function refactorNewCommitmentPage() {
  const filePath = path.join(SRC, 'NewCommitmentPage.jsx');
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const origLen = lines.length;

  // 1. Add import at top (after last import line)
  const lastImportIdx = findLastImportLine(lines);
  const importStatement = `import { createLocalDate, getDefaultRecurringCount, formatNitId, isColjuegosCommitment as isColjuegosCommitmentCheck, formatNumberWithCommas, parseFormattedNumber, createAmountChangeHandler, calculateTotal as calculateTotalHelper, getMissingFields as getMissingFieldsHelper, formatCurrency, periodicityOptions, MONTHS } from './commitments/commitmentHelpers';`;
  lines.splice(lastImportIdx + 1, 0, importStatement);

  // We'll collect ranges to remove (1-indexed in original, convert to 0-indexed after import insertion)
  // Since we inserted 1 line at lastImportIdx+1, all original line numbers after that shift +1
  // But we'll work with the content after insertion, searching by text patterns

  let code = lines.join('\n');

  // 2. Remove inline createLocalDate (preserve the call references)
  code = removeBlock(code,
    '  // Helper para crear fecha local sin problemas de zona horaria\n  const createLocalDate = (dateString) => {',
    '  };\n  \n  const [companies, setCompanies]'
  , '  const [companies, setCompanies]');

  // 3. Remove inline getDefaultRecurringCount
  code = removeBlock(code,
    '  // 🔄 Calcular número de compromisos sugerido según periodicidad (limitado al año en curso)\n  const getDefaultRecurringCount = (periodicity, baseDate = null) => {',
    '  };\n\n  // 🆔 Formatear NIT/Identificación automáticamente'
  , '  // 🆔 Formatear NIT/Identificación automáticamente');

  // 4. Remove inline formatNitId
  code = removeBlock(code,
    '  // 🆔 Formatear NIT/Identificación automáticamente\n  const formatNitId = (value) => {',
    '  };\n\n  // 🎮 Detectar si es compromiso de Coljuegos'
  , '  // 🎮 Detectar si es compromiso de Coljuegos');

  // 5. Replace inline isColjuegosCommitment with wrapper using imported function
  code = code.replace(
    '  // 🎮 Detectar si es compromiso de Coljuegos\n  const isColjuegosCommitment = () => {\n    return formData.beneficiary && \n           formData.beneficiary.toLowerCase().includes(\'coljuegos\');\n  };',
    '  // 🎮 Detectar si es compromiso de Coljuegos\n  const isColjuegosCommitment = () => isColjuegosCommitmentCheck(formData.beneficiary);'
  );

  // 6. Remove inline formatNumberWithCommas + parseFormattedNumber
  code = removeBlock(code,
    '  // 💰 Funciones para formateo de moneda colombiana (CON DECIMALES)\n  const formatNumberWithCommas = (value) => {',
    '  };\n\n  const parseFormattedNumber = (value) => {'
  , '  const parseFormattedNumber = (value) => {');

  code = removeBlock(code,
    '  const parseFormattedNumber = (value) => {\n    if (!value && value !== 0) return \'\';\n    \n    // Convertir puntos de miles a nada y comas decimales a puntos\n    return value.toString()\n      .replace(/\\./g, \'\') // Remover separadores de miles\n      .replace(/,/g, \'.\'); // Convertir coma decimal a punto\n  };',
    ''
  , '');

  // 7. Replace 7 identical amount handlers with factory calls
  const amountHandlers = [
    { name: 'handleAmountChange', field: 'baseAmount' },
    { name: 'handleIvaChange', field: 'iva' },
    { name: 'handleRetefuenteChange', field: 'retefuente' },
    { name: 'handleIcaChange', field: 'ica' },
    { name: 'handleDiscountChange', field: 'discount' },
    { name: 'handleDerechosChange', field: 'derechosExplotacion' },
    { name: 'handleGastosChange', field: 'gastosAdministracion' },
  ];

  for (const handler of amountHandlers) {
    // Find and remove each handler body
    const handlerRegex = new RegExp(
      `  const ${handler.name} = \\(e\\) => \\{[\\s\\S]*?\\n  \\};`,
      ''
    );
    const match = code.match(handlerRegex);
    if (match) {
      code = code.replace(match[0], `  const ${handler.name} = createAmountChangeHandler('${handler.field}', parseFormattedNumber, setFormData);`);
    }
  }

  // 8. Replace inline calculateTotal with wrapper
  code = code.replace(
    /  \/\/ 🧮 Calcular automáticamente el total\n  const calculateTotal = \(\) => \{[\s\S]*?\n  \};/,
    '  // 🧮 Calcular automáticamente el total\n  const calculateTotal = () => calculateTotalHelper(formData, isColjuegosCommitment());'
  );

  // 9. Remove getMissingFields and replace with wrapper
  code = code.replace(
    /  \/\/ 🔍 FUNCIÓN PARA IDENTIFICAR CAMPOS FALTANTES\n  const getMissingFields = \(\) => \{[\s\S]*?\n    return missingFields;\n  \};/,
    '  // 🔍 FUNCIÓN PARA IDENTIFICAR CAMPOS FALTANTES\n  const getMissingFields = () => getMissingFieldsHelper(formData, isColjuegosCommitment());'
  );

  // 10. Replace periodicityOptions constant
  code = code.replace(
    /  \/\/ Opciones para los selects\n  const periodicityOptions = \[\n[\s\S]*?\n  \];/,
    '  // Opciones para los selects (imported from commitmentHelpers)'
  );

  // 11. Replace months constant
  code = code.replace(
    /  const months = \[\n    \{ value: 1, label: 'Enero' \},[\s\S]*?\{ value: 12, label: 'Diciembre' \}\n  \];/,
    '  const months = MONTHS;'
  );

  // 12. Replace inline formatCurrency
  code = code.replace(
    /  const formatCurrency = \(value\) => \{\n    if \(!value\) return '';\n    return new Intl\.NumberFormat\('es-CO',[\s\S]*?\n  \};/,
    '  // formatCurrency imported from commitmentHelpers'
  );

  // Clean up multiple blank lines
  code = code.replace(/\n{4,}/g, '\n\n\n');

  fs.writeFileSync(filePath, code, 'utf-8');
  const newLen = code.split('\n').length;
  console.log(`NewCommitmentPage.jsx: ${origLen} → ${newLen} lines (${origLen - newLen} removed)`);
}

// =====================================================
// T3.5: CompaniesPage.jsx
// =====================================================
function refactorCompaniesPage() {
  const filePath = path.join(SRC, 'CompaniesPage.jsx');
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const origLen = lines.length;

  // 1. Add import
  const lastImportIdx = findLastImportLine(lines);
  const importStatement = `import { formatDocumentType, formatFileSize } from './companies/companyHelpers';`;
  lines.splice(lastImportIdx + 1, 0, importStatement);

  let code = lines.join('\n');

  // 2. Remove inline formatDocumentType
  code = code.replace(
    /  \/\/ Formatear tipo de documento de MIME a nombre amigable\n  const formatDocumentType = \(type\) => \{[\s\S]*?\n  \};/,
    '  // formatDocumentType imported from companyHelpers'
  );

  // 3. Remove inline formatFileSize
  code = code.replace(
    /  \/\/ Formatear tamaño de archivo\n  const formatFileSize = \(bytes, isEstimated = false\) => \{[\s\S]*?\n  \};/,
    '  // formatFileSize imported from companyHelpers'
  );

  // Clean up
  code = code.replace(/\n{4,}/g, '\n\n\n');

  fs.writeFileSync(filePath, code, 'utf-8');
  const newLen = code.split('\n').length;
  console.log(`CompaniesPage.jsx: ${origLen} → ${newLen} lines (${origLen - newLen} removed)`);
}

// =====================================================
// T3.3: UserManagementPage.jsx
// =====================================================
function refactorUserManagementPage() {
  const filePath = path.join(SRC, 'UserManagementPage.jsx');
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const origLen = lines.length;

  // 1. Add import
  const lastImportIdx = findLastImportLine(lines);
  const importStatement = `import { getRoleChipColor } from './companies/companyHelpers';`;
  lines.splice(lastImportIdx + 1, 0, importStatement);

  let code = lines.join('\n');

  // 2. Remove inline getRoleChipColor
  code = code.replace(
    /  const getRoleChipColor = \(role\) => \{\n    switch \(role\) \{\n      case 'ADMIN': return 'error';\n      case 'MANAGER': return 'warning';\n      case 'EMPLOYEE': return 'primary';\n      case 'VIEWER': return 'default';\n      default: return 'default';\n    \}\n  \};/,
    '  // getRoleChipColor imported from companyHelpers'
  );

  // Clean up
  code = code.replace(/\n{4,}/g, '\n\n\n');

  fs.writeFileSync(filePath, code, 'utf-8');
  const newLen = code.split('\n').length;
  console.log(`UserManagementPage.jsx: ${origLen} → ${newLen} lines (${origLen - newLen} removed)`);
}

// =====================================================
// Helpers
// =====================================================
function findLastImportLine(lines) {
  let lastImport = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^import\s/) || lines[i].match(/^} from '/)) {
      lastImport = i;
    }
  }
  return lastImport;
}

function removeBlock(code, startMarker, endMarker, replacement) {
  const startIdx = code.indexOf(startMarker);
  if (startIdx === -1) {
    console.warn(`  WARNING: Start marker not found: ${startMarker.substring(0, 60)}...`);
    return code;
  }
  
  let endIdx;
  if (endMarker === '') {
    // Remove just the startMarker text
    endIdx = startIdx + startMarker.length;
  } else {
    endIdx = code.indexOf(endMarker, startIdx);
    if (endIdx === -1) {
      console.warn(`  WARNING: End marker not found: ${endMarker.substring(0, 60)}...`);
      return code;
    }
  }
  
  return code.substring(0, startIdx) + replacement + code.substring(endIdx);
}

// =====================================================
// Run all
// =====================================================
try {
  console.log('=== T3.3-T3.5: God Component Utilities Extraction ===\n');
  
  refactorNewCommitmentPage();
  refactorCompaniesPage();
  refactorUserManagementPage();
  
  console.log('\n✅ All 3 files refactored successfully');
} catch (err) {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
}
