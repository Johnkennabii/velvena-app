import { useState, useCallback } from "react";
import type { DressDetails } from "../../api/endpoints/dresses";
import type { DressFormState } from "../../pages/Catalogue/types";

/**
 * Hook pour gérer l'état du drawer d'édition de robe
 */
export function useDressEdit() {
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editDress, setEditDress] = useState<DressDetails | null>(null);
  const [editForm, setEditForm] = useState<DressFormState | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editUploadingImages, setEditUploadingImages] = useState(false);

  // Fonction pour réinitialiser le formulaire
  const resetEditForm = useCallback(() => {
    setEditForm(null);
    setEditDress(null);
    setEditLoading(false);
    setEditUploadingImages(false);
  }, []);

  // Fonction pour ouvrir le drawer avec une robe
  const openEditDrawer = useCallback((dress: DressDetails) => {
    setEditDress(dress);
    setEditDrawerOpen(true);
  }, []);

  // Fonction pour fermer le drawer
  const closeEditDrawer = useCallback(() => {
    setEditDrawerOpen(false);
    resetEditForm();
  }, [resetEditForm]);

  return {
    // États
    editDrawerOpen,
    setEditDrawerOpen,
    editDress,
    setEditDress,
    editForm,
    setEditForm,
    editLoading,
    setEditLoading,
    editUploadingImages,
    setEditUploadingImages,

    // Fonctions utilitaires
    resetEditForm,
    openEditDrawer,
    closeEditDrawer,
  };
}
