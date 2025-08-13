import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Box } from '@mui/material';

/**
 * Virtual Scrolling Component - Optimización Firebase FASE 2
 * Renderiza solo elementos visibles para reducir carga y consultas
 * 
 * @param {Array} items - Lista de elementos a virtualizar
 * @param {number} itemHeight - Altura fija de cada elemento
 * @param {number} containerHeight - Altura del contenedor
 * @param {Function} renderItem - Función para renderizar cada item
 * @param {number} overscan - Elementos adicionales a renderizar fuera del viewport (default: 5)
 */
const VirtualScrollList = ({ 
  items, 
  itemHeight = 120, 
  containerHeight = 600, 
  renderItem, 
  overscan = 5,
  onEndReached,
  endThreshold = 0.8
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // 🎯 Calcular elementos visibles
  const visibleRange = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex,
      endIndex,
      totalHeight,
      visibleItems: items.slice(startIndex, endIndex + 1)
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  // 🎯 Detectar scroll para lazy loading
  const handleScroll = useCallback((e) => {
    const { scrollTop: currentScrollTop, scrollHeight, clientHeight } = e.target;
    setScrollTop(currentScrollTop);

    // 📊 Trigger para cargar más elementos
    if (onEndReached) {
      const scrollPercentage = (currentScrollTop + clientHeight) / scrollHeight;
      if (scrollPercentage >= endThreshold) {
        onEndReached();
      }
    }
  }, [onEndReached, endThreshold]);

  // 🎯 Estilos optimizados
  const containerStyle = {
    height: containerHeight,
    overflow: 'auto',
    position: 'relative'
  };

  const contentStyle = {
    height: visibleRange.totalHeight,
    position: 'relative'
  };

  const visibleContentStyle = {
    transform: `translateY(${visibleRange.startIndex * itemHeight}px)`,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0
  };

  return (
    <Box 
      ref={containerRef}
      sx={containerStyle}
      onScroll={handleScroll}
    >
      <div style={contentStyle}>
        <div style={visibleContentStyle}>
          {visibleRange.visibleItems.map((item, index) => (
            <div
              key={item.id || visibleRange.startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </Box>
  );
};

export default VirtualScrollList;
