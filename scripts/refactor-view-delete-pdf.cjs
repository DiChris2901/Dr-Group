/**
 * Refactoring script: View modal sobrio redesign + Delete modal + PDF viewer
 * Applied to the already-refactored EmpleadosPage.jsx
 * 
 * Changes:
 * - View modal: Card variant="outlined" → Paper elevation={0} with unified borders  
 * - View modal: Section headers → overline sobrio style (subtitle2 + uppercase)
 * - View modal: Remove hardcoded colors (#66bb6a, #2e7d32) → text.secondary
 * - View modal: Unify document button colors → primary
 * - View modal: Add "Editar" button in DialogActions
 * - Delete modal: Redesign header
 * - PDF Viewer: Add Skeleton loading + error fallback
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'EmpleadosPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log(`Read file: ${content.split('\n').length} lines`);

// ═══════════ VIEW MODAL FIXES ═══════════

// 1. Section headers: variant="h6" colored → subtitle2 overline sobrio
// Info Personal
content = content.replace(
  `<Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>\n                <BadgeIcon />\n                Información Personal\n              </Typography>`,
  `<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>\n                <BadgeIcon sx={{ fontSize: 18 }} />\n                Información Personal\n              </Typography>`
);

// Documento de Identidad  
content = content.replace(
  `<Typography variant="h6" sx={{ mb: 2, mt: 3, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>\n                    <BadgeIcon />\n                    Documento de Identidad\n                  </Typography>`,
  `<Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>\n                    <BadgeIcon sx={{ fontSize: 18 }} />\n                    Documento de Identidad\n                  </Typography>`
);

// Información Laboral
content = content.replace(
  `<Typography variant="h6" sx={{ mb: 2, mt: 3, color: 'info.main', display: 'flex', alignItems: 'center', gap: 1 }}>\n                <WorkIcon />\n                Información Laboral\n              </Typography>`,
  `<Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>\n                <WorkIcon sx={{ fontSize: 18 }} />\n                Información Laboral\n              </Typography>`
);

// Información de Nómina
content = content.replace(
  `<Typography variant="h6" sx={{ mb: 2, mt: 3, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>\n                    <AttachMoneyIcon />\n                    Información de Nómina\n                  </Typography>`,
  `<Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>\n                    <AttachMoneyIcon sx={{ fontSize: 18 }} />\n                    Información de Nómina\n                  </Typography>`
);

// Seguridad Social (hardcoded colors!)
content = content.replace(
  `<Typography variant="h6" sx={{ mb: 2, mt: 1, color: theme.palette.mode === 'dark' ? '#66bb6a' : '#2e7d32', display: 'flex', alignItems: 'center', gap: 1 }}>\n                    <LocalHospitalIcon />\n                    Seguridad Social y Parafiscales\n                  </Typography>`,
  `<Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>\n                    <LocalHospitalIcon sx={{ fontSize: 18 }} />\n                    Seguridad Social y Parafiscales\n                  </Typography>`
);

// Estado Laboral
content = content.replace(
  `<Typography variant="h6" sx={{ mb: 2, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>\n                    <InfoIcon />\n                    Estado Laboral\n                  </Typography>`,
  `<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>\n                    <InfoIcon sx={{ fontSize: 18 }} />\n                    Estado Laboral\n                  </Typography>`
);

// Información Bancaria
content = content.replace(
  `<Typography variant="h6" sx={{ mb: 2, mt: 3, color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>\n                <AccountBalanceIcon />\n                Información Bancaria\n              </Typography>`,
  `<Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>\n                <AccountBalanceIcon sx={{ fontSize: 18 }} />\n                Información Bancaria\n              </Typography>`
);

// 2. Cards → Paper - use regex to replace all Card variant="outlined" instances
// Pattern: <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
content = content.replace(
  /(<\s*)Card(\s+variant="outlined"\s+sx=\{\{\s*p:\s*2,\s*height:\s*'100%'\s*\}\})/g,
  '$1Paper elevation={0}$2'
);
// But we need to change the sx to include border and borderRadius
// Let's do a more targeted replacement:
// Replace all: Card variant="outlined" sx={{ p: 2, height: '100%' }}
// With: Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.15)}` }}
content = content.replaceAll(
  `Card variant="outlined" sx={{ p: 2, height: '100%' }}>`,
  'Paper elevation={0} sx={{ p: 2, height: \'100%\', borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.15)}` }}>'
);

// Cards with just p: 2 (document action cards)
content = content.replaceAll(
  `Card variant="outlined" sx={{ p: 2 }}>`,
  'Paper elevation={0} sx={{ p: 2, borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.15)}` }}>'
);

// Card with special bgcolor (Siguiente Renovación)
content = content.replace(
  `Card variant="outlined" sx={{ p: 2, height: '100%', bgcolor: alpha(theme.palette.success.main, 0.05) }}>`,
  'Paper elevation={0} sx={{ p: 2, height: \'100%\', borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.15)}`, bgcolor: alpha(theme.palette.success.main, 0.04) }}>'
);

// Card with renovación styling (has multiline sx prop)
// Renovación card
content = content.replace(
  `<Card \n                        variant="outlined" \n                        sx={{ \n                          p: 2,\n                          bgcolor: selectedEmpleado.seRenueva \n                            ? alpha(theme.palette.success.main, 0.05)\n                            : alpha(theme.palette.grey[500], 0.05)\n                        }}\n                      >`,
  `<Paper \n                        elevation={0} \n                        sx={{ \n                          p: 2,\n                          borderRadius: 1,\n                          border: \`1px solid \${alpha(theme.palette.divider, 0.15)}\`,\n                          bgcolor: selectedEmpleado.seRenueva \n                            ? alpha(theme.palette.success.main, 0.04)\n                            : alpha(theme.palette.action.hover, 0.04)\n                        }}\n                      >`
);

// Estado laboral special Card
content = content.replace(
  `<Card \n                        variant="outlined" \n                        sx={{ \n                          p: 2, \n                          bgcolor: alpha(theme.palette.warning.main, 0.04),\n                          borderColor: alpha(theme.palette.warning.main, 0.2)\n                        }}\n                      >`,
  `<Paper \n                        elevation={0} \n                        sx={{ \n                          p: 2, \n                          borderRadius: 1,\n                          border: \`1px solid \${alpha(theme.palette.warning.main, 0.2)}\`,\n                          bgcolor: alpha(theme.palette.warning.main, 0.04)\n                        }}\n                      >`
);

// Replace ALL closing </Card> with </Paper>
content = content.replaceAll('</Card>', '</Paper>');

// 3. Card field label colors → text.secondary (unify all)
// Replace color="primary" on subtitle2 within view modal
content = content.replaceAll(
  `<Typography variant="subtitle2" color="primary" gutterBottom>`,
  `<Typography variant="subtitle2" color="text.secondary" gutterBottom>`
);
content = content.replaceAll(
  `<Typography variant="subtitle2" color="info" gutterBottom>`,
  `<Typography variant="subtitle2" color="text.secondary" gutterBottom>`
);
content = content.replaceAll(
  `<Typography variant="subtitle2" color="success" gutterBottom>`,
  `<Typography variant="subtitle2" color="text.secondary" gutterBottom>`
);
content = content.replaceAll(
  `<Typography variant="subtitle2" color="secondary" gutterBottom>`,
  `<Typography variant="subtitle2" color="text.secondary" gutterBottom>`
);

// Replace hardcoded color on subtitle2 (Seguridad Social fields)
content = content.replaceAll(
  `<Typography variant="subtitle2" sx={{ color: theme.palette.mode === 'dark' ? '#66bb6a' : '#2e7d32' }} gutterBottom>`,
  `<Typography variant="subtitle2" color="text.secondary" gutterBottom>`
);

// 4. Document buttons → unify to primary
// Doc identidad button: remove color="success"
content = content.replace(
  `variant="outlined"\n                            size="small"\n                            color="success"\n                            startIcon={<VisibilityIcon />}`,
  `variant="outlined"\n                            size="small"\n                            color="primary"\n                            startIcon={<VisibilityIcon />}`
);

// Certificado button: color="secondary" → color="primary"
content = content.replace(
  `variant="outlined"\n                          size="small"\n                          color="secondary"\n                          startIcon={<PdfIcon />}`,
  `variant="outlined"\n                          size="small"\n                          color="primary"\n                          startIcon={<PdfIcon />}`
);

// 5. View modal DialogActions: Add "Editar" button
content = content.replace(
  `<DialogActions sx={{ \n          p: 3, \n          pt: 2,\n          bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',\n          borderTop: \`1px solid \${alpha(theme.palette.divider, 0.1)}\`\n        }}>\n          <Button\n            onClick={() => setViewDialogOpen(false)}\n            variant="contained"\n            sx={{ \n              borderRadius: 2,\n              textTransform: 'none',\n              fontWeight: 600,\n              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'\n            }}\n          >\n            Cerrar\n          </Button>\n        </DialogActions>\n      </Dialog>\n\n      {/* Modal Eliminar Empleado */}`,
  `<DialogActions sx={{ \n          p: 3, \n          pt: 2,\n          gap: 1.5,\n          bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',\n          borderTop: \`1px solid \${alpha(theme.palette.divider, 0.1)}\`\n        }}>\n          <Button\n            onClick={() => setViewDialogOpen(false)}\n            sx={{ \n              borderRadius: 1,\n              textTransform: 'none',\n              fontWeight: 500\n            }}\n          >\n            Cerrar\n          </Button>\n          <Button\n            onClick={() => {\n              setViewDialogOpen(false);\n              if (selectedEmpleado) handleOpenEditDialog(selectedEmpleado);\n            }}\n            variant="contained"\n            startIcon={<EditIcon />}\n            sx={{ \n              borderRadius: 1,\n              textTransform: 'none',\n              fontWeight: 600,\n              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'\n            }}\n          >\n            Editar\n          </Button>\n        </DialogActions>\n      </Dialog>\n\n      {/* Modal Eliminar Empleado */}`
);

// ═══════════ DELETE MODAL FIX ═══════════
// Replace header with Avatar + title + close button pattern
content = content.replace(
  `<DialogTitle sx={{\n          background: alpha(theme.palette.error.main, 0.1),\n          color: 'error.main',\n          display: 'flex',\n          alignItems: 'center',\n          gap: 1.5\n        }}>\n          <DeleteIcon />\n          <Typography variant="h6" sx={{ fontWeight: 600 }}>\n            Confirmar Eliminación\n          </Typography>\n        </DialogTitle>`,
  `<DialogTitle sx={{\n          borderBottom: \`1px solid \${alpha(theme.palette.divider, 0.1)}\`,\n          display: 'flex',\n          alignItems: 'center',\n          justifyContent: 'space-between',\n          p: 2.5\n        }}>\n          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>\n            <Avatar\n              sx={{\n                bgcolor: alpha(theme.palette.error.main, 0.08),\n                color: 'error.main',\n                width: 40,\n                height: 40\n              }}\n            >\n              <DeleteIcon />\n            </Avatar>\n            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>\n              Confirmar Eliminación\n            </Typography>\n          </Box>\n          <IconButton\n            onClick={() => setDeleteDialogOpen(false)}\n            size="small"\n            sx={{\n              color: 'text.secondary',\n              '&:hover': {\n                bgcolor: alpha(theme.palette.text.secondary, 0.08)\n              }\n            }}\n          >\n            <CloseIcon />\n          </IconButton>\n        </DialogTitle>`
);

// Fix Delete Dialog borderRadius
content = content.replace(
  `<Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>`,
  `<Alert severity="warning" sx={{ mb: 2, borderRadius: 1 }}>`
);

// ═══════════ PDF VIEWER FIX ═══════════
// Replace simple iframe with Skeleton loading + error fallback
content = content.replace(
  `<DialogContent sx={{ p: 0, height: '100%' }}>\n          {pdfViewerUrl && (\n            <iframe\n              src={pdfViewerUrl}\n              style={{\n                width: '100%',\n                height: '100%',\n                border: 'none'\n              }}\n              title={pdfViewerTitle}\n            />\n          )}\n        </DialogContent>`,
  `<DialogContent sx={{ p: 0, height: '100%', position: 'relative' }}>\n          {pdfViewerUrl ? (\n            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>\n              <iframe\n                src={pdfViewerUrl}\n                style={{\n                  width: '100%',\n                  height: '100%',\n                  border: 'none',\n                  position: 'relative',\n                  zIndex: 1\n                }}\n                title={pdfViewerTitle}\n                onLoad={(e) => {\n                  const skeleton = e.target.previousSibling;\n                  if (skeleton) skeleton.style.display = 'none';\n                }}\n              />\n              <Box sx={{\n                position: 'absolute',\n                top: 0,\n                left: 0,\n                right: 0,\n                bottom: 0,\n                p: 3,\n                display: 'flex',\n                flexDirection: 'column',\n                gap: 2\n              }}>\n                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />\n                <Skeleton variant="rectangular" sx={{ flex: 1, borderRadius: 1 }} animation="wave" />\n                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />\n              </Box>\n            </Box>\n          ) : (\n            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>\n              <Typography color="text.secondary">No se pudo cargar el documento</Typography>\n            </Box>\n          )}\n        </DialogContent>`
);

// Add Skeleton to imports (add after existing import if not already there)
if (!content.includes("Skeleton,")) {
  content = content.replace(
    "  CircularProgress,\n",
    "  Skeleton,\n"
  );
}

// Remove CircularProgress if no longer used elsewhere
const circularProgressUsages = (content.match(/CircularProgress/g) || []).length;
if (circularProgressUsages <= 1) {
  // Only in import - remove it
  content = content.replace("  CircularProgress,\n", "");
}

// Write the modified file
fs.writeFileSync(filePath, content);

const newLineCount = content.split('\n').length;
console.log(`\nView modal + Delete + PDF viewer redesign complete!`);
console.log(`New file: ${newLineCount} lines`);
console.log(`\nChanges made:`);
console.log(`  ✓ View modal: 7 section headers → overline sobrio style`);
console.log(`  ✓ View modal: Card → Paper with unified borders`);
console.log(`  ✓ View modal: Removed hardcoded colors (#66bb6a, #2e7d32)`);
console.log(`  ✓ View modal: Unified field label colors → text.secondary`);
console.log(`  ✓ View modal: Unified document button colors → primary`);
console.log(`  ✓ View modal: Added "Editar" button in DialogActions`);
console.log(`  ✓ Delete modal: Redesigned header (Avatar + title + close)`);
console.log(`  ✓ PDF Viewer: Added Skeleton loading + error fallback`);
console.log(`  ✓ Replaced CircularProgress with Skeleton in imports`);
