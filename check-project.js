/**
 * Script de verificación del proyecto DR Group Dashboard
 * Verifica la integridad de los archivos principales
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();

const CRITICAL_FILES = [
  'src/main.jsx',
  'src/App.jsx', 
  'src/utils/formatUtils.js',
  'src/components/common/CleanCountUp.jsx',
  'package.json',
  'vite.config.js'
];

console.log('🔍 Verificando proyecto DR Group Dashboard...\n');

let hasErrors = false;

// Verificar archivos críticos
CRITICAL_FILES.forEach(file => {
  const fullPath = path.join(PROJECT_ROOT, file);
  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      console.log(`✅ ${file} - OK (${content.length} caracteres)`);
      
      // Verificaciones específicas
      if (file.includes('formatUtils.js')) {
        // Verificar duplicaciones de exports
        const exportMatches = content.match(/export function parseColombianNumber/g) || [];
        const exportListMatches = content.match(/parseColombianNumber(?=\s*[,}])/g) || [];
        
        if (exportMatches.length > 1) {
          console.log(`❌ ${file} - Función parseColombianNumber duplicada (${exportMatches.length} veces)`);
          hasErrors = true;
        }
        
        if (exportListMatches.length > 1) {
          console.log(`❌ ${file} - Export parseColombianNumber en lista duplicado (${exportListMatches.length} veces)`);
          hasErrors = true;
        }
      }
    } else {
      console.log(`❌ ${file} - NO ENCONTRADO`);
      hasErrors = true;
    }
  } catch (error) {
    console.log(`❌ ${file} - ERROR: ${error.message}`);
    hasErrors = true;
  }
});

console.log('\n📊 Resumen:');
if (hasErrors) {
  console.log('❌ Se encontraron errores en el proyecto');
  process.exit(1);
} else {
  console.log('✅ Proyecto verificado correctamente');
  process.exit(0);
}
