// 📄 Sistema de Combinación PDF - DR Group
// Combina múltiples archivos (PDF, JPG, PNG) en un solo PDF

import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Combinador PDF Empresarial
 * Toma múltiples archivos y los combina en un solo PDF
 */
export class EnterprisePDFCombiner {
  constructor(options = {}) {
    this.settings = {
      // 📐 CONFIGURACIÓN DE PÁGINA
      pageMargin: options.pageMargin || 50,
      imageQuality: options.imageQuality || 0.85,
      maxImageWidth: options.maxImageWidth || 500,
      maxImageHeight: options.maxImageHeight || 700,
      
      // 📋 METADATOS
      title: options.title || 'Documento Combinado - DR Group',
      author: options.author || 'DR Group Dashboard',
      creator: options.creator || 'DR Group System',
      
      // 🎯 CONFIGURACIÓN DE COMBINACIÓN
      addPageNumbers: options.addPageNumbers !== false,
      addSeparators: options.addSeparators !== false,
      preserveQuality: options.preserveQuality !== false
    };
  }

  /**
   * Combina múltiples archivos en un solo PDF
   * @param {Array<File>} files - Array de archivos (PDF, JPG, PNG)
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<{combinedPDF: Blob, stats: Object}>}
   */
  async combineFiles(files, metadata = {}) {
    try {
      console.log('🔄 Iniciando combinación de archivos...', files.length);
      const startTime = performance.now();

      // Crear nuevo documento PDF
      const combinedDoc = await PDFDocument.create();
      
      // Establecer metadatos
      combinedDoc.setTitle(metadata.commitmentTitle || this.settings.title);
      combinedDoc.setAuthor(this.settings.author);
      combinedDoc.setCreator(this.settings.creator);
      combinedDoc.setCreationDate(new Date());
      combinedDoc.setModificationDate(new Date());

      let totalPages = 0;
      let processedFiles = 0;

      // Procesar cada archivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📄 Procesando archivo ${i + 1}/${files.length}: ${file.name}`);

        try {
          if (file.type === 'application/pdf') {
            // Procesar PDF existente
            const pages = await this.addPDFToDocument(combinedDoc, file, totalPages);
            totalPages += pages;
          } else if (file.type.startsWith('image/')) {
            // Procesar imagen (JPG, PNG, WebP)
            const pages = await this.addImageToDocument(combinedDoc, file, totalPages, file.name);
            totalPages += pages;
          }
          processedFiles++;
        } catch (error) {
          console.error(`❌ Error procesando ${file.name}:`, error);
          // Continuar con el siguiente archivo
        }
      }

      // Generar PDF combinado
      const pdfBytes = await combinedDoc.save();
      const combinedBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);

      const stats = {
        originalFiles: files.length,
        processedFiles: processedFiles,
        totalPages: totalPages,
        finalSize: combinedBlob.size,
        processingTime: processingTime,
        sizeFormatted: this.formatFileSize(combinedBlob.size),
        compressionRatio: this.calculateCompressionRatio(files, combinedBlob)
      };

      console.log('✅ Combinación completada:', stats);

      return {
        combinedPDF: combinedBlob,
        stats: stats
      };

    } catch (error) {
      console.error('❌ Error en combinación:', error);
      throw new Error(`Error combinando archivos: ${error.message}`);
    }
  }

  /**
   * Agrega páginas de un PDF existente al documento combinado
   */
  async addPDFToDocument(combinedDoc, pdfFile, currentPageCount) {
    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(pdfBytes);
      
      // Copiar todas las páginas
      const pageIndices = sourcePdf.getPageIndices();
      const copiedPages = await combinedDoc.copyPages(sourcePdf, pageIndices);
      
      // Agregar cada página
      copiedPages.forEach((page, index) => {
        combinedDoc.addPage(page);
        
        if (this.settings.addPageNumbers) {
          this.addPageNumber(page, currentPageCount + index + 1);
        }
      });

      console.log(`📄 PDF agregado: ${copiedPages.length} páginas`);
      return copiedPages.length;

    } catch (error) {
      console.error('Error agregando PDF:', error);
      throw error;
    }
  }

  /**
   * Agrega una imagen como nueva página en el documento
   */
  async addImageToDocument(combinedDoc, imageFile, currentPageCount, fileName) {
    try {
      const imageBytes = await imageFile.arrayBuffer();
      let image;

      // Determinar tipo de imagen y embedear
      if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
        image = await combinedDoc.embedJpg(imageBytes);
      } else if (imageFile.type === 'image/png') {
        image = await combinedDoc.embedPng(imageBytes);
      } else {
        throw new Error(`Tipo de imagen no soportado: ${imageFile.type}`);
      }

      // Crear nueva página
      const page = combinedDoc.addPage();
      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      // Calcular dimensiones manteniendo aspect ratio
      const imageAspectRatio = image.width / image.height;
      const availableWidth = pageWidth - (2 * this.settings.pageMargin);
      const availableHeight = pageHeight - (3 * this.settings.pageMargin); // Espacio extra para título

      let finalWidth = Math.min(availableWidth, this.settings.maxImageWidth);
      let finalHeight = finalWidth / imageAspectRatio;

      if (finalHeight > availableHeight) {
        finalHeight = availableHeight;
        finalWidth = finalHeight * imageAspectRatio;
      }

      // Centrar imagen en la página
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;

      // Dibujar imagen
      page.drawImage(image, {
        x: x,
        y: y,
        width: finalWidth,
        height: finalHeight,
      });

      // Agregar título de archivo (opcional)
      if (fileName) {
        page.drawText(fileName, {
          x: this.settings.pageMargin,
          y: pageHeight - this.settings.pageMargin,
          size: 10,
          color: rgb(0.3, 0.3, 0.3),
        });
      }

      // Agregar número de página
      if (this.settings.addPageNumbers) {
        this.addPageNumber(page, currentPageCount + 1);
      }

      console.log(`🖼️ Imagen agregada: ${fileName}`);
      return 1; // Una página agregada

    } catch (error) {
      console.error('Error agregando imagen:', error);
      throw error;
    }
  }

  /**
   * Agrega número de página
   */
  addPageNumber(page, pageNumber) {
    const { width, height } = page.getSize();
    
    page.drawText(`Página ${pageNumber}`, {
      x: width - 80,
      y: 20,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  /**
   * Calcula la ratio de compresión
   */
  calculateCompressionRatio(originalFiles, combinedBlob) {
    const totalOriginalSize = originalFiles.reduce((sum, file) => sum + file.size, 0);
    const ratio = ((totalOriginalSize - combinedBlob.size) / totalOriginalSize * 100);
    return Math.max(0, Math.round(ratio));
  }

  /**
   * Formatea tamaño de archivo
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Función helper para uso directo
export const combineFilesToPDF = async (files, metadata = {}) => {
  const combiner = new EnterprisePDFCombiner();
  return await combiner.combineFiles(files, metadata);
};
