import React, { createContext, useContext, useState } from 'react';
import AuthModal from '@/components/AuthModal';

type AuthModalContextType = {
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  isOpen: boolean;
};

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<'login' | 'signup'>('login');

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setInitialMode(mode);
    setIsOpen(true);
  };
  const closeAuthModal = () => setIsOpen(false);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isOpen }}>
      {children}
      {/* Render the modal once at top-level */}
      <AuthModal isOpen={isOpen} onClose={closeAuthModal} />
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
};
