import { useState, useRef, useCallback } from 'react';
import { uploadBytes, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * 🎤 Hook para grabación de audio
 * 
 * Características:
 * - Grabación con MediaRecorder API
 * - Upload automático a Storage (chat-audio/)
 * - Conversión a WAV/WebM
 * - Control de tiempo máximo (5 minutos)
 */
export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const startTimeRef = useRef(0);
  const durationIntervalRef = useRef(null);

  /**
   * Iniciar grabación
   */
  const startRecording = useCallback(async () => {
    try {
      // Solicitar permiso de micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' // Formato compatible
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Evento: Datos disponibles
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Evento: Grabación finalizada
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
        
        // Detener todos los tracks del stream
        stream.getTracks().forEach(track => track.stop());
      };

      // Iniciar grabación
      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Iniciar contador de duración
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        // Límite de 5 minutos (300 segundos)
        if (elapsed >= 300) {
          stopRecording();
        }
      }, 1000);

    } catch (error) {
      console.error('Error iniciando grabación:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Permiso de micrófono denegado. Por favor habilítalo en configuración del navegador.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No se encontró micrófono. Verifica que esté conectado.');
      } else {
        throw new Error('Error al acceder al micrófono: ' + error.message);
      }
    }
  }, []);

  /**
   * Detener grabación
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Limpiar interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  /**
   * Cancelar grabación
   */
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioBlob(null);
      setAudioURL(null);
      setDuration(0);
      audioChunksRef.current = [];
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, []);

  /**
   * Subir audio a Storage
   */
  const uploadAudio = useCallback(async (conversationId) => {
    if (!audioBlob) {
      throw new Error('No hay audio para subir');
    }

    setUploading(true);

    try {
      // Generar nombre único
      const timestamp = Date.now();
      const fileName = `audio_${timestamp}.webm`;
      const path = `chat-audio/${conversationId}/${fileName}`;

      // Subir a Storage
      const audioRef = storageRef(storage, path);
      await uploadBytes(audioRef, audioBlob);

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(audioRef);

      setUploading(false);

      return {
        url: downloadURL,
        duration: duration,
        size: audioBlob.size,
        mimeType: 'audio/webm',
        fileName: fileName
      };

    } catch (error) {
      console.error('Error subiendo audio:', error);
      setUploading(false);
      throw new Error('Error al subir audio: ' + error.message);
    }
  }, [audioBlob, duration]);

  /**
   * Formatear duración (MM:SS)
   */
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Limpiar recursos
   */
  const cleanup = useCallback(() => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioBlob(null);
    setAudioURL(null);
    setDuration(0);
    audioChunksRef.current = [];
  }, [audioURL]);

  return {
    isRecording,
    audioBlob,
    audioURL,
    duration,
    uploading,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAudio,
    formatDuration,
    cleanup
  };
};

export default useAudioRecorder;
