import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const useNotes = () => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setNotes([]);
      setLoading(false);
      return;
    }

    // Query para obtener notas del usuario actual ordenadas por fecha de actualización
    const notesQuery = query(
      collection(db, 'notes'),
      where('userId', '==', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const notesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          notesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
          });
        });

        setNotes(notesData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error loading notes:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // Crear nueva nota
  const addNote = async (noteData) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const newNote = {
        ...noteData,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'notes'), newNote);
      return docRef.id;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  // Actualizar nota existente
  const updateNote = async (noteId, noteData) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const noteRef = doc(db, 'notes', noteId);
      const updatedData = {
        ...noteData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(noteRef, updatedData);
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  // Eliminar nota
  const deleteNote = async (noteId) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const noteRef = doc(db, 'notes', noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  // Obtener nota por ID
  const getNoteById = (noteId) => {
    return notes.find(note => note.id === noteId) || null;
  };

  // Obtener notas recientes (para preview en menu)
  const getRecentNotes = (limit = 5) => {
    return notes.slice(0, limit);
  };

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    getNoteById,
    getRecentNotes,
    notesCount: notes.length
  };
};

export default useNotes;