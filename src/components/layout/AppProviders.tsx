"use client";

import React, { createContext, useContext, useState } from "react";
import Navbar from "./Navbar";
import AuthModal from "../ui/AuthModal";

interface AuthContextType {
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export const useAuthModal = () => useContext(AuthContext);

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const openAuthModal = (mode: "login" | "signup" = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {/* Global Navbar with modal opener */}
      <Navbar onOpenAuth={openAuthModal} />

      {/* Main Content */}
      {children}

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authMode}
      />
    </AuthContext.Provider>
  );
}
