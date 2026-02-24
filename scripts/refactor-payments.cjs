/**
 * Refactor PaymentsPage.jsx - Line-range based approach
 * 
 * Operations:
 * 1. Add paymentsHelpers + EditPaymentDialog imports
 * 2. Remove isValid/PDFDocument imports (moved to paymentsHelpers)
 * 3. Remove inline utility functions (createLocalDate, formatPaymentDate, formatDateForInput)
 * 4. Remove edit-exclusive state vars
 * 5. Remove loadCommitmentData
 * 6. Remove getStatusColor, getStatusIcon, getStatusText (now imported or external)
 * 7. Simplify handleEditPayment
 * 8. Remove all edit-exclusive handlers + utility functions
 * 9. Replace edit/delete dialog JSX with <EditPaymentDialog />
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'PaymentsPage.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Original: ${lines.length} lines`);

// ============================================================
// PHASE 1: Mark line ranges to REMOVE or REPLACE
// ============================================================
// Using 0-indexed line numbers (original file is 1-indexed in the read_file output)
// Line X in read_file = index X-1 here

const skip = new Set(); // Lines to skip entirely
const replacements = new Map(); // lineIndex -> replacement text

// --- Find exact line ranges using content matching ---

function findLine(pattern, startFrom = 0) {
  for (let i = startFrom; i < lines.length; i++) {
    if (lines[i].includes(pattern)) return i;
  }
  return -1;
}

function findFunctionEnd(startLine) {
  // Find the closing brace at the same indentation level
  let braceCount = 0;
  let started = false;
  for (let i = startLine; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { braceCount++; started = true; }
      if (ch === '}') { braceCount--; }
    }
    if (started && braceCount === 0) return i;
  }
  return -1;
}

function markRange(start, end, label) {
  if (start === -1 || end === -1) {
    console.log(`  SKIP (not found): ${label}`);
    return;
  }
  // Also remove blank/comment lines immediately before if they're related
  for (let i = start; i <= end; i++) skip.add(i);
  console.log(`  REMOVE [${start+1}-${end+1}]: ${label}`);
}

// 1. Remove `import { isValid } from 'date-fns';`
const isValidLine = findLine("import { isValid } from 'date-fns'");
if (isValidLine >= 0) markRange(isValidLine, isValidLine, 'isValid import');

// 2. Remove `import { PDFDocument } from 'pdf-lib';`
const pdfDocLine = findLine("import { PDFDocument } from 'pdf-lib'");
if (pdfDocLine >= 0) markRange(pdfDocLine, pdfDocLine, 'PDFDocument import');

// 3. Remove createLocalDate function (inside component)
const createLocalDateLine = findLine('const createLocalDate = (dateString)');
if (createLocalDateLine >= 0) {
  // Also remove comment before it
  let commentStart = createLocalDateLine;
  if (lines[createLocalDateLine - 1]?.trim() === '') commentStart--;
  if (lines[commentStart - 1]?.includes('Helper para crear fecha local')) commentStart--;
  if (lines[commentStart - 1]?.includes('//')) commentStart--;
  const end = findFunctionEnd(createLocalDateLine);
  markRange(commentStart, end, 'createLocalDate');
}

// 4. Remove formatPaymentDate function
const formatPaymentDateLine = findLine('const formatPaymentDate = (date)');
if (formatPaymentDateLine >= 0) {
  let commentStart = formatPaymentDateLine;
  if (lines[formatPaymentDateLine - 1]?.trim() === '') commentStart--;
  if (lines[commentStart - 1]?.includes('Helper para formatear fechas')) commentStart--;
  const end = findFunctionEnd(formatPaymentDateLine);
  markRange(commentStart, end, 'formatPaymentDate');
}

// 5. Remove formatDateForInput function
const formatDateForInputLine = findLine('const formatDateForInput = (date)');
if (formatDateForInputLine >= 0) {
  let commentStart = formatDateForInputLine;
  if (lines[formatDateForInputLine - 1]?.trim() === '') commentStart--;
  if (lines[commentStart - 1]?.includes('Helper para convertir')) commentStart--;
  const end = findFunctionEnd(formatDateForInputLine);
  markRange(commentStart, end, 'formatDateForInput');
}

// 6. Remove editFormData state (multi-line object)
const editFormDataLine = findLine('const [editFormData, setEditFormData] = useState({');
if (editFormDataLine >= 0) {
  // Find closing });
  let endLine = editFormDataLine;
  for (let i = editFormDataLine; i < lines.length; i++) {
    if (lines[i].includes('});')) { endLine = i; break; }
  }
  markRange(editFormDataLine, endLine, 'editFormData state');
}

// 7. Remove loadingCommitment + commitmentData states
const loadCommitStateLine = findLine('const [loadingCommitment, setLoadingCommitment]');
if (loadCommitStateLine >= 0) {
  let start = loadCommitStateLine;
  if (lines[start - 1]?.includes('Estados adicionales')) start--;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, loadCommitStateLine, 'loadingCommitment state');
}
const commitDataStateLine = findLine('const [commitmentData, setCommitmentData]');
if (commitDataStateLine >= 0) markRange(commitDataStateLine, commitDataStateLine, 'commitmentData state');

// 8. Remove delete dialog states
const deleteDialogStateLine = findLine('const [deletePaymentDialogOpen, setDeletePaymentDialogOpen]');
if (deleteDialogStateLine >= 0) {
  let start = deleteDialogStateLine;
  if (lines[start - 1]?.includes('Estados para confirmación')) start--;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, deleteDialogStateLine, 'deletePaymentDialogOpen state');
}
const paymentToDeleteLine = findLine('const [paymentToDelete, setPaymentToDelete]');
if (paymentToDeleteLine >= 0) markRange(paymentToDeleteLine, paymentToDeleteLine, 'paymentToDelete state');
const deletingPaymentLine = findLine('const [deletingPayment, setDeletingPayment]');
if (deletingPaymentLine >= 0) markRange(deletingPaymentLine, deletingPaymentLine, 'deletingPayment state');

// 9. Remove file handling states
const selectedFilesLine = findLine('const [selectedFiles, setSelectedFiles]');
if (selectedFilesLine >= 0) {
  let start = selectedFilesLine;
  if (lines[start - 1]?.includes('Estados para manejo de múltiples')) start--;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, selectedFilesLine, 'selectedFiles state');
}
const dragActiveLine = findLine('const [dragActive, setDragActive]');
if (dragActiveLine >= 0) markRange(dragActiveLine, dragActiveLine, 'dragActive state');
const uploadProgressLine = findLine('const [uploadProgress, setUploadProgress]');
if (uploadProgressLine >= 0) markRange(uploadProgressLine, uploadProgressLine, 'uploadProgress state');
const uploadingLine = findLine('const [uploading, setUploading] = useState(false)');
if (uploadingLine >= 0) markRange(uploadingLine, uploadingLine, 'uploading state');

// 10. Remove loadCommitmentData function
const loadCommitmentDataLine = findLine('const loadCommitmentData = async (commitmentId)');
if (loadCommitmentDataLine >= 0) {
  let start = loadCommitmentDataLine;
  if (lines[start - 1]?.trim() === '') start--;
  if (lines[start - 1]?.includes('Función para cargar datos del compromiso')) start--;
  const end = findFunctionEnd(loadCommitmentDataLine);
  markRange(start, end, 'loadCommitmentData');
}

// 11. Remove getStatusColor (inside component)
const getStatusColorLine = findLine('const getStatusColor = (status)');
if (getStatusColorLine >= 0) {
  const end = findFunctionEnd(getStatusColorLine);
  let start = getStatusColorLine;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'getStatusColor');
}

// 12. Remove getStatusIcon (inside component)
const getStatusIconLine = findLine('const getStatusIcon = (status)');
if (getStatusIconLine >= 0) {
  const end = findFunctionEnd(getStatusIconLine);
  let start = getStatusIconLine;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'getStatusIcon (inline)');
}

// 13. Remove getStatusText (inside component)
const getStatusTextLine = findLine('const getStatusText = (status)');
if (getStatusTextLine >= 0) {
  const end = findFunctionEnd(getStatusTextLine);
  let start = getStatusTextLine;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'getStatusText');
}

// 14. Replace handleEditPayment with simplified version
const handleEditPaymentLine = findLine('const handleEditPayment = async (payment)');
if (handleEditPaymentLine >= 0) {
  const end = findFunctionEnd(handleEditPaymentLine);
  let start = handleEditPaymentLine;
  if (lines[start - 1]?.includes('Función para abrir el modal de edición')) start--;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'handleEditPayment (to simplify)');
  // Insert simplified version at start position
  replacements.set(start, [
    '',
    '  // Open edit dialog — EditPaymentDialog handles all internal logic',
    '  const handleEditPayment = (payment) => {',
    '    setEditingPayment(payment);',
    '    setEditPaymentOpen(true);',
    '  };',
  ].join('\n'));
}

// 15. Remove getBankAccounts through uploadCombinedFiles (big contiguous block)
// These are all edit-exclusive functions from getBankAccounts to uploadCombinedFiles
const editHandlers = [
  'const getBankAccounts = ()',
  'const handleSourceAccountSelect = (',
  'const calculateAccountBalance = (',
  'const formatCurrencyBalance = (',
  'const calculate4x1000Visual = (',
  'const create4x1000Record = async (',
  'const handleCloseEditPayment = ()',
  'const handleSavePayment = async ()',
  'const handleDeletePayment = async ()',
  'const handleOpenDeletePayment = (',
  'const handleCloseDeletePayment = ()',
  'const handleFormChange = (e)',
  'const handleFiles = (newFiles)',
  'const handleDrag = (e)',
  'const handleDrop = (e)',
  'const handleFileSelect = (e)',
  'const removeFile = (fileId)',
  'const uploadCombinedFiles = async ()',
];

for (const handler of editHandlers) {
  const line = findLine(handler);
  if (line >= 0) {
    const end = findFunctionEnd(line);
    // Include comments before the function
    let start = line;
    while (start > 0 && (lines[start - 1]?.trim().startsWith('//') || lines[start - 1]?.trim() === '')) {
      start--;
    }
    start++; // Go back one (the while went one too far)
    if (start < line) {
      markRange(start, end, handler);
    } else {
      markRange(line, end, handler);
    }
  }
}

// 16. Remove formatCurrency (inside component, after handlers)
const formatCurrencyLine = findLine('const formatCurrency = (value)', 1500);
if (formatCurrencyLine >= 0) {
  const end = findFunctionEnd(formatCurrencyLine);
  let start = formatCurrencyLine;
  if (lines[start - 1]?.includes('Función para formatear números')) start--;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'formatCurrency');
}
// Remove "Eliminadas funciones de normalización" comment
const normComment = findLine('Eliminadas funciones de normalización experimental');
if (normComment >= 0 && !skip.has(normComment)) {
  markRange(normComment, normComment, 'normalization comment');
  // And the blank line after
  if (lines[normComment + 1]?.trim() === '') markRange(normComment + 1, normComment + 1, 'blank after norm');
}

// 17. Remove cleanCurrency
const cleanCurrencyLine = findLine('const cleanCurrency = (value)', 1500);
if (cleanCurrencyLine >= 0) {
  const end = findFunctionEnd(cleanCurrencyLine);
  let start = cleanCurrencyLine;
  if (lines[start - 1]?.includes('Función para limpiar formato')) start--;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'cleanCurrency');
}

// 18. Remove isColjuegosCommitment
const isColjuegosLine = findLine('const isColjuegosCommitment = (commitment)', 1500);
if (isColjuegosLine >= 0) {
  const end = findFunctionEnd(isColjuegosLine);
  let start = isColjuegosLine;
  if (lines[start - 1]?.includes('Función para detectar si es un compromiso')) start--;
  if (lines[start - 1]?.trim() === '') start--;
  markRange(start, end, 'isColjuegosCommitment');
}

// 19. Remove imageToPdf section (comment block + function + combineFilesToPdf)
const imageToPdfSectionLine = findLine('// FUNCIONES PARA MANEJAR MÚLTIPLES ARCHIVOS');
if (imageToPdfSectionLine >= 0) {
  // Find combineFilesToPdf end
  const combineFilesLine = findLine('const combineFilesToPdf = async (files)');
  if (combineFilesLine >= 0) {
    const end = findFunctionEnd(combineFilesLine);
    // Start from the section comment (may have === lines before)
    let start = imageToPdfSectionLine;
    while (start > 0 && (lines[start - 1]?.trim().startsWith('// ===') || lines[start - 1]?.trim() === '')) {
      start--;
    }
    start++; // went one too far
    markRange(start, end, 'imageToPdf + combineFilesToPdf section');
  }
}

// 20. Remove 4x1000 useEffect
const useEffect4x1000 = findLine('const tax4x1000Amount = calculate4x1000Visual(');
if (useEffect4x1000 >= 0) {
  // Find the useEffect start (a few lines before)
  let ueStart = useEffect4x1000;
  for (let i = useEffect4x1000; i >= useEffect4x1000 - 5; i--) {
    if (lines[i]?.trim().startsWith('useEffect(')) { ueStart = i; break; }
  }
  // Find the closing line with deps array
  const depsLine = findLine('editFormData.amount, editFormData.method, editFormData.sourceAccount');
  if (depsLine >= 0) {
    let start = ueStart;
    if (lines[start - 1]?.trim() === '') start--;
    markRange(start, depsLine, '4x1000 useEffect');
  }
}

// 21. Replace edit dialog + delete dialog JSX with EditPaymentDialog component
const editDialogStart = findLine('{/* Modal de edición de pago');
if (editDialogStart >= 0) {
  // Find the end: after delete dialog's </Dialog>
  // Look for deletePaymentDialogOpen dialog, then find its </Dialog>
  const deleteDialogLine = findLine('open={deletePaymentDialogOpen}', editDialogStart);
  if (deleteDialogLine >= 0) {
    // Find the </Dialog> after deleteDialogLine
    let lastClose = -1;
    for (let i = deleteDialogLine; i < lines.length; i++) {
      if (lines[i].includes('</Dialog>')) { lastClose = i; break; }
    }
    if (lastClose >= 0) {
      markRange(editDialogStart, lastClose, 'Edit + Delete Dialog JSX');
      replacements.set(editDialogStart, [
        '',
        '      {/* Edit Payment Dialog — Extracted Component */}',
        '      <EditPaymentDialog',
        '        open={editPaymentOpen}',
        '        payment={editingPayment}',
        '        onClose={() => { setEditPaymentOpen(false); setEditingPayment(null); }}',
        '        companies={companies}',
        '        personalAccounts={personalAccounts}',
        '        incomes={incomes}',
        '        payments={payments}',
        '        showNotification={showNotification}',
        '        currentUser={currentUser}',
        '        userProfile={userProfile}',
        '        isAdmin={isAdmin}',
        '        logActivity={logActivity}',
        '      />',
      ].join('\n'));
    }
  }
}

// ============================================================
// PHASE 2: Build output
// ============================================================
const output = [];

// First: add new imports at the top
// Insert paymentsHelpers import after calculateMonthlyAccountBalance import
const calcImportLine = findLine('calculateMonthlyAccountBalance');
// Insert EditPaymentDialog import after PaymentReceiptViewer import
const receiptViewerLine = findLine('PaymentReceiptViewer');
// getStatusIcon outside component: before const PaymentsPage line
const paymentsPageLine = findLine('const PaymentsPage = ()');

const helpersImport = `import {
  createLocalDate,
  formatPaymentDate,
  formatDateForInput,
  getStatusColor,
  getStatusText,
  formatCurrency,
  cleanCurrency,
  isColjuegosCommitment,
  imageToPdf,
  combineFilesToPdf
} from './payments/paymentsHelpers';`;

const editDialogImport = `import EditPaymentDialog from './payments/EditPaymentDialog';`;

const getStatusIconExternal = `
// Helper that returns JSX — cannot be in pure-utility paymentsHelpers.js
const getStatusIcon = (status) => {
  const s = status?.toLowerCase();
  if (s === 'completed' || s === 'completado') return <CheckIcon fontSize="small" />;
  if (s === 'pending' || s === 'pendiente') return <PendingIcon fontSize="small" />;
  if (s === 'failed' || s === 'fallido') return <ErrorIcon fontSize="small" />;
  return <PendingIcon fontSize="small" />;
};
`;

for (let i = 0; i < lines.length; i++) {
  // Check if this is a replacement line
  if (replacements.has(i)) {
    output.push(replacements.get(i));
    // Skip the rest of the removed block
    continue;
  }
  
  // Check if this line should be skipped
  if (skip.has(i)) continue;
  
  // Add the line
  output.push(lines[i]);
  
  // Insert imports after specific lines
  if (i === calcImportLine) {
    output.push(helpersImport);
  }
  if (i === receiptViewerLine) {
    output.push(editDialogImport);
  }
  if (i === paymentsPageLine - 1 && !skip.has(paymentsPageLine - 1)) {
    // Add getStatusIcon before const PaymentsPage
    output.push(getStatusIconExternal);
  }
}

// ============================================================
// PHASE 3: Clean up consecutive blank lines
// ============================================================
let result = output.join('\n');
result = result.replace(/\n{4,}/g, '\n\n');

// Write result
fs.writeFileSync(filePath, result, 'utf8');
const finalLines = result.split('\n').length;
console.log(`\nFinal: ${finalLines} lines (saved ${lines.length - finalLines} lines)`);
console.log(`Lines marked for removal: ${skip.size}`);
console.log(`Replacement blocks: ${replacements.size}`);
