import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar se a tela está abaixo de um determinado tamanho
 * @param width Largura máxima em pixels para considerar que a consulta corresponde
 * @returns boolean indicando se a tela é menor que a largura especificada
 */
export const useMediaQuery = (width: number): boolean => {
  const [matches, setMatches] = useState(window.innerWidth < width);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${width}px)`);
    const handleResize = () => setMatches(mediaQuery.matches);
    
    // Verificar inicialmente
    setMatches(mediaQuery.matches);
    
    // Adicionar listener para mudanças
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleResize);
      return () => mediaQuery.removeEventListener('change', handleResize);
    } else {
      // Fallback para navegadores mais antigos
      mediaQuery.addListener(handleResize);
      return () => mediaQuery.removeListener(handleResize);
    }
  }, [width]);

  return matches;
}; 