import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, hasRole, loading: authLoading } = useAuth();
  const { loading: globalLoading } = useLoading();

  // 🔄 Si le contexte Auth ou Loading est encore en chargement → on attend
  if (authLoading || globalLoading) {
    return null; // ou un spinner global si tu veux l'afficher
  }

  // ❌ Pas d’utilisateur connecté → redirige vers /signin
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // 🚫 Rôle non autorisé → redirige vers une page d'erreur
  // SUPER_ADMIN a accès à tout automatiquement
  if (roles && user.role !== "SUPER_ADMIN" && hasRole && !hasRole(...roles)) {
    return <Navigate to="/not-found" replace />;
  }

  // ✅ Autorisé
  return <>{children}</>;
}