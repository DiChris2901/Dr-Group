// Test script para validar tokens
const { unifiedTokens } = require('./src/theme/tokens/index.js');

console.log('🔍 Validando tokens utilizados...\n');

// Tokens que usé en las correcciones
const tokensUsed = [
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

tokensUsed.forEach(tokenPath => {
  const parts = tokenPath.split('.');
  let value = unifiedTokens;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      console.log(`❌ ${tokenPath} - NO EXISTE`);
      return;
    }
  }
  
  console.log(`✅ ${tokenPath} = ${value}`);
});
