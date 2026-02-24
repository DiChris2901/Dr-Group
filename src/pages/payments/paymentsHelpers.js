import { isValid } from 'date-fns';
import { PDFDocument } from 'pdf-lib';

/**
 * Helper para crear fecha local sin problemas de zona horaria
 */
export const createLocalDate = (dateString) => {
  if (!dateString) return new Date();
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
};

/**
 * Formatear fechas de diferentes fuentes para display
 */
export const formatPaymentDate = (date) => {
  if (!date) return '-';
  try {
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (date && typeof date === 'object' && date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else if (typeof date === 'string') {
      dateObj = date.match(/^\d{4}-\d{2}-\d{2}$/) ? createLocalDate(date) : new Date(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return '-';
    }
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return '-';
  }
};

/**
 * Convertir fecha a formato ISO (YYYY-MM-DD) para inputs
 */
export const formatDateForInput = (date) => {
  const todayStr = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  };

  if (!date) return todayStr();

  try {
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (date && typeof date === 'object' && date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else if (typeof date === 'string') {
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
      dateObj = createLocalDate(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return todayStr();
    }
    if (isNaN(dateObj.getTime())) return todayStr();
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  } catch {
    return todayStr();
  }
};

/**
 * Color del chip de estado
 */
export const getStatusColor = (status) => {
  const s = status?.toLowerCase();
  if (s === 'completed' || s === 'completado') return 'success';
  if (s === 'pending' || s === 'pendiente') return 'warning';
  if (s === 'failed' || s === 'fallido') return 'error';
  return 'default';
};

/**
 * Texto del estado en español
 */
export const getStatusText = (status) => {
  const s = status?.toLowerCase();
  if (s === 'completed') return 'Completado';
  if (s === 'pending') return 'Pendiente';
  if (s === 'failed') return 'Fallido';
  if (s === 'completado' || s === 'pendiente' || s === 'fallido') return status;
  return status || 'Desconocido';
};

/**
 * Formatear número como moneda con separadores de miles (puntos)
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const cleanValue = value.toString().replace(/[^\d]/g, '');
  if (!cleanValue) return '';
  if (cleanValue === '0') return '0';
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Limpiar formato de moneda (remover puntos separadores)
 */
export const cleanCurrency = (value) => {
  return value.toString().replace(/\./g, '');
};

/**
 * Detectar si un compromiso pertenece a Coljuegos
 */
export const isColjuegosCommitment = (commitment) => {
  if (!commitment) return false;
  const provider = commitment.provider || commitment.beneficiary || '';
  return provider.toLowerCase().includes('coljuegos');
};

/**
 * Convertir imagen a una página PDF
 */
export const imageToPdf = async (imageFile) => {
  const pdfDoc = await PDFDocument.create();
  const imageBytes = await imageFile.arrayBuffer();

  let image;
  if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
    image = await pdfDoc.embedJpg(imageBytes);
  } else if (imageFile.type === 'image/png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else {
    throw new Error('Tipo de imagen no soportado: ' + imageFile.type);
  }

  const { width, height } = image.scale(1);
  const page = pdfDoc.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });
  return pdfDoc;
};

/**
 * Combinar múltiples archivos (PDFs + imágenes) en un solo PDF
 */
export const combineFilesToPdf = async (files) => {
  const mainPdfDoc = await PDFDocument.create();

  for (const fileData of files) {
    const file = fileData.file || fileData;
    if (file.type === 'application/pdf') {
      const pdfBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mainPdfDoc.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mainPdfDoc.addPage(page));
    } else if (file.type.startsWith('image/')) {
      const imagePdf = await imageToPdf(file);
      const copiedPages = await mainPdfDoc.copyPages(imagePdf, imagePdf.getPageIndices());
      copiedPages.forEach((page) => mainPdfDoc.addPage(page));
    }
  }

  const pdfBytes = await mainPdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};
