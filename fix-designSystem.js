import { readFileSync, writeFileSync } from 'fs';

const filePath = 'c:/Users/DiegoR/Desktop/Github/src/components/dashboard/WelcomeDashboardSimple.jsx';

console.log('🔧 Corrigiendo referencias de designSystem...');

let content = readFileSync(filePath, 'utf8');

// Reemplazos específicos
const replacements = [
  ['designSystem.borderRadius', 'cleanDesignSystem.borderRadius'],
  ['designSystem.shadows.glassmorphism', 'cleanDesignSystem.shadows.glassmorphism'],
  ['designSystem.shadows.elevated', 'cleanDesignSystem.shadows.elevated'],
  ['designSystem.shadows.medium', 'cleanDesignSystem.shadows.medium'],
  ['designSystem.shadows.soft', 'cleanDesignSystem.shadows.soft'],
  ['designSystem.gradients.primary', 'cleanDesignSystem.gradients.primary'],
  ['designSystem.gradients.shimmer', 'cleanDesignSystem.gradients.shimmer'],
  ['designSystem.animations.bounce', 'cleanDesignSystem.animations.bounce'],
  ['designSystem.animations.spring', 'cleanDesignSystem.animations.spring'],
  ['designSystem.animations.smooth', 'cleanDesignSystem.animations.smooth']
];

let changeCount = 0;

replacements.forEach(([oldStr, newStr]) => {
  const regex = new RegExp(oldStr.replace('.', '\\.'), 'g');
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, newStr);
    changeCount += matches.length;
    console.log(`✅ Reemplazado ${matches.length} ocurrencias de ${oldStr}`);
  }
});

writeFileSync(filePath, content, 'utf8');

console.log(`🎉 Completado: ${changeCount} cambios realizados`);
console.log('✅ Archivo corregido exitosamente');
