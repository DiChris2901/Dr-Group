/**
 * Refactoring script: EmpleadosPage modals
 * - Removes constant definitions (moved to EmpleadoForm.jsx)
 * - Replaces Add modal form content with EmpleadoForm component
 * - Replaces Edit modal form content with EmpleadoForm component
 * - Adds handleDeleteEmpleadoFile handler
 * - Fixes modal PaperProps shadows
 * - Fixes DialogActions borderRadius
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'EmpleadosPage.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Read ${lines.length} lines from EmpleadosPage.jsx`);

// Verify key line markers to ensure we're working with the right version
const markers = {
  constants: { line: 82, expected: 'const BANCOS_COLOMBIA' },
  component: { line: 147, expected: 'const EmpleadosPage' },
  handleOpenAdd: { line: 800, expected: 'const handleOpenAddDialog' },
  addDialogContent: { line: 1234, expected: '<DialogContent' },
  addFormStart: { line: 1235, expected: '<Box sx={{ mt: 2 }}>' },
  addFormEnd: { line: 1899, expected: '</Box>' },
  addDialogContentClose: { line: 1900, expected: '</DialogContent>' },
  editModal: { line: 1937, expected: '{/* Modal Editar Empleado' },
  editDialogContent: { line: 1985, expected: '<DialogContent' },
  editFormStart: { line: 1986, expected: '<Box sx={{ mt: 2 }}>' },
  editFormEnd: { line: 2843, expected: '</Box>' },
  editDialogContentClose: { line: 2844, expected: '</DialogContent>' },
  viewModal: { line: 2881, expected: '{/* Modal Ver Empleado' },
};

let allMarkersOk = true;
for (const [name, { line, expected }] of Object.entries(markers)) {
  const actual = lines[line - 1]?.trim();
  if (!actual?.includes(expected.trim())) {
    console.error(`MARKER MISMATCH at ${name} (line ${line}): expected "${expected}", got "${actual}"`);
    allMarkersOk = false;
  }
}

if (!allMarkersOk) {
  console.error('Aborting: line markers do not match. File may have been modified.');
  process.exit(1);
}

console.log('All markers verified ✓');

// Build new file
const result = [];

// ═══════════ SECTION 1: Imports (lines 1-80) ═══════════
// Keep original imports
for (let i = 0; i < 80; i++) {
  result.push(lines[i]);
}

// Add EmpleadoForm import after the last import
result.push("import EmpleadoForm, { NIVELES_RIESGO_ARL } from '../components/rrhh/EmpleadoForm';");

// ═══════════ SECTION 2: Skip constants (lines 81-146) ═══════════
// Lines 81-146 (0-indexed: 80-145) are constant definitions
// They're now exported from EmpleadoForm.jsx
// Skip them entirely

// ═══════════ SECTION 3: Component logic (lines 147-799) ═══════════
// Add handleDeleteEmpleadoFile before handleOpenAddDialog
for (let i = 146; i <= 797; i++) { // Up to line 798 (the blank line before handleOpenAddDialog)
  result.push(lines[i]);
}

// Insert handleDeleteEmpleadoFile function
result.push('');
result.push('  // Eliminar archivo de un empleado (usado por EmpleadoForm en modo edit)');
result.push('  const handleDeleteEmpleadoFile = async (fieldName, fileUrl) => {');
result.push('    try {');
result.push('      await deleteFileFromStorage(fileUrl);');
result.push('      await updateDoc(doc(db, \'empleados\', selectedEmpleado.id), {');
result.push('        [fieldName]: \'\'');
result.push('      });');
result.push('      setSelectedEmpleado(prev => ({');
result.push('        ...prev,');
result.push('        [fieldName]: \'\'');
result.push('      }));');
result.push('      addNotification(\'Archivo eliminado correctamente\', \'success\');');
result.push('    } catch (error) {');
result.push('      console.error(\'Error al eliminar archivo:\', error);');
result.push('      addNotification(\'Error al eliminar el archivo\', \'error\');');
result.push('    }');
result.push('  };');
result.push('');

// Continue with handleOpenAddDialog through to the Add modal DialogContent tag
// Lines 799-1234 (0-indexed: 798-1233)
for (let i = 798; i <= 1233; i++) {
  // Fix Add modal PaperProps shadow (line 1193 area)
  let line = lines[i];
  // Fix shadow: 0 12px 48px → 0 4px 24px
  if (line.includes('0 12px 48px') && i >= 1185 && i <= 1200) {
    line = line.replace('0 12px 48px', '0 4px 24px');
  }
  result.push(line);
}

// ═══════════ SECTION 4: Add modal form → EmpleadoForm ═══════════
// Replace lines 1235-1899 (0-indexed: 1234-1898) with EmpleadoForm
result.push('          <Box sx={{ mt: 2 }}>');
result.push('            <EmpleadoForm');
result.push('              mode="add"');
result.push('              formData={formData}');
result.push('              handleFormChange={handleFormChange}');
result.push('              empresas={empresas}');
result.push('              calcularFechaFinContrato={calcularFechaFinContrato}');
result.push('              documentoIdentidadFile={documentoIdentidadFile}');
result.push('              setDocumentoIdentidadFile={setDocumentoIdentidadFile}');
result.push('              contratoFile={contratoFile}');
result.push('              setContratoFile={setContratoFile}');
result.push('              certificadoFile={certificadoFile}');
result.push('              setCertificadoFile={setCertificadoFile}');
result.push('              dragOverDocumento={dragOverDocumento}');
result.push('              dragOverContrato={dragOverContrato}');
result.push('              dragOverCertificado={dragOverCertificado}');
result.push('              handleDragOver={handleDragOver}');
result.push('              handleDragLeave={handleDragLeave}');
result.push('              handleDrop={handleDrop}');
result.push('              uploadingDocumentoIdentidad={uploadingDocumentoIdentidad}');
result.push('              uploadingContrato={uploadingContrato}');
result.push('              uploadingCertificado={uploadingCertificado}');
result.push('            />');
result.push('          </Box>');

// ═══════════ SECTION 5: Add modal closing + Edit modal wrapper (lines 1900-1985) ═══════════
for (let i = 1899; i <= 1984; i++) {
  let line = lines[i];
  // Fix Edit modal PaperProps shadow (around line 1946)
  if (line.includes('0 12px 48px') && i >= 1935 && i <= 1950) {
    line = line.replace('0 12px 48px', '0 4px 24px');
  }
  // Fix DialogActions borderRadius
  if (line.includes('borderRadius: 2') && i >= 1899 && i <= 1935) {
    line = line.replace('borderRadius: 2', 'borderRadius: 1');
  }
  result.push(line);
}

// ═══════════ SECTION 6: Edit modal form → EmpleadoForm ═══════════
// Replace lines 1986-2843 (0-indexed: 1985-2842) with EmpleadoForm
result.push('          <Box sx={{ mt: 2 }}>');
result.push('            <EmpleadoForm');
result.push('              mode="edit"');
result.push('              formData={formData}');
result.push('              handleFormChange={handleFormChange}');
result.push('              empresas={empresas}');
result.push('              calcularFechaFinContrato={calcularFechaFinContrato}');
result.push('              documentoIdentidadFile={documentoIdentidadFile}');
result.push('              setDocumentoIdentidadFile={setDocumentoIdentidadFile}');
result.push('              contratoFile={contratoFile}');
result.push('              setContratoFile={setContratoFile}');
result.push('              certificadoFile={certificadoFile}');
result.push('              setCertificadoFile={setCertificadoFile}');
result.push('              dragOverDocumento={dragOverDocumento}');
result.push('              dragOverContrato={dragOverContrato}');
result.push('              dragOverCertificado={dragOverCertificado}');
result.push('              handleDragOver={handleDragOver}');
result.push('              handleDragLeave={handleDragLeave}');
result.push('              handleDrop={handleDrop}');
result.push('              uploadingDocumentoIdentidad={uploadingDocumentoIdentidad}');
result.push('              uploadingContrato={uploadingContrato}');
result.push('              uploadingCertificado={uploadingCertificado}');
result.push('              selectedEmpleado={selectedEmpleado}');
result.push('              onViewFile={handleOpenPdfViewer}');
result.push('              onDeleteFile={handleDeleteEmpleadoFile}');
result.push('            />');
result.push('          </Box>');

// ═══════════ SECTION 7: Edit modal closing + remaining modals (lines 2844+) ═══════════
for (let i = 2843; i < lines.length; i++) {
  let line = lines[i];
  // Fix Edit modal DialogActions borderRadius
  if (line.includes('borderRadius: 2') && i >= 2843 && i <= 2880) {
    line = line.replace('borderRadius: 2', 'borderRadius: 1');
  }
  result.push(line);
}

// Write the modified file
const newContent = result.join('\n');
fs.writeFileSync(filePath, newContent);

const originalLines = lines.length;
const newLines = result.length;
console.log(`\nRefactoring complete!`);
console.log(`Original: ${originalLines} lines`);
console.log(`New: ${newLines} lines`);
console.log(`Removed: ${originalLines - newLines} lines`);
console.log(`\nChanges made:`);
console.log(`  ✓ Removed constant definitions (imported from EmpleadoForm)`);
console.log(`  ✓ Added handleDeleteEmpleadoFile function`);
console.log(`  ✓ Replaced Add modal form with EmpleadoForm (mode="add")`);
console.log(`  ✓ Replaced Edit modal form with EmpleadoForm (mode="edit")`);
console.log(`  ✓ Fixed modal PaperProps shadows (0 12px 48px → 0 4px 24px)`);
console.log(`  ✓ Fixed DialogActions borderRadius (2 → 1)`);
