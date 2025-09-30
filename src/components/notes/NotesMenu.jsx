import React, { useState } from 'react';
import {
  Menu,
  MenuList,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  alpha,
  useTheme,
  Button,
  Tooltip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
  Avatar
} from '@mui/material';
import {
  StickyNote2 as NotesIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Notes as AllNotesIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotes } from '../../hooks/useNotes';
import { useAuth } from '../../context/AuthContext';

const NotesMenu = ({ anchorEl, open, onClose }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { notes, loading, addNote, updateNote, deleteNote, getRecentNotes, notesCount } = useNotes();
  
  const [allNotesModalOpen, setAllNotesModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', color: '#1976d2' });

  const recentNotes = getRecentNotes(4);

  const colors = [
    { name: 'Azul', value: '#1976d2' },
    { name: 'Verde', value: '#388e3c' },
    { name: 'Naranja', value: '#f57c00' },
    { name: 'Rojo', value: '#d32f2f' },
    { name: 'Morado', value: '#7b1fa2' },
    { name: 'Gris', value: '#616161' }
  ];

  const handleOpenNoteModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setNoteForm({
        title: note.title || '',
        content: note.content || '',
        color: note.color || '#1976d2'
      });
    } else {
      setEditingNote(null);
      setNoteForm({ title: '', content: '', color: '#1976d2' });
    }
    setNoteModalOpen(true);
    onClose();
  };

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setEditingNote(null);
    setNoteForm({ title: '', content: '', color: '#1976d2' });
  };

  const handleSaveNote = async () => {
    if (!noteForm.title.trim() && !noteForm.content.trim()) return;

    try {
      if (editingNote) {
        await updateNote(editingNote.id, noteForm);
      } else {
        await addNote(noteForm);
      }
      handleCloseNoteModal();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            mt: 1.5,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            bgcolor: theme.palette.background.paper
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">
              Mis Notas
            </Typography>
            <Chip
              label={notesCount}
              size="small"
              color="primary"
              sx={{ minWidth: 24 }}
            />
          </Box>
          
          <Button
            fullWidth
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
            onClick={() => handleOpenNoteModal()}
            sx={{ mt: 1, borderRadius: 2 }}
          >
            Nueva Nota
          </Button>
        </Box>

        <MenuList sx={{ p: 0, maxHeight: 300, overflowY: 'auto' }}>
          {loading ? (
            <ListItem>
              <ListItemText primary="Cargando notas..." />
            </ListItem>
          ) : recentNotes.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="Sin notas" 
                secondary="Crea tu primera nota para empezar"
                sx={{ textAlign: 'center', py: 2 }}
              />
            </ListItem>
          ) : (
            recentNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ListItem
                  sx={{
                    borderLeft: `4px solid ${note.color || '#1976d2'}`,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenNoteModal(note)}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {note.title && (
                          <Typography variant="subtitle2" fontWeight="600" noWrap>
                            {note.title}
                          </Typography>
                        )}
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mt: 0.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {note.content || 'Sin contenido'}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                          {formatDistanceToNow(note.updatedAt, { addSuffix: true, locale: es })}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        sx={{ ml: 1, opacity: 0.6, '&:hover': { opacity: 1, color: 'error.main' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </ListItem>
                <Divider />
              </motion.div>
            ))
          )}
        </MenuList>

        {notesCount > 4 && (
          <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              fullWidth
              startIcon={<AllNotesIcon />}
              size="small"
              onClick={() => {
                setAllNotesModalOpen(true);
                onClose();
              }}
            >
              Ver todas las notas ({notesCount})
            </Button>
          </Box>
        )}
      </Menu>

      {/* Modal para crear/editar nota */}
      <Dialog
        open={noteModalOpen}
        onClose={handleCloseNoteModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {editingNote ? 'Editar Nota' : 'Nueva Nota'}
          <IconButton
            onClick={handleCloseNoteModal}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título (opcional)"
            fullWidth
            variant="outlined"
            value={noteForm.title}
            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Contenido"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={noteForm.content}
            onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Color:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {colors.map((color) => (
              <Avatar
                key={color.value}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: color.value,
                  cursor: 'pointer',
                  border: noteForm.color === color.value ? '3px solid' : '2px solid transparent',
                  borderColor: noteForm.color === color.value ? theme.palette.text.primary : 'transparent'
                }}
                onClick={() => setNoteForm({ ...noteForm, color: color.value })}
              />
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseNoteModal}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveNote}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!noteForm.title.trim() && !noteForm.content.trim()}
          >
            {editingNote ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver todas las notas */}
      <Dialog
        open={allNotesModalOpen}
        onClose={() => setAllNotesModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, height: '80vh' }
        }}
      >
        <DialogTitle>
          Todas mis notas ({notesCount})
          <IconButton
            onClick={() => setAllNotesModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
            {notes.map((note) => (
              <Card
                key={note.id}
                sx={{
                  borderLeft: `4px solid ${note.color || '#1976d2'}`,
                  cursor: 'pointer',
                  '&:hover': { boxShadow: theme.shadows[4] }
                }}
                onClick={() => {
                  setAllNotesModalOpen(false);
                  handleOpenNoteModal(note);
                }}
              >
                <CardContent>
                  {note.title && (
                    <Typography variant="h6" fontWeight="600" gutterBottom noWrap>
                      {note.title}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {truncateText(note.content, 150)}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {formatDistanceToNow(note.updatedAt, { addSuffix: true, locale: es })}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          
          {notes.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <NotesIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No tienes notas todavía
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setAllNotesModalOpen(false);
                  handleOpenNoteModal();
                }}
                sx={{ mt: 2 }}
              >
                Crear primera nota
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotesMenu;