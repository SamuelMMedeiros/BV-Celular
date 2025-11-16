//
// === CÓDIGO COMPLETO PARA: src/hooks/useAuthAdmin.ts ===
//
import { useContext } from 'react';
// Importa o Contexto (mas não o Provider) do arquivo original
import { AuthContext } from '@/contexts/AuthContext';

// Este é o hook que estava no final do AuthContext.tsx
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};