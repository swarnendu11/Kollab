"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  setUpRecaptcha,
  sendPhoneOtp,
  confirmPhoneOtp,
  signOutUser,
  subscribeToAuth,
} from "@/lib/firebase/auth";

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  sendPhoneCode: (phoneNumber: string, containerId: string) => Promise<ConfirmationResult>;
  verifyPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<User>;
  logout: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    return await signInWithEmail(email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    return await signUpWithEmail(email, pass, name);
  };

  const loginWithGoogle = async () => {
    return await signInWithGoogle();
  };

  const sendPhoneCode = async (phoneNumber: string, containerId: string) => {
    const verifier = setUpRecaptcha(containerId);
    return await sendPhoneOtp(phoneNumber, verifier);
  };

  const verifyPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    return await confirmPhoneOtp(confirmationResult, code);
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        sendPhoneCode,
        verifyPhoneCode,
        logout,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
}
