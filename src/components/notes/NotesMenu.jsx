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
  Avatar,
  Grid
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
  const [initialNoteForm, setInitialNoteForm] = useState({ title: '', content: '', color: '#1976d2' });
  const [confirmCloseDialogOpen, setConfirmCloseDialogOpen] = useState(false);

  const recentNotes = getRecentNotes(4);

  const colors = [
    { name: 'Azul', value: '#1976d2' },
    { name: 'Verde', value: '#388e3c' },
    { name: 'Naranja', value: '#f57c00' },
    { name: 'Rojo', value: '#d32f2f' },
    { name: 'Morado', value: '#7b1fa2' },
    { name: 'Gris', value: '#616161' }
  ];

  // Detectar si hay cambios sin guardar
  const hasUnsavedChanges = () => {
    return (
      noteForm.title !== initialNoteForm.title ||
      noteForm.content !== initialNoteForm.content ||
      noteForm.color !== initialNoteForm.color
    );
  };

  const handleOpenNoteModal = (note = null) => {
    const initialForm = note ? {
      title: note.title || '',
      content: note.content || '',
      color: note.color || '#1976d2'
    } : { title: '', content: '', color: '#1976d2' };

    if (note) {
      setEditingNote(note);
    } else {
      setEditingNote(null);
    }
    
    setNoteForm(initialForm);
    setInitialNoteForm(initialForm);
    setNoteModalOpen(true);
    onClose();
  };

  const handleAttemptClose = () => {
    if (hasUnsavedChanges()) {
      setConfirmCloseDialogOpen(true);
    } else {
      handleCloseNoteModal();
    }
  };

  const handleConfirmClose = () => {
    setConfirmCloseDialogOpen(false);
    handleCloseNoteModal();
  };

  const handleCancelClose = () => {
    setConfirmCloseDialogOpen(false);
  };

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setEditingNote(null);
    setNoteForm({ title: '', content: '', color: '#1976d2' });
    setInitialNoteForm({ title: '', content: '', color: '#1976d2' });
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
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="600" sx={{ letterSpacing: '-0.01em' }}>
              Mis Notas
            </Typography>
            <Chip
              label={notesCount}
              size="small"
              sx={{ 
                minWidth: 24,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>
          
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => handleOpenNoteModal()}
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              py: 1.25,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
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
                    py: 2,
                    px: 2.5,
                    borderLeft: `6px solid ${note.color || '#1976d2'}`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      boxShadow: `inset 0 0 0 1px ${alpha(note.color || '#1976d2', 0.2)}`,
                      transform: 'translateX(2px)'
                    }
                  }}
                  onClick={() => handleOpenNoteModal(note)}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {note.title && (
                          <Typography 
                            variant="subtitle2" 
                            fontWeight="600" 
                            noWrap
                            sx={{ 
                              color: 'text.primary',
                              letterSpacing: '-0.01em',
                              mb: 0.5
                            }}
                          >
                            {note.title}
                          </Typography>
                        )}
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                            fontSize: '0.875rem'
                          }}
                        >
                          {note.content || 'Sin contenido'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.disabled" 
                          sx={{ 
                            mt: 1, 
                            display: 'block',
                            fontSize: '0.75rem',
                            textTransform: 'lowercase'
                          }}
                        >
                          {formatDistanceToNow(note.updatedAt, { addSuffix: true, locale: es })}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        sx={{ 
                          ml: 1, 
                          opacity: 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            opacity: 1, 
                            color: 'error.main',
                            bgcolor: alpha(theme.palette.error.main, 0.08),
                            transform: 'scale(1.1)'
                          } 
                        }}
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
          <Box sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              fullWidth
              startIcon={<AllNotesIcon />}
              onClick={() => {
                setAllNotesModalOpen(true);
                onClose();
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                color: 'text.secondary',
                py: 1,
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  color: 'primary.main'
                }
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
        onClose={handleAttemptClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        <DialogTitle variant="h6" sx={{
          pb: 2,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              width: 40,
              height: 40
            }}>
              {editingNote ? <EditIcon /> : <AddIcon />}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{
                  fontWeight: 600,
                  mb: 0,
                  color: 'text.primary'
                }}>
                  {editingNote ? 'Editar Nota' : 'Nueva Nota'}
                </Typography>
                {hasUnsavedChanges() && (
                  <Chip
                    size="small"
                    label="Sin guardar"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.warning.main, 0.15),
                      color: 'warning.main',
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                      '& .MuiChip-label': {
                        px: 1
                      }
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {editingNote ? 'Actualiza la información de tu nota' : 'Crea una nueva nota rápida'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleAttemptClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* COLUMNA IZQUIERDA - Título y Color */}
              <Grid item xs={12} md={5}>
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '100%'
                  }}
                >
                  <Typography 
                    variant="overline" 
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                      letterSpacing: 0.8,
                      fontSize: '0.75rem',
                      display: 'block',
                      mb: 3
                    }}
                  >
                    Información General
                  </Typography>

                  <TextField
                    autoFocus
                    label="Título (opcional)"
                    fullWidth
                    variant="outlined"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    placeholder="Ej: Pendientes del día..."
                    sx={{ mb: 4 }}
                  />

                  <Box sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    background: alpha(theme.palette.background.default, 0.4)
                  }}>
                    <Typography 
                      variant="overline" 
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        letterSpacing: 0.8,
                        fontSize: '0.75rem',
                        display: 'block',
                        mb: 2
                      }}
                    >
                      Color de Identificación
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      {colors.map((color) => (
                        <Tooltip key={color.value} title={color.name} arrow>
                          <Avatar
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: color.value,
                              cursor: 'pointer',
                              border: noteForm.color === color.value 
                                ? `3px solid ${theme.palette.text.primary}` 
                                : `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: noteForm.color === color.value 
                                ? '0 4px 12px rgba(0,0,0,0.15)' 
                                : '0 2px 4px rgba(0,0,0,0.06)',
                              transform: noteForm.color === color.value ? 'scale(1.1)' : 'scale(1)',
                              '&:hover': {
                                transform: 'scale(1.15)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                              }
                            }}
                            onClick={() => setNoteForm({ ...noteForm, color: color.value })}
                          >
                            {noteForm.color === color.value && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                              >
                                ✓
                              </motion.div>
                            )}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* COLUMNA DERECHA - Contenido con borde del color seleccionado */}
              <Grid item xs={12} md={7}>
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderLeft: `4px solid ${noteForm.color}`,
                    background: theme.palette.background.paper,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.06), -2px 0 8px ${alpha(noteForm.color, 0.15)}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: `linear-gradient(180deg, ${noteForm.color} 0%, ${alpha(noteForm.color, 0.3)} 100%)`,
                      zIndex: 1
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography 
                      variant="overline" 
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        letterSpacing: 0.8,
                        fontSize: '0.75rem'
                      }}
                    >
                      Contenido de la Nota
                    </Typography>
                    <Chip
                      size="small"
                      sx={{
                        bgcolor: alpha(noteForm.color, 0.15),
                        color: noteForm.color,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 22,
                        borderRadius: 1,
                        border: `1px solid ${alpha(noteForm.color, 0.3)}`,
                        '& .MuiChip-label': {
                          px: 1.5
                        }
                      }}
                      label={colors.find(c => c.value === noteForm.color)?.name || 'Color'}
                    />
                  </Box>
                  
                  <TextField
                    label="Contenido"
                    fullWidth
                    multiline
                    variant="outlined"
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    placeholder="Escribe el contenido de tu nota aquí..."
                    sx={{ 
                      flex: 1,
                      '& .MuiInputBase-root': {
                        height: '100%',
                        alignItems: 'flex-start'
                      },
                      '& textarea': {
                        height: '100% !important',
                        overflow: 'auto !important'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(noteForm.color, 0.2)
                      },
                      '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: noteForm.color,
                        borderWidth: 2
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{
          p: 3,
          gap: 1,
          background: theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Button
            onClick={handleAttemptClose}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500,
              px: 3
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveNote}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!noteForm.title.trim() && !noteForm.content.trim()}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {editingNote ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para cambios sin guardar */}
      <Dialog
        open={confirmCloseDialogOpen}
        onClose={handleCancelClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
          }
        }}
      >
        <DialogTitle variant="h6" sx={{
          pb: 2,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              color: 'warning.main',
              width: 40,
              height: 40
            }}>
              ⚠️
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                mb: 0,
                color: 'text.primary'
              }}>
                Cambios sin guardar
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Tienes cambios pendientes
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCancelClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Box sx={{ mt: 2 }}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              background: alpha(theme.palette.warning.main, 0.04),
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2
            }}
          >
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Typography sx={{ fontSize: '1.5rem' }}>⚠️</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ 
                color: 'text.primary',
                fontWeight: 500,
                mb: 0.5
              }}>
                Has realizado cambios en esta nota que aún no se han guardado.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                Si cierras este modal sin guardar, perderás todos los cambios realizados. ¿Deseas descartarlos?
              </Typography>
            </Box>
          </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{
          p: 3,
          gap: 1,
          background: theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Button
            onClick={handleCancelClose}
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              color: 'text.primary',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04)
              }
            }}
          >
            Seguir editando
          </Button>
          <Button
            onClick={handleConfirmClose}
            variant="contained"
            color="warning"
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            Descartar cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver todas las notas */}
      <Dialog
        open={allNotesModalOpen}
        onClose={() => setAllNotesModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            height: '85vh',
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        <DialogTitle variant="h6" sx={{
          pb: 2,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              width: 40,
              height: 40
            }}>
              <AllNotesIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                mb: 0,
                color: 'text.primary'
              }}>
                Todas mis notas
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {notesCount === 0 ? 'No tienes notas guardadas' : `${notesCount} ${notesCount === 1 ? 'nota guardada' : 'notas guardadas'}`}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setAllNotesModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {notes.length > 0 ? (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: 3 
            }}>
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      borderLeft: `4px solid ${note.color || '#1976d2'}`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      '&:hover': { 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => {
                      setAllNotesModalOpen(false);
                      handleOpenNoteModal(note);
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      {note.title && (
                        <Typography 
                          variant="h6" 
                          sx={{
                            fontWeight: 600,
                            mb: 1.5,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {note.title}
                        </Typography>
                      )}
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          minHeight: 60,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {note.content || 'Sin contenido'}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        pt: 1.5,
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                      }}>
                        <Typography variant="caption" color="text.disabled">
                          {formatDistanceToNow(note.updatedAt, { addSuffix: true, locale: es })}
                        </Typography>
                        <Chip 
                          size="small"
                          sx={{
                            bgcolor: alpha(note.color || '#1976d2', 0.1),
                            color: note.color || '#1976d2',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 20
                          }}
                          label={note.title ? 'Con título' : 'Sin título'}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh'
            }}>
              <Box
                component={motion.div}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  mb: 3
                }}
              >
                <NotesIcon sx={{ fontSize: 64, color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" fontWeight="600" color="text.primary" sx={{ mb: 1 }}>
                No tienes notas todavía
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                Las notas te ayudan a recordar tareas pendientes, ideas importantes o cualquier información que necesites guardar rápidamente.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => {
                  setAllNotesModalOpen(false);
                  handleOpenNoteModal();
                }}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                Crear mi primera nota
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotesMenu;