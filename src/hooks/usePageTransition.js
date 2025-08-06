import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const navigateWithTransition = useCallback((path, delay = 300) => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      navigate(path);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, delay);
  }, [navigate]);

  return {
    isTransitioning,
    navigateWithTransition,
    setIsTransitioning,
  };
};

export default usePageTransition;
