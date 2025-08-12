import { Add, Edit, Save, Notifications, FavoriteBorder, Favorite, BookmarkBorder, Bookmark, VisibilityOff, Visibility, Star, CheckCircle, Warning, Error, Info, TrendingUp, Close, Home, Menu, Search, ArrowBack, MoreVert, MoreHoriz, Delete, Share, Print, Business, People, Assignment, AttachMoney, Analytics, Mail, Dashboard, Settings, Today, Lock, LockOpen, Security, Refresh, Cancel, Event, FilterList, CloudDownload, Sort } from '@mui/icons-material';
import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Grid,
  Paper,
  IconButton,
  Button,
  Chip,
  Divider,
  Tooltip,
  LinearProgress,
  CircularProgress,
  Badge,
  Fab,
  GlobalStyles
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
// (Consolidated single import for all icons above)
import { motion } from 'framer-motion';

/**
 * DesignSystemTemplatePage
 * Clon independiente SIN USO DE TOKENS (solo MUI + constantes locales).
 * Objetivo: servir como baseline comparativa y sandbox puro.
 */

// Gradientes locales (copiados de gradientTokens V2 – no se importan tokens)
const gradients = {
  primary: { full: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', soft: 'linear-gradient(135deg, #8899f233 0%, #8d6fb844 100%)' },
  secondary: { full: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', soft: 'linear-gradient(135deg, #f3b8fd33 0%, #f7797f44 100%)' },
  success: { full: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', soft: 'linear-gradient(135deg, #6fb9fe33 0%, #33f2fe44 100%)' },
  warning: { full: 'linear-gradient(135deg, #ffb347 0%, #ffcc33 100%)', soft: 'linear-gradient(135deg, #ffc56f33 0%, #ffe06644 100%)' },
  error: { full: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', soft: 'linear-gradient(135deg, #ff858533 0%, #f2743f44 100%)' },
  info: { full: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)', soft: 'linear-gradient(135deg, #95c8ff33 0%, #3d9ae644 100%)' },
  dark: { full: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', soft: 'linear-gradient(135deg, #2c3e5033 0%, #3498db44 100%)' }
};

const shadows = {
  soft: '0 4px 20px rgba(0,0,0,0.12)',
  medium: '0 8px 25px rgba(0,0,0,0.15)',
  strong: '0 12px 40px rgba(0,0,0,0.2)'
};

const typographyScale = [
  { key: 'display2xl', label: 'Display 2XL', sample: 'Visión Financiera Consolidada', size: '3.5rem', lh: 1.1, weight: 800, ls: '-0.5px', note: 'Hero' },
  { key: 'displayXl', label: 'Display XL', sample: 'Resumen Ejecutivo Mensual', size: '3rem', lh: 1.12, weight: 800, ls: '-0.5px', note: 'Secciones principales' },
  { key: 'h1', label: 'H1', sample: 'Panel de Indicadores', size: '2.5rem', lh: 1.18, weight: 700, ls: '-0.5px', note: 'Título página' },
  { key: 'h2', label: 'H2', sample: 'Compromisos Activos', size: '2rem', lh: 1.2, weight: 700, ls: '-0.25px', note: 'Subsección' },
  { key: 'h3', label: 'H3', sample: 'Detalle de Pagos', size: '1.75rem', lh: 1.25, weight: 600, ls: '-0.25px', note: 'Bloques' },
  { key: 'h4', label: 'H4', sample: 'Alertas Recientes', size: '1.5rem', lh: 1.28, weight: 600, ls: '-0.25px', note: 'Widget' },
  { key: 'h5', label: 'H5', sample: 'Total Vencido', size: '1.25rem', lh: 1.32, weight: 600, ls: '-0.15px', note: 'Titular compacto' },
  { key: 'h6', label: 'H6', sample: 'Meta de Cobranza', size: '1.125rem', lh: 1.35, weight: 600, ls: '-0.15px', note: 'Etiqueta' },
  { key: 'bodyLg', label: 'Body L', sample: 'Texto descriptivo destacado para paneles explicativos o resúmenes ejecutivos.', size: '1.125rem', lh: 1.55, weight: 400, ls: '0', note: 'Párrafo destacado' },
  { key: 'body', label: 'Body', sample: 'Texto base para la mayoría de contenidos y listados con buena legibilidad.', size: '1rem', lh: 1.55, weight: 400, ls: '0', note: 'Base' },
  { key: 'bodySm', label: 'Body S', sample: 'Texto secundario o densidad alta en tablas.', size: '0.875rem', lh: 1.5, weight: 400, ls: '0', note: 'Secundario' },
  { key: 'label', label: 'Label', sample: 'Etiqueta de campo / filtro', size: '0.8125rem', lh: 1.35, weight: 500, ls: '0.5px', note: 'Form labels' },
  { key: 'overline', label: 'Overline', sample: 'CATEGORÍA / AGRUPADOR', size: '0.6875rem', lh: 1.3, weight: 600, ls: '0.12em', note: 'Agrupador' },
  { key: 'caption', label: 'Caption', sample: 'Texto auxiliar y notas contextuales.', size: '0.75rem', lh: 1.4, weight: 400, ls: '0', note: 'Notas' },
  { key: 'code', label: 'Code', sample: 'payment.status === "late"', size: '0.8125rem', lh: 1.45, weight: 500, ls: '0', mono: true, note: 'Snippets' },
  { key: 'numeric', label: 'Numeric', sample: '1,254,890.55', size: '1.25rem', lh: 1.2, weight: 600, ls: '0', note: 'KPIs' }
];

const tabsConfig = [
  { id: 'colors', label: 'Colores y Gradientes', icon: <Dashboard /> },
  { id: 'typography', label: 'Tipografía', icon: <Analytics /> },
  { id: 'icons', label: 'Iconos', icon: <Star /> },
  { id: 'headers', label: 'Headers', icon: <Business /> },
  { id: 'buttons', label: 'Botones', icon: <Settings /> },
  { id: 'cards', label: 'Cards y Contenedores', icon: <Business /> },
  { id: 'tables', label: 'Tablas', icon: <Analytics /> },
  { id: 'forms', label: 'Formularios', icon: <Edit /> },
  { id: 'modals', label: 'Modales y Diálogos', icon: <Info /> },
  { id: 'data-display', label: 'Data Display', icon: <People /> },
  { id: 'loading', label: 'Estados de Carga', icon: <TrendingUp /> },
  { id: 'animations', label: 'Animaciones', icon: <Star /> },
  { id: 'feedback', label: 'Feedback', icon: <Notifications /> }
];

const sectionFade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' }
};

function DesignSystemTemplatePage() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('colors');
  const [openDialog, setOpenDialog] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const handleTabChange = (_e, v) => setActiveTab(v);

  const renderColors = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>🎨 Colores y Gradientes (Local)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Esta sección usa constantes locales. No depende de designTokens / tokenUtils.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Gradientes Full & Soft</Typography>
            <Grid container spacing={2}>
              {Object.entries(gradients).map(([key, val]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Box sx={{ height: 90, borderRadius: 2, mb: 1, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:600, fontSize:15, background: val.full, boxShadow: shadows.soft }}>
                    {key} full
                  </Box>
                  <Box sx={{ height: 64, borderRadius: 2, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:500, fontSize:12, background: val.soft }}>
                    {key} soft
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display:'block' }}>
              Copiados de Gradients V2. Ajusta aquí para comparar efectos sin afectar tokens globales.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Palette del Tema MUI</Typography>
            <Grid container spacing={2}>
              {['primary','secondary','success','warning','error','info'].map(p => (
                <Grid item xs={12} sm={6} md={2} key={p}>
                  <Box sx={{ height: 72, borderRadius: 2, backgroundColor: theme.palette[p].main, color: theme.palette[p].contrastText, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, textTransform:'capitalize', mb:1 }}>
                    {p}
                  </Box>
                  <Typography variant="caption" display="block" align="center">{theme.palette[p].main}</Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  const renderTypography = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>📝 Tipografía (Local)</Typography>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p:3 }}>
            <Typography variant="h6" gutterBottom>Escala Propuesta</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}>Representación textual sin tokens. Ajusta manualmente.</Typography>
            {typographyScale.map(row => (
              <Box key={row.key} sx={{ display:'flex', flexDirection:{ xs:'column', sm:'row' }, alignItems:{ sm:'flex-end'}, gap:1.5, py:1.2, borderBottom:'1px solid', borderColor:'divider' }}>
                <Box sx={{ flex:1, fontSize: row.size, lineHeight: row.lh, fontWeight: row.weight, letterSpacing: row.ls, fontFamily: row.mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined }}>
                  {row.sample}
                </Box>
                <Box sx={{ minWidth: 210, fontSize:'0.7rem', color:'text.secondary', display:'flex', flexDirection:'column', gap:0.4 }}>
                  <Box><strong>{row.label}</strong> <span style={{ opacity:0.7}}>({row.key})</span></Box>
                  <Box>Size: {row.size} • LH: {row.lh} • W: {row.weight}</Box>
                  <Box>LS: {row.ls} {row.mono ? '• Mono' : ''} {row.note && <span style={{ opacity:0.65 }}>• {row.note}</span>}</Box>
                </Box>
              </Box>
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ mt:2, display:'block' }}>Próximo: mover a theme.typography + variants personalizadas.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  const renderIcons = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>🎯 Iconos (Paridad Completa)</Typography>
        </Grid>
        {/* Navegación */}
        <Grid item xs={12}>
          <Paper sx={{ p:3 }}>
            <Typography variant="h6" gutterBottom>Iconos de Navegación</Typography>
            <Grid container spacing={2}>
              {[
                { icon:<Dashboard />, name:'Dashboard' },
                { icon:<Home />, name:'Home' },
                { icon:<Menu />, name:'Menu' },
                { icon:<Search />, name:'Search' },
                { icon:<ArrowBack />, name:'Back' },
                { icon:<MoreVert />, name:'More Vertical' },
                { icon:<MoreHoriz />, name:'More Horizontal' },
                { icon:<Close />, name:'Close' }
              ].map(({icon,name}) => (
                <Grid item xs={6} sm={4} md={3} key={name}>
                  <motion.div whileHover={{ scale:1.01, y:-1 }} whileTap={{ scale:0.99 }} transition={{ duration:0.2, ease:'easeOut' }}>
                    <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', p:1.5, border:'1px solid', borderColor:'divider', borderRadius:1.5, cursor:'pointer', minHeight:60, transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)', bgcolor:'background.paper', '&:hover':{ borderColor:'primary.main', bgcolor:'action.hover', color:'primary.main', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' } }}>
                      {React.cloneElement(icon, { sx:{ fontSize:20, transition:'all 0.2s ease', mb:0.5 } })}
                      <Typography variant="caption" sx={{ textAlign:'center', fontWeight:500, fontSize:'0.7rem', transition:'all 0.2s ease', lineHeight:1.2 }}>{name}</Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        {/* Acción */}
        <Grid item xs={12}>
          <Paper sx={{ p:3 }}>
            <Typography variant="h6" gutterBottom>Iconos de Acción</Typography>
            <Grid container spacing={2}>
              {[
                { icon:<Add />, name:'Add', color:'success.main' },
                { icon:<Edit />, name:'Edit', color:'primary.main' },
                { icon:<Delete />, name:'Delete', color:'error.main' },
                { icon:<Save />, name:'Save', color:'success.main' },
                { icon:<Cancel />, name:'Cancel', color:'error.main' },
                { icon:<Share />, name:'Share', color:'info.main' },
                { icon:<Print />, name:'Print', color:'text.secondary' },
                { icon:<Refresh />, name:'Refresh', color:'info.main' }
              ].map(({icon,name,color}) => (
                <Grid item xs={6} sm={4} md={3} key={name}>
                  <motion.div whileHover={{ scale:1.03, y:-2 }} whileTap={{ scale:0.98 }} transition={{ duration:0.2, ease:'easeOut' }}>
                    <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', p:2, border:'2px solid', borderColor:color, borderRadius:2, cursor:'pointer', color:color, transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)', '&:hover':{ bgcolor:color, color:'#fff', boxShadow:`0 6px 16px ${color}30` } }}>
                      {React.cloneElement(icon, { sx:{ fontSize:26 } })}
                      <Typography variant="caption" sx={{ mt:1, textAlign:'center', fontWeight:500 }}>{name}</Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        {/* Estado / Feedback */}
        <Grid item xs={12}>
          <Paper sx={{ p:3 }}>
            <Typography variant="h6" gutterBottom>Iconos de Estado y Feedback</Typography>
            <Grid container spacing={2}>
              {[
                { icon:<CheckCircle />, name:'Success', color:'success.main' },
                { icon:<Warning />, name:'Warning', color:'warning.main' },
                { icon:<Error />, name:'Error', color:'error.main' },
                { icon:<Info />, name:'Info', color:'info.main' },
                { icon:<Notifications />, name:'Notifications', color:'primary.main' },
                { icon:<Security />, name:'Security', color:'error.main' },
                { icon:<Lock />, name:'Lock', color:'warning.main' },
                { icon:<LockOpen />, name:'Unlock', color:'success.main' }
              ].map(({icon,name,color}) => (
                <Grid item xs={6} sm={4} md={3} key={name}>
                  <motion.div whileHover={{ scale:1.04, y:-3 }} whileTap={{ scale:0.96 }} animate={{ rotate: name==='Notifications' ? [0,3,-3,0] : 0 }} transition={{ rotate:{ duration:3, repeat:Infinity, repeatDelay:4, ease:'easeInOut' }, scale:{ duration:0.2, ease:'easeOut' }, y:{ duration:0.3, ease:'easeOut' } }}>
                    <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', p:2, borderRadius:2, background:`${color}15`, color:color, cursor:'pointer', transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)', '&:hover':{ background:`${color}25`, color:color, boxShadow:`0 8px 20px ${color}40`, transform:'translateY(-2px)' } }}>
                      {React.cloneElement(icon, { sx:{ fontSize:30 } })}
                      <Typography variant="caption" sx={{ mt:1, textAlign:'center', fontWeight:500 }}>{name}</Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        {/* Empresariales */}
        <Grid item xs={12}>
          <Paper sx={{ p:3 }}>
            <Typography variant="h6" gutterBottom>Iconos Empresariales</Typography>
            <Grid container spacing={2}>
              {[
                { icon:<Business />, name:'Empresas', color:'primary.main' },
                { icon:<AttachMoney />, name:'Dinero', color:'success.main' },
                { icon:<Analytics />, name:'Analytics', color:'info.main' },
                { icon:<TrendingUp />, name:'Trending', color:'success.main' },
                { icon:<People />, name:'Usuarios', color:'secondary.main' },
                { icon:<Assignment />, name:'Compromisos', color:'warning.main' },
                { icon:<Today />, name:'Calendar', color:'info.main' },
                { icon:<Event />, name:'Events', color:'secondary.main' }
              ].map(({icon,name,color},idx) => (
                <Grid item xs={6} sm={4} md={3} key={name}>
                  <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:idx*0.05, duration:0.3, ease:'easeOut' }} whileHover={{ scale:1.02, y:-2 }} whileTap={{ scale:0.98 }}>
                    <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', p:2, borderRadius:2, background:`${color}08`, color:color, cursor:'pointer', border:`1px solid ${color}20`, transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', '&:hover':{ background:`${color}15`, color:color, borderColor:`${color}40`, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', transform:'translateY(-2px)' } }}>
                      <motion.div whileHover={{ scale:1.05 }} transition={{ duration:0.2, ease:'easeOut' }}>
                        {React.cloneElement(icon, { sx:{ fontSize:28, mb:1, transition:'all 0.25s ease' } })}
                      </motion.div>
                      <Typography variant="caption" sx={{ textAlign:'center', fontWeight:500, fontSize:'0.75rem', transition:'all 0.25s ease' }}>{name}</Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        {/* Interactivos */}
        <Grid item xs={12}>
          <Paper sx={{ p:3 }}>
            <Typography variant="h6" gutterBottom>Iconos Interactivos</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Toggle Icons</Typography>
                <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
                  {[<FavoriteBorder/>,<Favorite/>,<BookmarkBorder/>,<Bookmark/>,<VisibilityOff/>,<Visibility/>].map((ic,idx)=> (
                    <motion.div key={idx} whileHover={{ scale:1.2 }} whileTap={{ scale:0.9 }}>
                      <IconButton color={idx%2===0?'primary':'error'}>{ic}</IconButton>
                    </motion.div>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Floating Action Buttons</Typography>
                <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
                  <motion.div whileHover={{ scale:1.05, y:-1 }} whileTap={{ scale:0.95 }}>
                    <Fab size="small" color="primary" sx={{ width:40, height:40, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', '&:hover':{ boxShadow:'0 4px 12px rgba(0,0,0,0.15)' } }}><Add sx={{ fontSize:18 }} /></Fab>
                  </motion.div>
                  <motion.div whileHover={{ scale:1.05, y:-1 }} whileTap={{ scale:0.95 }}>
                    <Fab size="small" color="secondary" sx={{ width:40, height:40, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', '&:hover':{ boxShadow:'0 4px 12px rgba(0,0,0,0.15)' } }}><Edit sx={{ fontSize:18 }} /></Fab>
                  </motion.div>
                  <motion.div whileHover={{ scale:1.05, y:-1 }} whileTap={{ scale:0.95 }}>
                    <Fab size="small" sx={{ width:40, height:40, background:`linear-gradient(135deg, ${theme.palette.success.main}E6, ${theme.palette.success.main}CC)`, color:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', '&:hover':{ background:`linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`, boxShadow:'0 4px 12px rgba(0,0,0,0.15)' } }}><Save sx={{ fontSize:18 }} /></Fab>
                  </motion.div>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        {/* Tamaños */}
        <Grid item xs={12}>
          <Paper sx={{ p:3 }}>
            <Typography variant="h6" gutterBottom>Tamaños de Iconos</Typography>
            <Box sx={{ display:'flex', gap:3, flexWrap:'wrap', alignItems:'center' }}>
              {[16,20,'24 (default)',32,48,64].map(s => {
                const size = typeof s === 'string' ? parseInt(s) : s;
                return (
                  <Box key={s} sx={{ textAlign:'center' }}>
                    <Star sx={{ fontSize:size, color:'primary.main', mb:1 }} />
                    <Typography variant="caption">{typeof s === 'string' ? `${size}px (default)` : `${s}px`}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  const renderFeedback = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}><Typography variant="h4" gutterBottom>✅ Feedback Empresarial</Typography></Grid>
        {/* Alertas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Alertas / Estados</Typography>
            <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>
              {[{c:'success', icon:<CheckCircle/> , label:'Operación exitosa'}, {c:'info', icon:<Info/>, label:'Dato informativo'}, {c:'warning', icon:<Warning/>, label:'Revisión necesaria'}, {c:'error', icon:<Error/>, label:'Error crítico'}].map(({c,icon,label}) => (
                <Box key={c} sx={{ display:'flex', alignItems:'center', gap:1.2, p:1.4, border:'1px solid', borderColor:`${c}.main`, borderRadius:2, bgcolor:`${c}.light + '20'` }}>
                  {React.cloneElement(icon, { sx:{ color:`${c}.main`, fontSize:22 } })}
                  <Typography variant="body2" sx={{ fontWeight:500 }}>{label}</Typography>
                  <Chip size="small" label={c} color={c} variant="outlined" sx={{ ml:'auto' }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        {/* Progresos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Progresos</Typography>
            <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight:500, mb:0.5, display:'block' }}>Carga General</Typography>
                <LinearProgress color="primary" variant="determinate" value={65} sx={{ height:6, borderRadius:3 }} />
              </Box>
              <Box sx={{ display:'flex', gap:3, alignItems:'center' }}>
                {[{c:'primary', v:70},{c:'success', v:90},{c:'warning', v:45}].map(({c,v}) => (
                  <Box key={c} sx={{ textAlign:'center' }}>
                    <CircularProgress variant="determinate" value={v} color={c} size={56} thickness={5} />
                    <Typography variant="caption" sx={{ mt:0.5, display:'block', fontWeight:500 }}>{c}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
        {/* Chips & Badges */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Chips & Badges</Typography>
            <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
              <Chip label="Primary" color="primary" />
              <Chip label="Secondary" color="secondary" />
              <Chip label="Success" color="success" />
              <Chip label="Warning" color="warning" />
              <Chip label="Error" color="error" />
              <Chip label="Info" color="info" />
              <Chip label="Outlined" variant="outlined" color="primary" />
              <Badge badgeContent={4} color="error"><Notifications /></Badge>
              <Badge badgeContent={12} color="primary"><Mail /></Badge>
              <Badge variant="dot" color="success"><Notifications /></Badge>
            </Box>
          </Paper>
        </Grid>
        {/* Tooltips */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Tooltips</Typography>
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              <Tooltip title="Tooltip Default"><Button size="small" variant="outlined">Default</Button></Tooltip>
              <Tooltip title="Información" placement="right"><Button size="small" variant="outlined">Right</Button></Tooltip>
              <Tooltip title="Detalle adicional" placement="bottom"><Button size="small" variant="outlined">Bottom</Button></Tooltip>
              <Tooltip title="Ver más" placement="left"><Button size="small" variant="outlined">Left</Button></Tooltip>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  // ===== HEADERS =====
  const renderHeaders = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>📱 Headers</Typography>
        </Grid>

        {/* 1. Header Principal de Dashboard */}
        <Grid item xs={12}>
          <Box sx={{ mb:2 }}>
            <Typography variant="h6" color="primary.main" gutterBottom>📊 Header Principal de Dashboard</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}><strong>Uso:</strong> Header principal para el dashboard de DR Group con navegación, búsqueda, notificaciones y estado.</Typography>
          </Box>
          <Paper sx={{ overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', borderRadius:2 }}>
            <Box sx={{ p:2.5, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:2, borderBottom:'1px solid', borderColor:'divider' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
                <motion.div whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>
                  <IconButton size="medium" sx={{ color:'text.primary', '&:hover':{ bgcolor:'action.hover', color:'primary.main' } }}><Menu /></IconButton>
                </motion.div>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight:600, mb:0.3 }}>DR Group Dashboard</Typography>
                  <Typography variant="caption" sx={{ color:'text.secondary', fontWeight:500 }}>Sistema Empresarial</Typography>
                </Box>
              </Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <IconButton sx={{ color:'text.secondary', '&:hover':{ bgcolor:'action.hover', color:'primary.main' }}}><Search /></IconButton>
                <IconButton sx={{ '&:hover':{ bgcolor:'action.hover' }}}><Badge badgeContent={3} color="error"><Notifications /></Badge></IconButton>
                <IconButton sx={{ color:'text.secondary', '&:hover':{ bgcolor:'action.hover', color:'primary.main' }}}><MoreVert /></IconButton>
              </Box>
            </Box>
            <Box sx={{ p:1.5, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:3, bgcolor:'grey.50' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:3, flexWrap:'wrap' }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:'success.main' }} />
                  <Typography variant="caption" sx={{ fontWeight:500, color:'text.secondary' }}>Sistema Activo</Typography>
                </Box>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Business sx={{ fontSize:14, color:'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontWeight:500, color:'text.secondary' }}>5 Empresas Conectadas</Typography>
                </Box>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Today sx={{ fontSize:14, color:'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontWeight:500, color:'text.secondary' }}>Agosto 2025</Typography>
                </Box>
              </Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Typography variant="caption" color="text.secondary">Última actualización:</Typography>
                <Typography variant="caption" sx={{ fontWeight:600, color:'primary.main' }}>Hace 2 min</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 2. Header Ejecutivo con Gradiente */}
        <Grid item xs={12}>
          <Box sx={{ mb:2 }}>
            <Typography variant="h6" color="primary.main" gutterBottom>🎨 Header Ejecutivo con Gradiente</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}><strong>Uso:</strong> Reportes directivos y secciones de alta importancia con gradiente corporativo.</Typography>
          </Box>
          <Paper sx={{ overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
            <Box sx={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', p:3, display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', '&::after':{ content:'""', position:'absolute', bottom:0, left:0, right:0, height:'1px', background:'rgba(255,255,255,0.2)' } }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:2.5 }}>
                <IconButton sx={{ color:'#fff', bgcolor:'rgba(255,255,255,0.1)', '&:hover':{ bgcolor:'rgba(255,255,255,0.2)' }}}><ArrowBack /></IconButton>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight:600, mb:0.5 }}>Reporte Ejecutivo</Typography>
                  <Typography variant="body2" sx={{ opacity:0.9 }}>Dashboard de análisis financiero corporativo</Typography>
                </Box>
              </Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:1.5, px:2, py:1, borderRadius:6, bgcolor:'rgba(255,255,255,0.15)', mr:1 }}>
                  <Box sx={{ width:6, height:6, borderRadius:'50%', bgcolor:'#4caf50' }} />
                  <Typography variant="caption" sx={{ color:'#fff', fontWeight:500, fontSize:'0.75rem' }}>En línea</Typography>
                </Box>
                <IconButton sx={{ color:'#fff', '&:hover':{ bgcolor:'rgba(255,255,255,0.1)' }}}><Search /></IconButton>
                <IconButton sx={{ color:'#fff', '&:hover':{ bgcolor:'rgba(255,255,255,0.1)' }}}><Badge badgeContent={2} sx={{ '& .MuiBadge-badge':{ bgcolor:'#ff5722', color:'#fff', fontWeight:600 } }}><Notifications /></Badge></IconButton>
                <Box sx={{ width:36, height:36, bgcolor:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.3)', ml:1, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}><People sx={{ fontSize:20 }} /></Box>
              </Box>
            </Box>
            <Box sx={{ p:2, bgcolor:'grey.50', borderTop:'1px solid', borderColor:'divider' }}>
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:2 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
                  <Chip label="Confidencial" size="small" sx={{ bgcolor:'rgba(37,99,235,0.08)', color:'primary.main', fontWeight:600, fontSize:'0.7rem', border:'1px solid', borderColor:'rgba(37,99,235,0.2)' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight:500 }}>Acceso: Directivos y Gerencia</Typography>
                </Box>
                <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
                  <Typography variant="caption" color="text.secondary">Generado:</Typography>
                  <Typography variant="caption" sx={{ fontWeight:600, color:'primary.main' }}>07 Agosto 2025, 14:30</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 3. Header de Gestión Empresarial */}
        <Grid item xs={12}>
          <Box sx={{ mb:2 }}>
            <Typography variant="h6" color="primary.main" gutterBottom>📋 Header de Gestión Empresarial</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}><strong>Uso:</strong> Módulos operativos con métricas y acciones principales.</Typography>
          </Box>
          <Paper sx={{ overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ p:3, pb:2 }}>Header de Gestión Empresarial</Typography>
            <Box sx={{ px:3, pb:2 }}>
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:2, p:2, bgcolor:'grey.50', border:'1px solid', borderColor:'divider', borderRadius:2, position:'relative' }}>
                <Box sx={{ position:'absolute', top:0, left:0, width:'4px', height:'100%', bgcolor:'primary.main', borderRadius:'0 2px 2px 0' }} />
                <Box sx={{ flex:1, display:'flex', alignItems:'center', gap:3, flexWrap:'wrap', minWidth:300 }}>
                  <Box sx={{ flex:1, minWidth:200 }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}>
                      <Typography variant="caption" sx={{ color:'text.secondary', textTransform:'uppercase', fontWeight:600, letterSpacing:0.5 }}>FINANZAS</Typography>
                      <Typography variant="caption" color="text.secondary">•</Typography>
                      <Typography variant="caption" sx={{ color:'primary.main', fontWeight:600 }}>COMPROMISOS</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight:700, mb:0.5 }}>Compromisos Financieros</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize:'0.85rem' }}>Gestión integral de obligaciones de pago corporativas</Typography>
                  </Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:2.5, flexWrap:'wrap', bgcolor:'background.paper', px:2, py:1, borderRadius:1, border:'1px solid', borderColor:'divider' }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}><Box sx={{ width:6, height:6, borderRadius:'50%', bgcolor:'success.main' }} /><Typography variant="caption" sx={{ fontWeight:600, fontSize:'0.75rem' }}>24</Typography></Box>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}><Box sx={{ width:6, height:6, borderRadius:'50%', bgcolor:'warning.main' }} /><Typography variant="caption" sx={{ fontWeight:600, fontSize:'0.75rem' }}>7</Typography></Box>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}><AttachMoney sx={{ fontSize:12, color:'success.main' }} /><Typography variant="caption" sx={{ fontWeight:600, color:'success.main', fontSize:'0.75rem' }}>$45.2M</Typography></Box>
                  </Box>
                </Box>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Button variant="outlined" size="small" startIcon={<FilterList />} sx={{ borderColor:'divider', color:'text.secondary', fontSize:'0.8rem', '&:hover':{ borderColor:'primary.main', color:'primary.main', bgcolor:'primary.50' } }}>Filtros</Button>
                  <Button variant="contained" size="small" startIcon={<Add />} sx={{ bgcolor:'primary.main', fontSize:'0.8rem', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', '&:hover':{ bgcolor:'primary.dark', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' } }}>Nuevo</Button>
                  <Box sx={{ display:'flex', gap:0.5, ml:1 }}>
                    <IconButton size="small" sx={{ color:'text.secondary', bgcolor:'background.paper', border:'1px solid', borderColor:'divider', width:28, height:28, '&:hover':{ color:'primary.main', borderColor:'primary.main', bgcolor:'primary.50' } }}><CloudDownload sx={{ fontSize:14 }} /></IconButton>
                    <IconButton size="small" sx={{ color:'text.secondary', bgcolor:'background.paper', border:'1px solid', borderColor:'divider', width:28, height:28, '&:hover':{ color:'info.main', borderColor:'info.main', bgcolor:'info.50' } }}><Settings sx={{ fontSize:14 }} /></IconButton>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ px:3, py:2, bgcolor:'background.paper', borderTop:'1px solid', borderColor:'divider' }}>
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:2 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight:500 }}>Vista actual:</Typography>
                  <Chip label="Todos los compromisos" size="small" variant="outlined" sx={{ borderColor:'primary.main', color:'primary.main', bgcolor:'primary.50' }} />
                  <Typography variant="caption" color="text.secondary">•</Typography>
                  <Typography variant="caption" color="text.secondary">Última actualización: hace 2 min</Typography>
                </Box>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Typography variant="caption" color="text.secondary">Ordenar por:</Typography>
                  <Button size="small" endIcon={<Sort sx={{ fontSize:16 }} />} sx={{ minWidth:'auto', color:'text.secondary', '&:hover':{ color:'primary.main', bgcolor:'primary.50' } }}>Fecha venc.</Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 4. Header con Breadcrumbs / Multi-paso */}
        <Grid item xs={12}>
          <Box sx={{ mb:2 }}>
            <Typography variant="h6" color="primary.main" gutterBottom>🧭 Header con Navegación de Migas de Pan</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}><strong>Uso:</strong> Flujos multi-paso con contexto y estado de progreso.</Typography>
          </Box>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6" gutterBottom>Header Navegacional Empresarial</Typography>
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:2, p:2, bgcolor:'grey.50', border:'1px solid', borderColor:'divider', borderRadius:2, position:'relative' }}>
              <Box sx={{ position:'absolute', top:0, left:0, width:'3px', height:'100%', bgcolor:'info.main', borderRadius:'0 1px 1px 0' }} />
              <Box sx={{ flex:1, display:'flex', alignItems:'center', gap:2, minWidth:300 }}>
                <Box sx={{ flex:1 }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.5, fontSize:'0.75rem' }}>
                    <Home sx={{ fontSize:12, color:'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="caption" color="text.secondary">Compromisos</Typography>
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="caption" sx={{ color:'info.main', fontWeight:600 }}>Nuevo</Typography>
                  </Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                    <IconButton size="small" sx={{ bgcolor:'background.paper', border:'1px solid', borderColor:'divider', width:28, height:28, '&:hover':{ borderColor:'info.main', color:'info.main' } }}><ArrowBack sx={{ fontSize:14 }} /></IconButton>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight:700, mb:0.25, fontSize:'1.1rem' }}>Nuevo Compromiso</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.75rem', display:'block' }}>Crear obligación financiera empresarial</Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display:'flex', alignItems:'center', gap:1, bgcolor:'background.paper', px:1.5, py:0.5, borderRadius:1, border:'1px solid', borderColor:'divider' }}>
                  <Box sx={{ width:6, height:6, borderRadius:'50%', bgcolor:'info.main' }} />
                  <Typography variant="caption" sx={{ fontWeight:600, fontSize:'0.7rem' }}>Paso 1 de 3</Typography>
                </Box>
              </Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Button variant="outlined" size="small" sx={{ borderColor:'divider', color:'text.secondary', fontSize:'0.75rem', px:2, '&:hover':{ borderColor:'error.main', color:'error.main', bgcolor:'error.50' } }}>Cancelar</Button>
                <Button variant="contained" size="small" sx={{ bgcolor:'success.main', fontSize:'0.75rem', px:2, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', '&:hover':{ bgcolor:'success.dark', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' } }}>Guardar</Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 5. Header de Dashboard Ejecutivo (gran gradiente) */}
        <Grid item xs={12}>
          <Box sx={{ mb:2 }}>
            <Typography variant="h6" color="primary.main" gutterBottom>📈 Header de Dashboard Ejecutivo</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}><strong>Uso:</strong> Páginas ejecutivas de alto nivel con foco en el título.</Typography>
          </Box>
          <Paper sx={{ overflow:'hidden', background:'linear-gradient(135deg,#4e54c8,#8f94fb)', color:'#fff', borderRadius:2, boxShadow:'0 8px 32px rgba(31,38,135,0.37)', position:'relative', '&::before':{ content:'""', position:'absolute', inset:0, background:'rgba(255,255,255,0.1)' } }}>
            <Box sx={{ p:3, position:'relative', zIndex:1 }}>
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:2 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:2.5, flex:1 }}>
                  <Box sx={{ p:1.5, bgcolor:'rgba(255,255,255,0.2)', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}><Analytics sx={{ fontSize:24 }} /></Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight:700, mb:0.5, letterSpacing:'-0.01em', textShadow:'0 2px 4px rgba(0,0,0,0.2)' }}>Dashboard Ejecutivo</Typography>
                    <Typography variant="subtitle1" sx={{ color:'rgba(255,255,255,0.9)', fontSize:'1rem', fontWeight:500, letterSpacing:'0.005em' }}>Control financiero empresarial con métricas en tiempo real</Typography>
                  </Box>
                </Box>
                <Box sx={{ display:'flex', gap:2 }}>
                  <Button variant="outlined" startIcon={<Refresh />} sx={{ py:1.5, px:3.5, fontSize:'1rem', fontWeight:600, borderRadius:2, border:'2px solid rgba(255,255,255,0.5)', color:'#fff', textTransform:'none', backdropFilter:'blur(10px)', '&:hover':{ background:'rgba(255,255,255,0.15)', borderColor:'rgba(255,255,255,0.8)', transform:'translateY(-2px)' } }}>Actualizar</Button>
                  <IconButton sx={{ color:'#fff', bgcolor:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', width:48, height:48, '&:hover':{ bgcolor:'rgba(255,255,255,0.25)', transform:'translateY(-2px)' } }}><Settings /></IconButton>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 6. Header Móvil Compacto */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb:2 }}>
            <Typography variant="h6" color="primary.main" gutterBottom>📱 Header Móvil Compacto</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}><strong>Uso:</strong> Navegación móvil minimalista con elementos esenciales.</Typography>
          </Box>
          <Paper sx={{ overflow:'hidden', background:'linear-gradient(135deg,#232526,#414345)', color:'#fff', borderRadius:2, boxShadow:'0 4px 16px rgba(31,38,135,0.2)', position:'relative', '&::before':{ content:'""', position:'absolute', inset:0, background:'rgba(255,255,255,0.08)' } }}>
            <Box sx={{ p:2, position:'relative', zIndex:1 }}>
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:2 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                  <IconButton size="small" sx={{ color:'#fff', bgcolor:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:1.5, width:36, height:36, '&:hover':{ bgcolor:'rgba(255,255,255,0.2)' } }}><Menu sx={{ fontSize:18 }} /></IconButton>
                  <Typography variant="h6" sx={{ fontWeight:700, fontSize:'1.125rem', letterSpacing:'0.005em' }}>DR Group</Typography>
                </Box>
                <IconButton size="small" sx={{ color:'#fff', bgcolor:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:1.5, width:36, height:36, '&:hover':{ bgcolor:'rgba(255,255,255,0.2)' } }}>
                  <Badge badgeContent={2} color="error" sx={{ '& .MuiBadge-badge':{ fontSize:'0.625rem', minWidth:16, height:16 } }}><Notifications sx={{ fontSize:18 }} /></Badge>
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 7. Header con Navegación por Pestañas */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb:2 }}>
            <Typography variant="h6" color="primary.main" gutterBottom>📑 Header con Navegación por Pestañas</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}><strong>Uso:</strong> Secciones con múltiples vistas agrupadas.</Typography>
          </Box>
          <Paper sx={{ overflow:'hidden', borderRadius:2, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', border:'1px solid', borderColor:'divider' }}>
            <Box sx={{ p:2.5, borderBottom:'1px solid', borderColor:'divider', background:'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.03) 100%)' }}>
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:2 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:2.5 }}>
                  <Box sx={{ p:1.2, bgcolor:'rgba(102,126,234,0.15)', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}><Analytics sx={{ fontSize:22, color:'primary.main' }} /></Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight:700, mb:0.3 }}>Análisis Financiero</Typography>
                    <Typography variant="caption" sx={{ color:'text.secondary', fontWeight:500 }}>Módulo de reportes</Typography>
                  </Box>
                </Box>
                <IconButton size="small" sx={{ color:'text.secondary', '&:hover':{ color:'primary.main', bgcolor:'primary.50' } }}><MoreVert /></IconButton>
              </Box>
              <Tabs value={0} sx={{ mt:2, '& .MuiTab-root':{ textTransform:'none', fontWeight:500, fontSize:'0.8rem', minHeight:36 }, '& .MuiTabs-indicator':{ height:3, borderRadius:2 } }}>
                <Tab label="Resumen" />
                <Tab label="Gráficos" />
                <Tab label="Reportes" />
                <Tab label="Configuración" />
              </Tabs>
            </Box>
            <Box sx={{ p:2.5, bgcolor:'background.paper' }}>
              <Typography variant="caption" color="text.secondary">Contenido del tab "Resumen" seleccionado</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  // ===== BOTONES =====
  const renderButtons = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}><Typography variant="h4" gutterBottom>🧩 Botones</Typography></Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Variantes Base</Typography>
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              <Button variant="contained">Contained</Button>
              <Button variant="outlined">Outlined</Button>
              <Button variant="text">Text</Button>
              <Button variant="contained" color="success">Success</Button>
              <Button variant="contained" color="warning">Warning</Button>
            </Box>
            <Typography variant="subtitle1" fontWeight={600}>Gradiente</Typography>
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              <Button sx={{ background:gradients.primary.full, color:'#fff', fontWeight:600, '&:hover':{ filter:'brightness(1.05)' }}}>Primary Gradient</Button>
              <Button sx={{ background:gradients.secondary.full, color:'#fff', fontWeight:600, '&:hover':{ filter:'brightness(1.05)' }}}>Secondary Gradient</Button>
              <Button sx={{ background:gradients.success.full, color:'#fff', fontWeight:600, '&:hover':{ filter:'brightness(1.05)' }}}>Success Gradient</Button>
            </Box>
            <Typography variant="subtitle1" fontWeight={600}>Tamaños</Typography>
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              <Button size="small" variant="contained">Small</Button>
              <Button size="medium" variant="contained">Medium</Button>
              <Button size="large" variant="contained">Large</Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Estados & Interacciones</Typography>
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              <Button variant="contained" disabled>Disabled</Button>
              <Button variant="outlined" startIcon={<Add />}>Con Icono</Button>
              <Button variant="contained" endIcon={<Save />}>Guardar</Button>
              <Button variant="contained" color="error" startIcon={<Error />}>Crítico</Button>
              <Button variant="contained" sx={{ position:'relative', overflow:'hidden', background:gradients.info.full, color:'#fff', fontWeight:600, '&:hover':{ background:gradients.info.full }}}>
                Glow
                <Box sx={{ position:'absolute', top:0, left:-100, width:'80%', height:'100%', background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation:'shimmer 2s infinite' }} />
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  // ===== CARDS =====
  const renderCards = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}><Typography variant="h4" gutterBottom>🗂️ Cards y Contenedores</Typography></Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p:2.5, borderRadius:3, boxShadow:shadows.soft, display:'flex', flexDirection:'column', gap:1 }}>
            <Typography variant="overline" sx={{ fontWeight:600, letterSpacing:'0.08em' }}>METRIC</Typography>
            <Typography variant="h6" sx={{ fontWeight:600 }}>Total Pagado</Typography>
            <Typography variant="h4" sx={{ fontWeight:700, background:gradients.success.full, WebkitBackgroundClip:'text', color:'transparent' }}>COP 25M</Typography>
            <Chip label="+12%" size="small" color="success" />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p:2.5, borderRadius:3, position:'relative', overflow:'hidden', background:gradients.primary.soft }}>
            <Box sx={{ position:'absolute', inset:0, backdropFilter:'blur(4px)' }} />
            <Box sx={{ position:'relative', display:'flex', flexDirection:'column', gap:1 }}>
              <Typography variant="overline" sx={{ fontWeight:600 }}>ALERTA</Typography>
              <Typography variant="h6" sx={{ fontWeight:600 }}>Compromisos Vencidos</Typography>
              <Typography variant="h3" sx={{ fontWeight:700 }}>7</Typography>
              <Button size="small" variant="contained">Ver Detalles</Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p:2.5, borderRadius:3, background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)', border:'1px solid', borderColor:'divider', display:'flex', flexDirection:'column', gap:1 }}>
            <Typography variant="overline" sx={{ fontWeight:600 }}>GLASS</Typography>
            <Typography variant="h6" sx={{ fontWeight:600 }}>Liquidez</Typography>
            <Typography variant="body2" color="text.secondary">Ratio de liquidez general del período.</Typography>
            <LinearProgress variant="determinate" value={62} sx={{ height:6, borderRadius:3 }} />
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  // ===== TABLAS ===== (simplificada sin ordenamiento avanzado)
  const sampleRows = [
    { id:1, concepto:'Arriendo', monto:'2,500,000', estado:'Pendiente' },
    { id:2, concepto:'Servicios', monto:'850,000', estado:'Pagado' },
    { id:3, concepto:'Impuestos', monto:'3,200,000', estado:'Vencido' }
  ];
  const renderTables = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}><Typography variant="h4" gutterBottom>📊 Tablas (Placeholder)</Typography></Grid>
        <Grid item xs={12}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Listado Simplificado</Typography>
            <Box sx={{ display:'grid', gridTemplateColumns:'120px 140px 120px', gap:1, fontSize:13, fontWeight:600, color:'text.secondary' }}>
              <Box>Concepto</Box><Box>Monto</Box><Box>Estado</Box>
            </Box>
            {sampleRows.map(r => (
              <Box key={r.id} sx={{ display:'grid', gridTemplateColumns:'120px 140px 120px', gap:1, p:1, borderRadius:1, bgcolor:'grey.50', fontSize:13 }}>
                <Box>{r.concepto}</Box>
                <Box>{r.monto}</Box>
                <Box>
                  <Chip size="small" label={r.estado} color={r.estado==='Pagado'?'success': r.estado==='Vencido'?'error':'warning'} sx={{ height:22 }} />
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  // ===== FORMS (placeholder) =====
  const renderForms = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}><Typography variant="h4" gutterBottom>📝 Formularios (Placeholder)</Typography></Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Principios</Typography>
            <Typography variant="body2" color="text.secondary">Campos consistentes, estados claros, validaciones inmediatas.</Typography>
            <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
              <Box sx={{ p:1.5, border:'1px dashed', borderColor:'divider', borderRadius:2, fontSize:12 }}>Campo Texto</Box>
              <Box sx={{ p:1.5, border:'1px dashed', borderColor:'divider', borderRadius:2, fontSize:12 }}>Select</Box>
              <Box sx={{ p:1.5, border:'1px dashed', borderColor:'divider', borderRadius:2, fontSize:12 }}>Date Picker</Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Estados</Typography>
            <Box sx={{ display:'flex', flexWrap:'wrap', gap:1 }}>
              {['Default','Hover','Focus','Error','Disabled'].map(s => (
                <Chip key={s} label={s} size="small" color={s==='Error'?'error': s==='Focus'?'info': s==='Disabled'? 'default':'success'} variant={s==='Default'?'outlined':'filled'} />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">Implementar versión completa más adelante.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  // ===== MODALS (placeholder) =====
  const renderModals = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}><Typography variant="h4" gutterBottom>🪟 Modales & Diálogos (Placeholder)</Typography></Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Tipos previstos</Typography>
            <Box sx={{ display:'flex', flexDirection:'column', gap:1, fontSize:13 }}>
              <Box>Confirmación</Box>
              <Box>Edición / CRUD</Box>
              <Box>Información crítica</Box>
              <Box>Full-screen wizard</Box>
            </Box>
            <Typography variant="caption" color="text.secondary">Se implementarán con <strong>Dialog</strong> y transiciones motion.</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Estados</Typography>
            <Box sx={{ display:'flex', gap:1.5, flexWrap:'wrap' }}>
              {['Base','Loading','Success','Error'].map(s => <Chip key={s} size="small" label={s} color={s==='Error'?'error': s==='Success'?'success':'info'} />)}
            </Box>
            <Typography variant="caption" color="text.secondary">Placeholder temporal — no hay interacción.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
  // (sections mapping moved below all render* declarations to avoid TDZ errors)

  // ===== DATA DISPLAY =====
  const renderDataDisplay = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}><Typography variant="h4" gutterBottom>📦 Data Display</Typography></Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Chips & Badges</Typography>
            <Box sx={{ display:'flex', gap:1.5, flexWrap:'wrap' }}>
              <Chip label="Activo" color="success" />
              <Chip label="Pendiente" color="warning" />
              <Chip label="Crítico" color="error" />
              <Chip label="Info" color="info" variant="outlined" />
              <Badge color="error" badgeContent={4}><Notifications /></Badge>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>KPIs Rápidos</Typography>
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              {[{l:'Ingresos', v:'85M', g:gradients.success.full},{l:'Gastos', v:'41M', g:gradients.error.full},{l:'Liquidez', v:'62%', g:gradients.info.full}].map(k => (
                <Box key={k.l} sx={{ flex:'1 1 110px', p:1.5, borderRadius:2, background:k.g, color:'#fff', display:'flex', flexDirection:'column', gap:0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight:600 }}>{k.l}</Typography>
                  <Typography variant="h6" sx={{ fontWeight:700 }}>{k.v}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  // ===== LOADING =====
  const renderLoading = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}><Typography variant="h4" gutterBottom>⏳ Estados de Carga</Typography></Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Progress & Skeleton</Typography>
            <LinearProgress variant="indeterminate" />
            <LinearProgress variant="determinate" value={50} color="success" />
            <Box sx={{ display:'flex', gap:3 }}>
              <CircularProgress size={46} />
              <CircularProgress color="success" size={46} thickness={5} />
              <CircularProgress color="warning" size={46} thickness={5} />
            </Box>
            <Box sx={{ display:'flex', gap:2 }}>
              {[1,2,3].map(i => (
                <Box key={i} sx={{ flex:1, height:68, borderRadius:2, position:'relative', overflow:'hidden', background:'linear-gradient(90deg, #eee 0%, #f5f5f5 50%, #eee 100%)', backgroundSize:'200% 100%', animation:'shimmer 2.5s infinite' }} />
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Loader Inline</Typography>
            <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
              <CircularProgress size={22} />
              <Typography variant="body2">Cargando datos financieros...</Typography>
            </Box>
            <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
              <CircularProgress size={22} color="success" />
              <Typography variant="body2">Procesando liquidación...</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  // ===== ANIMACIONES =====
  const renderAnimations = () => (
    <motion.div {...sectionFade}>
      <Grid container spacing={3}>
        <Grid item xs={12}><Typography variant="h4" gutterBottom>🎬 Animaciones</Typography></Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Hover / Tap</Typography>
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              {[gradients.primary.full, gradients.secondary.full, gradients.success.full].map((g,i)=>(
                <motion.div key={i} whileHover={{ scale:1.05, y:-4 }} whileTap={{ scale:0.95 }}>
                  <Box sx={{ width:140, height:80, borderRadius:3, background:g, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:600, boxShadow:shadows.soft }}>
                    Box {i+1}
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, display:'flex', flexDirection:'column', gap:2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Secuencia</Typography>
            <Box sx={{ display:'flex', gap:2 }}>
              {[0,1,2,3].map(i => (
                <motion.div key={i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.15, duration:0.4, ease:'easeOut' }}>
                  <Box sx={{ width:70, height:70, borderRadius:2, background:gradients.info.soft, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600 }}>#{i+1}</Box>
                </motion.div>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  // ===== SECTIONS MAP (after all render* functions defined) =====
  const sections = {
    colors: renderColors,
    typography: renderTypography,
    icons: renderIcons,
    headers: renderHeaders,
    buttons: renderButtons,
    cards: renderCards,
    tables: renderTables,
    forms: renderForms,
    modals: renderModals,
    data: renderDataDisplay,
    loading: renderLoading,
    animations: renderAnimations,
    feedback: renderFeedback
  };

  // ===== MAPEO TAB -> SECTIONS KEY =====
  const tabKeyMap = { 'data-display': 'data' };

  // ===== RETURN PRINCIPAL DEL COMPONENTE =====
  const CurrentSection = sections[tabKeyMap[activeTab] || activeTab] || (() => <Box p={2}>Sección no encontrada</Box>);

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <GlobalStyles styles={{
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' }
        }
      }} />
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Design System Template (Clon Independiente)</Typography>
        <Typography variant="body2" color="text.secondary">Página clon sin tokens. Cada sección replica estilos base manualmente.</Typography>
      </Box>
      <Paper sx={{ mb: 4, p: 1.5, borderRadius: 3, boxShadow: '0 4px 18px rgba(0,0,0,0.08)' }}>
        <Tabs
          value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                alignItems: 'center',
                gap: 0.75,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                minHeight: 42,
                letterSpacing: 0.3,
                px: 2.25,
                borderRadius: 2,
                transition: 'all .35s cubic-bezier(.4,0,.2,1)'
              },
              '& .MuiTab-root.Mui-selected': {
                background: 'linear-gradient(135deg, #667eea22, #764ba222)',
                color: 'primary.main'
              },
              '& .MuiTabs-indicator': { height: 0 }
            }}
        >
          {tabsConfig.map(t => (
            <Tab key={t.id} value={t.id} iconPosition="start" icon={t.icon} label={t.label} />
          ))}
        </Tabs>
      </Paper>
      <Box>
        <CurrentSection />
      </Box>
    </Box>
  );

}
export default DesignSystemTemplatePage;

