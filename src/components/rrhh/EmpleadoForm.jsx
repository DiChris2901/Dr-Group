import React from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Skeleton,
  alpha,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Badge as BadgeIcon,
  Work as WorkIcon,
  AttachMoney as AttachMoneyIcon,
  LocalHospital as LocalHospitalIcon,
  AccountBalance as AccountBalanceIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  UploadFile as UploadFileIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// ===== CONSTANTES COMPARTIDAS =====
export const BANCOS_COLOMBIA = [
  'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia',
  'Banco de Occidente', 'Banco Popular', 'Banco Caja Social', 'Banco AV Villas',
  'Banco Agrario', 'Banco Pichincha', 'Banco Falabella', 'Banco Finandina',
  'Banco GNB Sudameris', 'Banco Cooperativo Coopcentral', 'Banco Serfinanza',
  'Banco Mundo Mujer', 'Bancamía', 'Banco W', 'Banco Credifinanciera',
  'Itaú', 'Scotiabank Colpatria', 'Citibank', 'Nequi', 'Daviplata',
  'Movii', 'Rappipay', 'Banco Santander', 'Lulo Bank'
].sort();

export const EPS_COLOMBIA = [
  'Aliansalud', 'Asmet Salud', 'Capital Salud', 'Compensar EPS', 'Coomeva EPS',
  'Coosalud', 'Emssanar', 'Famisanar', 'Medimás', 'Mutual Ser',
  'Nueva EPS', 'Salud Total', 'Sanitas', 'SOS EPS', 'Sura EPS'
];

export const FONDOS_PENSION = [
  'Colfondos', 'Colpensiones (RPM)', 'Old Mutual (Skandia)', 'Porvenir', 'Protección'
];

export const FONDOS_CESANTIAS = [
  'Colfondos', 'FNA (Fondo Nacional del Ahorro)', 'Porvenir', 'Protección'
];

export const CAJAS_COMPENSACION = [
  'Cafam', 'Colsubsidio', 'Combarranquilla', 'Comfaboy', 'Comfama',
  'Comfandi', 'Comfenalco', 'Compensar'
];

export const ARL_COLOMBIA = [
  'Alfa ARL', 'Bolívar ARL', 'Colmena ARL', 'Colpatria ARL',
  'Equidad ARL', 'Liberty ARL', 'Positiva ARL', 'Sura ARL'
];

export const NIVELES_RIESGO_ARL = [
  { value: 'I', label: 'Nivel I - Riesgo Mínimo', porcentaje: 0.522 },
  { value: 'II', label: 'Nivel II - Riesgo Bajo', porcentaje: 1.044 },
  { value: 'III', label: 'Nivel III - Riesgo Medio', porcentaje: 2.436 },
  { value: 'IV', label: 'Nivel IV - Riesgo Alto', porcentaje: 4.350 },
  { value: 'V', label: 'Nivel V - Riesgo Máximo', porcentaje: 6.960 }
];

// ===== ESTILOS SOBRIOS PARA INPUTS =====
const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 1 } };
const selectSx = { borderRadius: 1 };

// ===== SECTION HEADER SOBRIO =====
const SectionHeader = ({ icon, label }) => {
  const theme = useTheme();
  return (
    <Grid item xs={12} sx={{ mt: 1.5 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 1,
        pl: 1.5,
        borderLeft: `3px solid ${theme.palette.primary.main}`
      }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>
          {icon}
        </Box>
        <Typography variant="subtitle2" sx={{
          fontWeight: 700,
          fontSize: '0.75rem',
          color: 'primary.main',
          textTransform: 'uppercase',
          letterSpacing: 0.8
        }}>
          {label}
        </Typography>
      </Box>
    </Grid>
  );
};

// ===== FILE UPLOAD ZONE (Unificado) =====
const FileUploadZone = ({
  inputId,
  accept,
  file,
  onFileChange,
  label,
  existingUrl,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  uploading,
  onViewExisting,
  onDeleteExisting,
  mode = 'add'
}) => {
  const theme = useTheme();

  return (
    <Grid item xs={12}>
      <Paper
        variant="outlined"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        sx={{
          p: 2,
          borderRadius: 1,
          border: `2px dashed ${alpha(theme.palette.divider, dragOver ? 0.5 : 0.25)}`,
          bgcolor: dragOver
            ? alpha(theme.palette.primary.main, 0.04)
            : alpha(theme.palette.action.hover, 0.02),
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
      >
        <input
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          id={inputId}
          onChange={(e) => onFileChange(e.target.files[0])}
        />
        <label htmlFor={inputId} style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
          <Button
            component="span"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            fullWidth
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              borderColor: alpha(theme.palette.divider, 0.3),
              color: 'text.secondary',
              '&:hover': {
                borderColor: alpha(theme.palette.primary.main, 0.4),
                bgcolor: alpha(theme.palette.primary.main, 0.04)
              }
            }}
          >
            {file
              ? file.name
              : (mode === 'edit' && existingUrl)
                ? `Cambiar ${label}`
                : label}
          </Button>
          {!file && !(mode === 'edit' && existingUrl) && (
            <Typography variant="caption" color="text.disabled" sx={{
              display: 'block', textAlign: 'center', mt: 0.75, fontStyle: 'italic', fontSize: '0.7rem'
            }}>
              o arrastra el archivo aquí
            </Typography>
          )}
        </label>

        {/* Edit mode: View/Delete existing file */}
        {mode === 'edit' && existingUrl && !file && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'center' }}>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={onViewExisting}
              sx={{ flex: 1, textTransform: 'none', borderRadius: 1 }}
            >
              Ver actual
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onDeleteExisting}
              sx={{ flex: 1, textTransform: 'none', borderRadius: 1 }}
            >
              Eliminar
            </Button>
          </Box>
        )}

        {/* Upload progress - Skeleton instead of spinner */}
        {uploading && (
          <Box sx={{ mt: 1.5 }}>
            <Skeleton variant="rectangular" height={4} sx={{ borderRadius: 2 }} animation="wave" />
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
              Subiendo archivo...
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );
};

// ===== COMPONENTE PRINCIPAL =====
const EmpleadoForm = ({
  formData,
  handleFormChange,
  mode = 'add', // 'add' | 'edit'
  empresas = [],
  calcularFechaFinContrato,
  // File states
  documentoIdentidadFile,
  setDocumentoIdentidadFile,
  contratoFile,
  setContratoFile,
  certificadoFile,
  setCertificadoFile,
  // Drag states
  dragOverDocumento,
  dragOverContrato,
  dragOverCertificado,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  // Upload states
  uploadingDocumentoIdentidad,
  uploadingContrato,
  uploadingCertificado,
  // Edit-only props
  selectedEmpleado,
  onViewFile,
  onDeleteFile
}) => {
  const theme = useTheme();
  const idSuffix = mode === 'edit' ? '-edit' : '';

  return (
    <Grid container spacing={2}>

      {/* ═══════════ INFORMACIÓN PERSONAL ═══════════ */}
      <SectionHeader icon={<BadgeIcon sx={{ fontSize: 18 }} />} label="Información Personal" />

      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Nombres *" value={formData.nombres}
          onChange={(e) => handleFormChange('nombres', e.target.value)} required sx={inputSx} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Apellidos *" value={formData.apellidos}
          onChange={(e) => handleFormChange('apellidos', e.target.value)} required sx={inputSx} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Nacionalidad" value={formData.nacionalidad}
          onChange={(e) => handleFormChange('nacionalidad', e.target.value)} sx={inputSx} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <FormControl fullWidth>
          <InputLabel>Tipo Documento</InputLabel>
          <Select value={formData.tipoDocumento}
            onChange={(e) => handleFormChange('tipoDocumento', e.target.value)}
            label="Tipo Documento" sx={selectSx}>
            <MenuItem value="CC">Cédula de Ciudadanía</MenuItem>
            <MenuItem value="CE">Cédula de Extranjería</MenuItem>
            <MenuItem value="PAS">Pasaporte</MenuItem>
            <MenuItem value="TI">Tarjeta de Identidad</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField fullWidth label="N° Documento *" value={formData.numeroDocumento}
          onChange={(e) => handleFormChange('numeroDocumento', e.target.value)} required sx={inputSx} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Email Corporativo" type="email" value={formData.emailCorporativo}
          onChange={(e) => handleFormChange('emailCorporativo', e.target.value)}
          placeholder="ejemplo@org-rdj.com" sx={inputSx} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Teléfono" type="tel" value={formData.telefono}
          onChange={(e) => handleFormChange('telefono', e.target.value)}
          placeholder="+57 300 123 4567" sx={inputSx} />
      </Grid>
      <Grid item xs={12} sm={mode === 'edit' ? 6 : 12}>
        <TextField fullWidth label="Fecha de Nacimiento" type="date" value={formData.fechaNacimiento}
          onChange={(e) => handleFormChange('fechaNacimiento', e.target.value)}
          InputLabelProps={{ shrink: true }} sx={inputSx} />
      </Grid>
      {/* Edad: solo mostrar en Edit (se calcula automáticamente) */}
      {mode === 'edit' && (
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Edad" value={formData.edad} disabled sx={inputSx}
            helperText="Se calcula automáticamente" />
        </Grid>
      )}

      {/* Documento de Identidad */}
      <FileUploadZone
        inputId={`documento-identidad-upload${idSuffix}`}
        accept="application/pdf,image/*"
        file={documentoIdentidadFile}
        onFileChange={setDocumentoIdentidadFile}
        label="Adjuntar Documento de Identidad (PDF o Imagen)"
        existingUrl={selectedEmpleado?.documentoIdentidadURL}
        dragOver={dragOverDocumento}
        onDragOver={(e) => handleDragOver(e, 'documento')}
        onDragLeave={(e) => handleDragLeave(e, 'documento')}
        onDrop={(e) => handleDrop(e, 'documento', ['application/pdf', 'image/*'])}
        uploading={uploadingDocumentoIdentidad}
        onViewExisting={() => onViewFile?.(selectedEmpleado?.documentoIdentidadURL, 'Documento de Identidad')}
        onDeleteExisting={() => onDeleteFile?.('documentoIdentidadURL', selectedEmpleado?.documentoIdentidadURL)}
        mode={mode}
      />

      {/* ═══════════ INFORMACIÓN LABORAL ═══════════ */}
      <SectionHeader icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Información Laboral" />

      <Grid item xs={12} sm={formData.tipoVigencia === 'Indefinido' ? 4 : 3}>
        <FormControl fullWidth>
          <InputLabel>Empresa Contratante</InputLabel>
          <Select
            value={formData.empresaContratante || ''}
            onChange={(e) => handleFormChange('empresaContratante', e.target.value)}
            label="Empresa Contratante"
            displayEmpty
            sx={selectSx}
            renderValue={(selected) => {
              const empresa = empresas.find(e => e.name === selected);
              if (!empresa) return <em>Seleccionar empresa</em>;
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={empresa.logoURL} sx={{ width: 24, height: 24 }}>
                    {empresa.name.charAt(0)}
                  </Avatar>
                  {empresa.name}
                </Box>
              );
            }}
          >
            <MenuItem value=""><em>Seleccionar empresa</em></MenuItem>
            {empresas.map((empresa) => (
              <MenuItem key={empresa.id} value={empresa.name}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={empresa.logoURL} sx={{ width: 24, height: 24 }}>
                    {empresa.name.charAt(0)}
                  </Avatar>
                  {empresa.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={formData.tipoVigencia === 'Indefinido' ? 4 : 3}>
        <TextField fullWidth label="Fecha Inicio Contrato" type="date" value={formData.fechaInicioContrato}
          onChange={(e) => handleFormChange('fechaInicioContrato', e.target.value)}
          InputLabelProps={{ shrink: true }} sx={inputSx} />
      </Grid>
      <Grid item xs={12} sm={formData.tipoVigencia === 'Indefinido' ? 4 : 3}>
        <FormControl fullWidth>
          <InputLabel>Tipo de Vigencia</InputLabel>
          <Select value={formData.tipoVigencia}
            onChange={(e) => handleFormChange('tipoVigencia', e.target.value)}
            label="Tipo de Vigencia" sx={selectSx}>
            <MenuItem value="Trimestral">Trimestral (3 meses)</MenuItem>
            <MenuItem value="Semestral">Semestral (6 meses)</MenuItem>
            <MenuItem value="Anual">Anual (12 meses)</MenuItem>
            <MenuItem value="Indefinido">Indefinido</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      {formData.tipoVigencia !== 'Indefinido' && (
        <Grid item xs={12} sm={3}>
          <TextField fullWidth label="Fecha Fin Contrato" type="date"
            value={formData.fechaInicioContrato && formData.tipoVigencia ? calcularFechaFinContrato(formData.fechaInicioContrato, formData.tipoVigencia) : ''}
            disabled InputLabelProps={{ shrink: true }} sx={inputSx}
            helperText="Calculada automáticamente" />
        </Grid>
      )}

      {/* Renovación Automática */}
      {formData.tipoVigencia !== 'Indefinido' && (
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{
            p: 2, borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            bgcolor: formData.seRenueva
              ? alpha(theme.palette.success.main, 0.04)
              : 'transparent',
            transition: 'all 0.2s ease'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FormControlLabel
                control={<Checkbox checked={formData.seRenueva}
                  onChange={(e) => handleFormChange('seRenueva', e.target.checked)} color="success" />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ¿El contrato se renueva automáticamente?
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Indica si este contrato {formData.tipoVigencia?.toLowerCase()} se renovará al finalizar el período
                    </Typography>
                  </Box>
                }
                sx={{ flex: 1 }}
              />
              {formData.seRenueva && (
                <Chip label="Renovación Automática" size="small" color="success" sx={{ fontWeight: 600 }} />
              )}
            </Box>
          </Paper>
        </Grid>
      )}

      {/* Contrato Laboral */}
      <FileUploadZone
        inputId={`contrato-upload${idSuffix}`}
        accept="application/pdf"
        file={contratoFile}
        onFileChange={setContratoFile}
        label="Subir Contrato Laboral (PDF)"
        existingUrl={selectedEmpleado?.contratoURL}
        dragOver={dragOverContrato}
        onDragOver={(e) => handleDragOver(e, 'contrato')}
        onDragLeave={(e) => handleDragLeave(e, 'contrato')}
        onDrop={(e) => handleDrop(e, 'contrato', ['application/pdf'])}
        uploading={uploadingContrato}
        onViewExisting={() => onViewFile?.(selectedEmpleado?.contratoURL, 'Contrato Laboral')}
        onDeleteExisting={() => onDeleteFile?.('contratoURL', selectedEmpleado?.contratoURL)}
        mode={mode}
      />

      {/* ═══════════ INFORMACIÓN DE NÓMINA ═══════════ */}
      <SectionHeader icon={<AttachMoneyIcon sx={{ fontSize: 18 }} />} label="Información de Nómina" />

      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Salario Base" value={formData.salarioBase}
          onChange={(e) => handleFormChange('salarioBase', e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          sx={inputSx} helperText="Salario mensual" />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Cargo" value={formData.cargo}
          onChange={(e) => handleFormChange('cargo', e.target.value)} sx={inputSx} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth>
          <InputLabel>Periodicidad de Nómina</InputLabel>
          <Select value={formData.tipoNomina}
            onChange={(e) => handleFormChange('tipoNomina', e.target.value)}
            label="Periodicidad de Nómina" sx={selectSx}>
            <MenuItem value="mensual">Mensual</MenuItem>
            <MenuItem value="quincenal">Quincenal</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* ═══════════ SEGURIDAD SOCIAL Y PARAFISCALES ═══════════ */}
      <SectionHeader icon={<LocalHospitalIcon sx={{ fontSize: 18 }} />} label="Seguridad Social y Parafiscales" />

      <Grid item xs={12} sm={6}>
        <Autocomplete fullWidth freeSolo options={EPS_COLOMBIA} value={formData.eps}
          onChange={(e, v) => handleFormChange('eps', v || '')}
          onInputChange={(e, v) => handleFormChange('eps', v)}
          renderInput={(params) => <TextField {...params} label="EPS" sx={inputSx} />} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete fullWidth freeSolo options={FONDOS_PENSION} value={formData.fondoPension}
          onChange={(e, v) => handleFormChange('fondoPension', v || '')}
          onInputChange={(e, v) => handleFormChange('fondoPension', v)}
          renderInput={(params) => <TextField {...params} label="Fondo de Pensión" sx={inputSx} />} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete fullWidth freeSolo options={FONDOS_CESANTIAS} value={formData.fondoCesantias}
          onChange={(e, v) => handleFormChange('fondoCesantias', v || '')}
          onInputChange={(e, v) => handleFormChange('fondoCesantias', v)}
          renderInput={(params) => <TextField {...params} label="Fondo de Cesantías" sx={inputSx} />} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete fullWidth freeSolo options={CAJAS_COMPENSACION} value={formData.cajaCompensacion}
          onChange={(e, v) => handleFormChange('cajaCompensacion', v || '')}
          onInputChange={(e, v) => handleFormChange('cajaCompensacion', v)}
          renderInput={(params) => <TextField {...params} label="Caja de Compensación" sx={inputSx} />} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete fullWidth freeSolo options={ARL_COLOMBIA} value={formData.arl}
          onChange={(e, v) => handleFormChange('arl', v || '')}
          onInputChange={(e, v) => handleFormChange('arl', v)}
          renderInput={(params) => <TextField {...params} label="ARL" sx={inputSx} />} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Nivel de Riesgo ARL</InputLabel>
          <Select value={formData.nivelRiesgoArl}
            onChange={(e) => handleFormChange('nivelRiesgoArl', e.target.value)}
            label="Nivel de Riesgo ARL" sx={selectSx}>
            {NIVELES_RIESGO_ARL.map(nivel => (
              <MenuItem key={nivel.value} value={nivel.value}>
                {nivel.label} ({nivel.porcentaje}%)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* ═══════════ ESTADO LABORAL (solo Edit) ═══════════ */}
      {mode === 'edit' && (
        <>
          <SectionHeader icon={<InfoIcon sx={{ fontSize: 18 }} />} label="Estado Laboral" />

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox checked={formData.retirado || false}
                  onChange={(e) => {
                    handleFormChange('retirado', e.target.checked);
                    if (!e.target.checked) {
                      handleFormChange('fechaRetiro', '');
                      handleFormChange('motivoRetiro', '');
                    }
                  }}
                  color="warning" />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>Empleado retirado</Typography>
                  {formData.retirado && (
                    <Chip label="RETIRADO" size="small" color="warning" sx={{ fontWeight: 600 }} />
                  )}
                </Box>
              }
            />
          </Grid>

          {formData.retirado && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fecha de Retiro *" type="date"
                  value={formData.fechaRetiro || ''}
                  onChange={(e) => handleFormChange('fechaRetiro', e.target.value)}
                  InputLabelProps={{ shrink: true }} required={formData.retirado} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required={formData.retirado}>
                  <InputLabel>Motivo de Retiro *</InputLabel>
                  <Select value={formData.motivoRetiro || ''}
                    onChange={(e) => handleFormChange('motivoRetiro', e.target.value)}
                    label="Motivo de Retiro *" sx={selectSx}>
                    <MenuItem value="Terminación de contrato">Terminación de contrato</MenuItem>
                    <MenuItem value="Retiro voluntario">Retiro voluntario</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </>
      )}

      {/* ═══════════ INFORMACIÓN BANCARIA ═══════════ */}
      <SectionHeader icon={<AccountBalanceIcon sx={{ fontSize: 18 }} />} label="Información Bancaria" />

      <Grid item xs={12} sm={6}>
        <Autocomplete fullWidth freeSolo options={BANCOS_COLOMBIA} value={formData.banco}
          onChange={(e, v) => handleFormChange('banco', v || '')}
          onInputChange={(e, v) => handleFormChange('banco', v)}
          renderInput={(params) => <TextField {...params} label="Banco" sx={inputSx} />} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <FormControl fullWidth>
          <InputLabel>Tipo de Cuenta</InputLabel>
          <Select value={formData.tipoCuenta}
            onChange={(e) => handleFormChange('tipoCuenta', e.target.value)}
            label="Tipo de Cuenta" sx={selectSx}>
            <MenuItem value="Ahorros">Ahorros</MenuItem>
            <MenuItem value="Corriente">Corriente</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField fullWidth label="Número de Cuenta" value={formData.numeroCuenta}
          onChange={(e) => handleFormChange('numeroCuenta', e.target.value)} sx={inputSx} />
      </Grid>

      {/* Certificado Bancario */}
      <FileUploadZone
        inputId={`certificado-upload${idSuffix}`}
        accept="application/pdf"
        file={certificadoFile}
        onFileChange={setCertificadoFile}
        label="Subir Certificado Bancario (PDF)"
        existingUrl={selectedEmpleado?.certificadoBancarioURL}
        dragOver={dragOverCertificado}
        onDragOver={(e) => handleDragOver(e, 'certificado')}
        onDragLeave={(e) => handleDragLeave(e, 'certificado')}
        onDrop={(e) => handleDrop(e, 'certificado', ['application/pdf'])}
        uploading={uploadingCertificado}
        onViewExisting={() => onViewFile?.(selectedEmpleado?.certificadoBancarioURL, 'Certificado Bancario')}
        onDeleteExisting={() => onDeleteFile?.('certificadoBancarioURL', selectedEmpleado?.certificadoBancarioURL)}
        mode={mode}
      />
    </Grid>
  );
};

export default EmpleadoForm;
