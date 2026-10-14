import { useContext } from 'react';
import { SnackbarContext, type SnackbarContextValue } from '../context/SnackbarContext';

export const useSnackbar = (): SnackbarContextValue => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar deve ser usado dentro de SnackbarProvider');
  return context;
};
