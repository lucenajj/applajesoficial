import { useMediaQuery } from './useMediaQuery';

/**
 * Hook que fornece estilos de tipografia responsivos com base no tamanho da tela
 * @returns Objeto com estilos de tipografia para diferentes tamanhos de tela
 */
export const useResponsiveTypography = () => {
  const isMobile = useMediaQuery(768);
  const isSmallMobile = useMediaQuery(480);
  
  return {
    h1: {
      fontSize: isSmallMobile ? '1.5rem' : (isMobile ? '1.8rem' : '2.2rem'),
      fontWeight: 700,
      lineHeight: isSmallMobile ? 1.2 : 1.3
    },
    h2: {
      fontSize: isSmallMobile ? '1.3rem' : (isMobile ? '1.5rem' : '1.8rem'),
      fontWeight: 600,
      lineHeight: isSmallMobile ? 1.2 : 1.3
    },
    h3: {
      fontSize: isSmallMobile ? '1.1rem' : (isMobile ? '1.3rem' : '1.5rem'),
      fontWeight: 600,
      lineHeight: 1.3
    },
    h4: {
      fontSize: isSmallMobile ? '1rem' : (isMobile ? '1.1rem' : '1.3rem'),
      fontWeight: 600,
      lineHeight: 1.3
    },
    h5: {
      fontSize: isSmallMobile ? '0.9rem' : (isMobile ? '1rem' : '1.1rem'),
      fontWeight: 600,
      lineHeight: 1.3
    },
    h6: {
      fontSize: isSmallMobile ? '0.85rem' : (isMobile ? '0.9rem' : '1rem'),
      fontWeight: 600,
      lineHeight: 1.3
    },
    subtitle1: {
      fontSize: isSmallMobile ? '0.85rem' : (isMobile ? '0.9rem' : '1rem'),
      lineHeight: 1.5
    },
    subtitle2: {
      fontSize: isSmallMobile ? '0.8rem' : (isMobile ? '0.85rem' : '0.9rem'),
      lineHeight: 1.5
    },
    body1: {
      fontSize: isSmallMobile ? '0.85rem' : (isMobile ? '0.9rem' : '1rem'),
      lineHeight: 1.5
    },
    body2: {
      fontSize: isSmallMobile ? '0.8rem' : (isMobile ? '0.85rem' : '0.9rem'),
      lineHeight: 1.5
    },
    caption: {
      fontSize: isSmallMobile ? '0.7rem' : (isMobile ? '0.75rem' : '0.8rem'),
      lineHeight: 1.4
    },
    button: {
      fontSize: isSmallMobile ? '0.8rem' : (isMobile ? '0.85rem' : '0.9rem'),
      lineHeight: 1.3,
      fontWeight: 500
    },
    table: {
      head: {
        fontSize: isSmallMobile ? '0.8rem' : (isMobile ? '0.85rem' : '0.9rem'),
        fontWeight: 600
      },
      body: {
        fontSize: isSmallMobile ? '0.8rem' : (isMobile ? '0.85rem' : '0.9rem')
      }
    }
  };
}; 