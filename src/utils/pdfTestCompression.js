// 🧪 TEST DIRECTO DE PDF-LIB
// Para probar si la compresión realmente funciona

import { PDFDocument } from 'pdf-lib';

export const testPDFCompression = async (file) => {
  console.log('🧪 INICIANDO TEST DIRECTO DE COMPRESIÓN');
  
  try {
    const originalSize = file.size;
    console.log('📄 Archivo original:', originalSize, 'bytes');
    
    // Cargar PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    console.log('📄 Páginas:', pdfDoc.getPageCount());
    
    // Test 1: Guardar sin opciones especiales
    console.log('🔧 Test 1: Guardado básico');
    const basic = await pdfDoc.save();
    console.log('📊 Básico:', basic.length, 'bytes', `(${((originalSize - basic.length) / originalSize * 100).toFixed(2)}% reducción)`);
    
    // Test 2: Guardar con object streams
    console.log('🔧 Test 2: Con object streams');
    const withStreams = await pdfDoc.save({ useObjectStreams: true });
    console.log('📊 Con streams:', withStreams.length, 'bytes', `(${((originalSize - withStreams.length) / originalSize * 100).toFixed(2)}% reducción)`);
    
    // Test 3: Limpiar metadatos y guardar
    console.log('🔧 Test 3: Limpiando metadatos');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    pdfDoc.setProducer('Test');
    pdfDoc.setCreator('Test');
    
    try {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
    } catch (e) {
      console.log('📝 No se pudieron limpiar todos los metadatos');
    }
    
    const cleaned = await pdfDoc.save({ 
      useObjectStreams: true,
      addDefaultPage: false,
      updateFieldAppearances: true
    });
    console.log('📊 Limpio:', cleaned.length, 'bytes', `(${((originalSize - cleaned.length) / originalSize * 100).toFixed(2)}% reducción)`);
    
    return {
      original: originalSize,
      basic: basic.length,
      withStreams: withStreams.length,
      cleaned: cleaned.length
    };
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    throw error;
  }
};
