import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set, remove } from 'firebase/database';
import { storage, database } from '../config/firebase';

/**
 * Sube un archivo adjunto del chat a Firebase Storage con progreso en tiempo real
 * @param {File} file - Archivo a subir
 * @param {string} userId - ID del usuario que sube el archivo
 * @param {Function} onProgress - Callback para actualizar progreso (opcional)
 * @returns {Promise<Object>} - Objeto con metadatos del archivo subido
 */
export const uploadChatAttachment = async (file, userId = null, onProgress = null) => {
  try {
    // Validar archivo
    if (!file) {
      throw new Error('Archivo no válido');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`El archivo ${file.name} excede el tamaño máximo de 10MB`);
    }

    // Crear referencia única en Storage
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `chat_attachments/${timestamp}_${sanitizedName}`;
    const fileStorageRef = storageRef(storage, storagePath);

    // Generar ID único para el upload
    const uploadId = `${userId || 'anonymous'}_${timestamp}`;
    
    // Referencia RTDB para progreso (si tenemos userId y database)
    const progressRef = userId && database 
      ? dbRef(database, `/uploads/${userId}/${uploadId}`)
      : null;

    console.log(`📤 Subiendo archivo: ${file.name}`);

    // 🔥 Usar uploadBytesResumable para tracking de progreso
    const uploadTask = uploadBytesResumable(fileStorageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        size: file.size.toString(),
        uploaderId: userId || 'anonymous'
      }
    });

    // Promise para manejar el upload con progreso
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        // 📊 Progreso en tiempo real
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          
          console.log(`📈 Progreso: ${progress}% (${file.name})`);

          // Actualizar RTDB para sincronización entre pestañas
          if (progressRef) {
            set(progressRef, {
              fileName: file.name,
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state,
              timestamp: Date.now()
            }).catch(err => console.warn('⚠️ Error actualizando progreso RTDB:', err));
          }

          // Callback personalizado para UI
          if (onProgress) {
            onProgress(progress, snapshot.bytesTransferred, snapshot.totalBytes);
          }
        },
        // ❌ Error
        (error) => {
          console.error('❌ Error subiendo archivo:', error);
          
          // Limpiar progreso de RTDB
          if (progressRef) {
            remove(progressRef).catch(console.warn);
          }
          
          reject(error);
        },
        // ✅ Completado
        async () => {
          try {
            // Obtener URL de descarga
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            console.log(`✅ Archivo subido: ${file.name}`);

            // Limpiar progreso de RTDB
            if (progressRef) {
              remove(progressRef).catch(console.warn);
            }

            // Retornar metadatos del archivo
            resolve({
              name: file.name,
              url: downloadURL,
              type: file.type,
              size: file.size,
              storagePath: storagePath,
              uploadedAt: new Date().toISOString()
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('❌ Error iniciando upload:', error);
    throw error;
  }
};

/**
 * Comprime una imagen antes de subirla (opcional para optimización)
 * @param {File} file - Imagen a comprimir
 * @param {number} maxWidth - Ancho máximo
 * @param {number} quality - Calidad (0-1)
 * @returns {Promise<Blob>} - Imagen comprimida
 */
export const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar si excede maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al comprimir imagen'));
            }
          },
          file.type || 'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Error cargando imagen'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Genera un thumbnail para imágenes
 * @param {File} file - Imagen original
 * @returns {Promise<string>} - Data URL del thumbnail
 */
export const generateThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 150;
        
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };

    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

/**
 * Formatea el tamaño de archivo a formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Valida el tipo de archivo permitido
 * @param {File} file - Archivo a validar
 * @returns {boolean} - true si es válido
 */
export const isValidFileType = (file) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed'
  ];

  return allowedTypes.includes(file.type);
};
