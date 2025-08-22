// 🗜️ Hook personalizado para compresión PDF
// Facilita la integración en cualquier componente

import { useState } from 'react';
import { drGroupCompressor } from '../utils/pdfCompressor';

export const usePDFCompression = (options = {}) => {
  const {
    enabled = true,
    minSize = 100 * 1024, // 100KB por defecto
    onSuccess,
    onError,
    onProgress
  } = options;

  const [compressionPreviewOpen, setCompressionPreviewOpen] = useState(false);
  const [pendingPDFFile, setPendingPDFFile] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);

  // Verificar si un archivo necesita compresión
  const needsCompression = (file) => {
    return enabled && 
           file.type === 'application/pdf' && 
           file.size > minSize;
  };

  // Procesar archivo (con o sin compresión)
  const processFile = async (file, callback) => {
    if (needsCompression(file)) {
      setPendingPDFFile(file);
      setCompressionPreviewOpen(true);
      // El callback se ejecutará en handleCompressionAccept
      setPendingCallback(callback);
    } else {
      // Procesar archivo directamente
      callback(file, null);
    }
  };

  const [pendingCallback, setPendingCallback] = useState(null);

  // Manejar aceptación de compresión
  const handleCompressionAccept = (compressionResult) => {
    const compressedFile = new File([compressionResult.compressed], pendingPDFFile.name, {
      type: 'application/pdf'
    });
    
    setCompressionStats(compressionResult.stats);
    
    if (pendingCallback) {
      pendingCallback(compressedFile, compressionResult.stats);
    }
    
    if (onSuccess) {
      onSuccess(compressedFile, compressionResult.stats);
    }
    
    resetCompression();
  };

  // Manejar rechazo de compresión
  const handleCompressionReject = () => {
    if (pendingCallback) {
      pendingCallback(pendingPDFFile, null);
    }
    
    resetCompression();
  };

  // Resetear estado de compresión
  const resetCompression = () => {
    setPendingPDFFile(null);
    setCompressionPreviewOpen(false);
    setPendingCallback(null);
    setCompressionStats(null);
  };

  // Props para el componente PDFCompressionPreview
  const compressionPreviewProps = {
    open: compressionPreviewOpen,
    onClose: () => setCompressionPreviewOpen(false),
    file: pendingPDFFile,
    onAccept: handleCompressionAccept,
    onReject: handleCompressionReject
  };

  return {
    // Estados
    compressionPreviewOpen,
    pendingPDFFile,
    compressionStats,
    
    // Funciones
    processFile,
    needsCompression,
    resetCompression,
    
    // Props para componente
    compressionPreviewProps,
    
    // Configuración
    enabled,
    minSize
  };
};

export default usePDFCompression;
