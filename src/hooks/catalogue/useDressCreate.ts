import { useState, useCallback } from "react";
import type { DressFormState, QueuedImage } from "../../pages/Catalogue/types";

const emptyFormState: DressFormState = {
  name: "",
  reference: "",
  price_ht: "",
  price_ttc: "",
  price_per_day_ht: "",
  price_per_day_ttc: "",
  type_id: "",
  size_id: "",
  condition_id: "",
  color_id: "",
  images: [],
};

/**
 * Hook pour gérer l'état du drawer de création de robe
 */
export function useDressCreate() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState<DressFormState>(emptyFormState);
  const [creating, setCreating] = useState(false);
  const [createImages, setCreateImages] = useState<QueuedImage[]>([]);
  const [createUploadingImages, setCreateUploadingImages] = useState(false);

  // Fonction pour réinitialiser le formulaire
  const resetCreateForm = useCallback(() => {
    setCreateForm(emptyFormState);
    setCreateImages([]);
    setCreateUploadingImages(false);
    setCreating(false);
  }, []);

  // Fonction pour ouvrir le drawer
  const openCreateDrawer = useCallback(() => {
    resetCreateForm();
    setCreateDrawerOpen(true);
  }, [resetCreateForm]);

  // Fonction pour fermer le drawer
  const closeCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
    resetCreateForm();
  }, [resetCreateForm]);

  return {
    // États
    createDrawerOpen,
    setCreateDrawerOpen,
    createForm,
    setCreateForm,
    creating,
    setCreating,
    createImages,
    setCreateImages,
    createUploadingImages,
    setCreateUploadingImages,

    // Fonctions utilitaires
    resetCreateForm,
    openCreateDrawer,
    closeCreateDrawer,
  };
}
