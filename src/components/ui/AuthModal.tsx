"use client";

import React, { useState } from "react";
import { X, Sparkles, Lock, Mail, User, ArrowRight, ShieldCheck, Check } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
  onSuccess?: (user: any) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = mode === "signup" ? { email, password, name } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onSuccess?.(data.user);
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      // 1. Try Google Identity direct prompt or redirect
      const googleEmail = prompt("Enter your Google Account email to continue with Google:", "solankeshivanand7@gmail.com");
      if (!googleEmail) {
        setGoogleLoading(false);
        return;
      }

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail.trim(),
          name: googleEmail.split("@")[0],
          avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google Sign-In failed");
      }

      onSuccess?.(data.user);
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickDemo = (role: "user" | "admin") => {
    setEmail(role === "admin" ? "admin@shivai.com" : "creator@shivai.com");
    setPassword(role === "admin" ? "ShivAdmin2026!" : "demo1234");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl glass-card-glow border border-indigo-500/30 text-white shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 mx-auto mb-3 shadow-neon-purple">
            <div className="w-full h-full bg-[#070b1e] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-pink-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">
            {mode === "signup" ? "Join Shiv AI Universe" : "Welcome Back Creator"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === "signup"
              ? "Get 50 free credits every single day to bring your imagination to life."
              : "Sign in to access your creations, prompt history, and daily credits."}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 bg-[#090e24] rounded-xl border border-indigo-500/20 mb-4">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "login"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "signup"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full py-2.5 px-4 mb-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md disabled:opacity-50"
        >
          {/* Google Color SVG Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleLoading ? "Signing in with Google..." : "Continue with Google"}</span>
        </button>

        <div className="relative flex py-2 items-center mb-3">
          <div className="flex-grow border-t border-indigo-500/15" />
          <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase">Or with Email</span>
          <div className="flex-grow border-t border-indigo-500/15" />
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">Your Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Shivanand Solanke"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="solankeshivanand7@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl btn-gradient-primary text-white font-semibold text-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : (
              <>
                <span>{mode === "signup" ? "Create Free Account (+50 Credits)" : "Sign In to Studio"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Autofill Helper */}
        <div className="mt-4 pt-3 border-t border-indigo-500/15 text-center">
          <p className="text-[11px] text-slate-400 mb-2">Instant Quick Login:</p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => handleQuickDemo("user")}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/25 hover:border-indigo-400 text-[11px] text-indigo-300 transition-colors"
            >
              👤 Demo Creator
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("admin")}
              className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/25 hover:border-purple-400 text-[11px] text-purple-300 transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" /> Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
