#!/usr/bin/env node
/**
 * 🛡️ DS 3.0 Token Validator - Pre-commit Hook
 * Validador automático para prevenir errores de tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Función simple para buscar archivos recursivamente
function findFiles(dir, pattern) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
      files.push(...findFiles(fullPath, pattern));
    } else if (entry.isFile() && pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

class TokenValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validatedFiles = 0;
    
    // Patrones prohibidos
    this.forbiddenPatterns = [
      {
        pattern: /designTokens\./g,
        message: '❌ USO PROHIBIDO: "designTokens" - Usar "unifiedTokens" o hooks seguros',
        severity: 'error'
      },
      {
        pattern: /import.*designTokens/g,
        message: '❌ IMPORT PROHIBIDO: "designTokens" - Usar imports del sistema DS 3.0',
        severity: 'error'
      },
      {
        pattern: /fontWeights\.semiBold/g,
        message: '❌ TOKEN NO VÁLIDO: "fontWeights.semiBold" no existe',
        severity: 'error'
      },
      {
        pattern: /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g,
        message: '⚠️ HARDCODED COLOR: Usar tokens en lugar de colores hardcodeados',
        severity: 'warning'
      },
      {
        pattern: /padding:\s*['"`]\d+px\s+\d+px['"`]/g,
        message: '⚠️ HARDCODED SPACING: Usar tokens de spacing',
        severity: 'warning'
      }
    ];

    // Hooks seguros requeridos
    this.safeHooks = [
      'useTokens',
      'useTableTokens'
    ];

    // Tokens validados que existen
    this.validTokens = [
      // Typography
      'typography.weights.light',
      'typography.weights.regular',
      'typography.weights.medium',
      'typography.weights.semiBold',
      'typography.weights.bold',
      'typography.weights.extraBold',
      'typography.weights.black',
      'typography.sizes.xs',
      'typography.sizes.sm',
      'typography.sizes.md',
      'typography.sizes.lg',
      'typography.sizes.xl',
      'typography.sizes.2xl',
      
      // Spacing
      'spacing.none',
      'spacing.xs',
      'spacing.sm',
      'spacing.md',
      'spacing.lg',
      'spacing.xl',
      'spacing.2xl',
      
      // Radius
      'radius.none',
      'radius.small',
      'radius.medium',
      'radius.large',
      'radius.full',
      
      // Colors (usar con hooks)
      'colors.surface.primary',
      'colors.surface.secondary',
      'colors.text.primary',
      'colors.text.secondary'
    ];
  }

  /**
   * Escanea archivos JSX/JS en busca de violaciones
   */
  async scanFiles() {
    const srcPath = path.join(process.cwd(), 'src');
    const files = findFiles(srcPath, /\.(js|jsx)$/);

    console.log(`${colors.blue}🔍 Escaneando ${files.length} archivos...${colors.reset}\n`);

    for (const file of files) {
      this.validateFile(file);
      this.validatedFiles++;
    }

    this.printResults();
    return this.errors.length === 0;
  }

  /**
   * Valida un archivo individual
   */
  validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    // Verificar patrones prohibidos
    this.forbiddenPatterns.forEach(({ pattern, message, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        const issue = {
          file: relativePath,
          message,
          matches: matches.length,
          pattern: pattern.source
        };

        if (severity === 'error') {
          this.errors.push(issue);
        } else {
          this.warnings.push(issue);
        }
      }
    });

    // Verificar uso de hooks seguros en componentes con tokens
    if (content.includes('unifiedTokens') || content.includes('tokens.')) {
      const hasUseTokens = this.safeHooks.some(hook => content.includes(hook));
      if (!hasUseTokens) {
        this.warnings.push({
          file: relativePath,
          message: '⚠️ RECOMENDACIÓN: Usar hooks seguros (useTokens, useTableTokens) para tokens',
          matches: 1
        });
      }
    }
  }

  /**
   * Imprime resultados de la validación
   */
  printResults() {
    console.log(`${colors.bold}${colors.cyan}📊 RESULTADOS DE VALIDACIÓN DS 3.0${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    console.log(`📁 Archivos escaneados: ${this.validatedFiles}`);
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(`${colors.green}${colors.bold}✅ ¡PERFECTO! Todos los tokens son válidos${colors.reset}\n`);
      return;
    }

    // Mostrar errores
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}${colors.bold}❌ ERRORES CRÍTICOS (${this.errors.length}):${colors.reset}`);
      this.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${colors.red}${error.file}${colors.reset}`);
        console.log(`   ${error.message}`);
        if (error.matches > 1) {
          console.log(`   ${colors.yellow}(${error.matches} ocurrencias)${colors.reset}`);
        }
      });
    }

    // Mostrar warnings
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}${colors.bold}⚠️ ADVERTENCIAS (${this.warnings.length}):${colors.reset}`);
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${colors.yellow}${warning.file}${colors.reset}`);
        console.log(`   ${warning.message}`);
      });
    }

    // Resumen final
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    if (this.errors.length > 0) {
      console.log(`${colors.red}${colors.bold}🚨 COMMIT BLOQUEADO: Resolver errores críticos antes de continuar${colors.reset}`);
      console.log(`${colors.cyan}💡 Revisar: REGLAS_TOKENS_DS_3.0_ESTRICTAS.md${colors.reset}\n`);
    } else {
      console.log(`${colors.green}${colors.bold}✅ Validación pasada - Proceder con commit${colors.reset}\n`);
    }
  }

  /**
   * Genera reporte detallado
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      filesScanned: this.validatedFiles,
      errors: this.errors,
      warnings: this.warnings,
      status: this.errors.length === 0 ? 'PASS' : 'FAIL'
    };

    const reportPath = 'token-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Reporte guardado: ${reportPath}`);
  }
}

// Ejecutar validador
async function main() {
  console.log(`${colors.cyan}${colors.bold}`);
  console.log('🛡️ DS 3.0 TOKEN VALIDATOR');
  console.log('Prevención automática de errores de tokens');
  console.log(`${colors.reset}\n`);

  const validator = new TokenValidator();
  const isValid = await validator.scanFiles();
  
  validator.generateReport();
  
  // Exit code para pre-commit hook
  process.exit(isValid ? 0 : 1);
}

// Ejecutar si es llamado directamente
const isMainModule = process.argv[1] && fs.existsSync(process.argv[1]) && 
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule || process.argv[1]?.includes('tokenValidator.js')) {
  main().catch(console.error);
}

export default TokenValidator;
