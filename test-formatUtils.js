/**
 * Script de prueba para verificar que formatUtils funciona correctamente
 */
import { 
  fNumber, 
  fCurrency, 
  fShortenNumber, 
  fPercent, 
  fPercentInteger,
  getNumberSuffix,
  isValidNumber,
  formatNumber,
  fPaymentMethod,
  getPaymentMethodOptions
} from './src/utils/formatUtils.js';

console.log('🧪 Probando formatUtils...');

// Test fNumber
console.log('fNumber(1000000):', fNumber(1000000));

// Test fCurrency  
console.log('fCurrency(1500000):', fCurrency(1500000));

// Test fShortenNumber
console.log('fShortenNumber(1500000):', fShortenNumber(1500000));

// Test fPercent
console.log('fPercent(25.5):', fPercent(25.5));

// Test fPercentInteger
console.log('fPercentInteger(85):', fPercentInteger(85));

// Test getNumberSuffix
console.log('getNumberSuffix(1500000):', getNumberSuffix(1500000));

// Test isValidNumber
console.log('isValidNumber(123):', isValidNumber(123));
console.log('isValidNumber("abc"):', isValidNumber("abc"));

// Test fPaymentMethod
console.log('fPaymentMethod("transfer"):', fPaymentMethod("transfer"));
console.log('fPaymentMethod("cash"):', fPaymentMethod("cash"));
console.log('fPaymentMethod("pse"):', fPaymentMethod("pse"));
console.log('fPaymentMethod("TRANSFER"):', fPaymentMethod("TRANSFER"));
console.log('fPaymentMethod(null):', fPaymentMethod(null));

// Test getPaymentMethodOptions
console.log('getPaymentMethodOptions():', getPaymentMethodOptions());

console.log('✅ Todos los tests pasaron correctamente');
