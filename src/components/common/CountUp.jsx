import React, { useState, useEffect } from 'react';

export const CountUp = ({ value, duration = 2000, format = false }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = Date.now();
    const endValue = value || 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.floor(endValue * easeOut);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  if (format) {
    return displayValue.toLocaleString();
  }

  return displayValue;
};
