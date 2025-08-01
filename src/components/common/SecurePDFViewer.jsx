import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Toolbar,
  ButtonGroup,
  Button
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  NavigateBefore,
  NavigateNext,
  FirstPage,
  LastPage
} from '@mui/icons-material';

/**
 * SecurePDFViewer - Visor de PDF seguro sin opciones de descarga
 * Utiliza PDF.js para renderizar PDFs sin mostrar controles nativos del navegador
 * 
 * Props:
 * - url: URL del PDF a mostrar
 * - height: Altura del visor (default: 500px)
 * - allowControls: Si se muestran controles de navegación (default: true)
 * - onError: Callback para manejar errores
 */
const SecurePDFViewer = ({ 
  url, 
  height = 500, 
  allowControls = true, 
  onError 
}) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);

  // Cargar PDF.js de forma dinámica
  useEffect(() => {
    const loadPDFJS = async () => {
      try {
        // Cargar PDF.js desde CDN
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            loadPDF();
          };
          script.onerror = () => {
            setError('Error al cargar el visor de PDF');
            setLoading(false);
            onError?.('Error loading PDF.js');
          };
          document.head.appendChild(script);
        } else {
          loadPDF();
        }
      } catch (err) {
        setError('Error al inicializar el visor de PDF');
        setLoading(false);
        onError?.(err);
      }
    };

    if (url) {
      loadPDFJS();
    }
  }, [url]);

  // Cargar el documento PDF
  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      const loadingTask = window.pdfjsLib.getDocument({
        url: url,
        // Configuraciones de seguridad
        disableAutoFetch: false,
        disableStream: false,
        disableRange: false
      });

      const pdfDoc = await loadingTask.promise;
      setPdf(pdfDoc);
      setPageCount(pdfDoc.numPages);
      setPageNum(1);
      setLoading(false);
      
      // Renderizar la primera página
      renderPage(pdfDoc, 1);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Error al cargar el documento PDF');
      setLoading(false);
      onError?.(err);
    }
  };

  // Renderizar una página específica
  const renderPage = async (pdfDoc, pageNumber) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Calcular viewport con escala y rotación
      const viewport = page.getViewport({ 
        scale: scale, 
        rotation: rotation 
      });

      // Configurar canvas
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Renderizar página
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Error al renderizar la página');
    }
  };

  // Efectos para re-renderizar cuando cambian los parámetros
  useEffect(() => {
    if (pdf && pageNum) {
      renderPage(pdf, pageNum);
    }
  }, [pdf, pageNum, scale, rotation]);

  // Controles de navegación
  const goToPage = (newPageNum) => {
    if (newPageNum >= 1 && newPageNum <= pageCount) {
      setPageNum(newPageNum);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const rotateLeft = () => setRotation(prev => (prev - 90) % 360);
  const rotateRight = () => setRotation(prev => (prev + 90) % 360);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: height,
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">
          Cargando documento...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Toolbar de controles */}
      {allowControls && (
        <Toolbar 
          variant="dense" 
          sx={{ 
            backgroundColor: '#f5f5f5',
            borderRadius: '4px 4px 0 0',
            minHeight: 48,
            justifyContent: 'space-between'
          }}
        >
          {/* Navegación de páginas */}
          <ButtonGroup size="small" variant="outlined">
            <IconButton 
              onClick={() => goToPage(1)} 
              disabled={pageNum <= 1}
              size="small"
            >
              <FirstPage />
            </IconButton>
            <IconButton 
              onClick={() => goToPage(pageNum - 1)} 
              disabled={pageNum <= 1}
              size="small"
            >
              <NavigateBefore />
            </IconButton>
            <Button 
              variant="text" 
              size="small"
              sx={{ minWidth: 80, fontSize: '0.875rem' }}
            >
              {pageNum} / {pageCount}
            </Button>
            <IconButton 
              onClick={() => goToPage(pageNum + 1)} 
              disabled={pageNum >= pageCount}
              size="small"
            >
              <NavigateNext />
            </IconButton>
            <IconButton 
              onClick={() => goToPage(pageCount)} 
              disabled={pageNum >= pageCount}
              size="small"
            >
              <LastPage />
            </IconButton>
          </ButtonGroup>

          {/* Controles de zoom y rotación */}
          <ButtonGroup size="small" variant="outlined">
            <IconButton onClick={zoomOut} size="small">
              <ZoomOut />
            </IconButton>
            <Button 
              variant="text" 
              size="small"
              sx={{ minWidth: 60, fontSize: '0.875rem' }}
            >
              {Math.round(scale * 100)}%
            </Button>
            <IconButton onClick={zoomIn} size="small">
              <ZoomIn />
            </IconButton>
            <IconButton onClick={rotateLeft} size="small">
              <RotateLeft />
            </IconButton>
            <IconButton onClick={rotateRight} size="small">
              <RotateRight />
            </IconButton>
          </ButtonGroup>
        </Toolbar>
      )}

      {/* Canvas del PDF */}
      <Box 
        sx={{ 
          height: allowControls ? height - 48 : height,
          overflow: 'auto',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          p: 2,
          border: '1px solid #ddd',
          borderRadius: allowControls ? '0 0 4px 4px' : '4px'
        }}
      >
        <canvas 
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            height: 'auto',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            backgroundColor: 'white'
          }}
        />
      </Box>
    </Box>
  );
};

export default SecurePDFViewer;
