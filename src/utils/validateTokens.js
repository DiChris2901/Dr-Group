// ========================================
// 🔍 VALIDADOR DE TOKENS DS 3.0
// ========================================
// Script para validar que los tokens usados existan realmente

import { unifiedTokens, enhancedTokenUtils } from '../theme/tokens/index.js';

// 🧪 Tokens que estoy usando en CommitmentsList
const tokensUsedInCode = [
  'typography.weights.semiBold',
  'typography.weights.medium', 
  'typography.weights.bold',
  'typography.sizes.xs',
  'typography.sizes.md',
  'colors.text.primary',
  'colors.text.secondary',
  'colors.surface.secondary',
  'colors.surface.tertiary',
  'spacing.xs'
];

console.log('🔍 VALIDANDO TOKENS USADOS EN COMMITMENTSLIST...\n');

const results = {
  valid: [],
  invalid: [],
  missing: []
};

tokensUsedInCode.forEach(tokenPath => {
  const exists = enhancedTokenUtils.tokenExists(tokenPath);
  const value = enhancedTokenUtils.getToken(tokenPath);
  
  if (exists && value !== null) {
    results.valid.push({ path: tokenPath, value });
    console.log(`✅ ${tokenPath} = ${JSON.stringify(value)}`);
  } else {
    results.invalid.push(tokenPath);
    console.error(`❌ ${tokenPath} = UNDEFINED`);
  }
});

console.log(`\n📊 RESUMEN:`);
console.log(`✅ Válidos: ${results.valid.length}`);
console.log(`❌ Inválidos: ${results.invalid.length}`);

if (results.invalid.length > 0) {
  console.log(`\n🚨 TOKENS FALTANTES QUE NECESITAN IMPLEMENTARSE:`);
  results.invalid.forEach(path => {
    console.log(`- unifiedTokens.${path}`);
  });
}

export { results };
