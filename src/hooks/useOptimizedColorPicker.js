import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook personalizado para optimizar el rendimiento de color pickers
 * Implementa debouncing y throttling para evitar actualizaciones excesivas
 */
export const useOptimizedColorPicker = (initialColor, onColorChange, options = {}) => {
  const {
    debounceDelay = 300,     // Delay para debounce (cuando se para de arrastrar)
    throttleDelay = 50,      // Delay para throttle (durante el arrastre)
    enableThrottle = true,   // Habilitar throttling durante el arrastre
    enableDebounce = true    // Habilitar debouncing al final
  } = options;

  const [localColor, setLocalColor] = useState(initialColor);
  const [isDragging, setIsDragging] = useState(false);
  
  const debounceTimeoutRef = useRef(null);
  const throttleTimeoutRef = useRef(null);
  const lastThrottleTime = useRef(0);
  const hasChangedRef = useRef(false);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  // Actualizar color local cuando cambia el color inicial (props)
  useEffect(() => {
    if (!isDragging) {
      setLocalColor(initialColor);
    }
  }, [initialColor, isDragging]);

  // Función throttled para actualizaciones durante el arrastre
  const throttledUpdate = useCallback((color) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastThrottleTime.current;

    if (timeSinceLastUpdate >= throttleDelay) {
      onColorChange(color);
      lastThrottleTime.current = now;
    } else if (enableThrottle) {
      // Programar actualización para el próximo intervalo disponible
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      
      throttleTimeoutRef.current = setTimeout(() => {
        onColorChange(color);
        lastThrottleTime.current = Date.now();
      }, throttleDelay - timeSinceLastUpdate);
    }
  }, [onColorChange, throttleDelay, enableThrottle]);

  // Función debounced para actualización final
  const debouncedUpdate = useCallback((color) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (enableDebounce) {
      debounceTimeoutRef.current = setTimeout(() => {
        onColorChange(color);
        hasChangedRef.current = false;
      }, debounceDelay);
    } else {
      onColorChange(color);
      hasChangedRef.current = false;
    }
  }, [onColorChange, debounceDelay, enableDebounce]);

  // Manejar cambio de color
  const handleColorChange = useCallback((event) => {
    const newColor = event.target.value;
    setLocalColor(newColor);
    hasChangedRef.current = true;

    if (isDragging && enableThrottle) {
      // Durante el arrastre: usar throttling
      throttledUpdate(newColor);
    } else {
      // Cambio discreto o sin throttling: usar debouncing
      debouncedUpdate(newColor);
    }
  }, [isDragging, throttledUpdate, debouncedUpdate, enableThrottle]);

  // Detectar inicio de arrastre
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Detectar fin de arrastre
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    
    // Asegurar que se aplique el último cambio
    if (hasChangedRef.current) {
      // Cancelar throttling pendiente
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      
      // Aplicar cambio final inmediatamente
      onColorChange(localColor);
      hasChangedRef.current = false;
    }
  }, [localColor, onColorChange]);

  // Manejar eventos globales de mouse para detectar fin de arrastre
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        handleMouseUp();
      };

      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchend', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleMouseUp]);

  return {
    color: localColor,
    isDragging,
    handleColorChange,
    handleMouseDown,
    handleMouseUp,
    // Props optimizados para el input
    inputProps: {
      value: localColor,
      onChange: handleColorChange,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onTouchStart: handleMouseDown,
      onTouchEnd: handleMouseUp
    }
  };
};

export default useOptimizedColorPicker;