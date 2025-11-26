import type { DropzoneRootProps, DropzoneInputProps } from "react-dropzone";
import type { DressFormState } from "../types";
import type { DressType } from "../../../api/endpoints/dressTypes";
import type { DressSize } from "../../../api/endpoints/dressSizes";
import type { DressCondition } from "../../../api/endpoints/dressConditions";
import type { DressColor } from "../../../api/endpoints/dressColors";
import type { DressDetails } from "../../../api/endpoints/dresses";
import RightDrawer from "../../../components/ui/drawer/RightDrawer";
import SpinnerOne from "../../../components/ui/spinner/SpinnerOne";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import { TrashBinIcon } from "../../../icons";
import { FaBarcode } from "react-icons/fa";
import { MAX_IMAGES } from "../../../constants/catalogue";

// Props interface
interface EditDressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  editDress: DressDetails | null;
  editForm: DressFormState | null;
  onFormChange: (field: keyof DressFormState, value: string) => void;
  editLoading: boolean;
  editUploadingImages: boolean;
  onRemoveImage: (imageUrl: string) => void;
  onGenerateReference: () => string;
  dressTypes: DressType[];
  dressSizes: DressSize[];
  dressConditions: DressCondition[];
  dressColors: DressColor[];
  getEditRootProps: () => DropzoneRootProps;
  getEditInputProps: () => DropzoneInputProps;
  isEditDragActive: boolean;
  editImageDropDisabled: boolean;
}

/**
 * Composant EditDressDrawer - Drawer de formulaire d'édition d'une robe
 * Gère les informations de base, la tarification, les caractéristiques et les images
 */
export default function EditDressDrawer({
  isOpen,
  onClose,
  onSubmit,
  editDress,
  editForm,
  onFormChange,
  editLoading,
  editUploadingImages,
  onRemoveImage,
  onGenerateReference,
  dressTypes,
  dressSizes,
  dressConditions,
  dressColors,
  getEditRootProps,
  getEditInputProps,
  isEditDragActive,
  editImageDropDisabled,
}: EditDressDrawerProps) {
  return (
    <RightDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier la robe"
      description={editDress?.name}
      widthClassName="w-full max-w-4xl"
    >
      {editLoading || !editForm ? (
        <div className="flex justify-center py-12">
          <SpinnerOne />
        </div>
      ) : (
        <form className="space-y-6" onSubmit={onSubmit}>
          {/* Section Informations générales */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-purple-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-purple-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Informations générales
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Nom et référence de la robe
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={editForm.name}
                    onChange={(event) => onFormChange("name", event.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Référence</Label>
                  <div className="relative">
                    <Input
                      value={editForm.reference}
                      onChange={(event) => onFormChange("reference", event.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => onFormChange("reference", onGenerateReference())}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-600 hover:text-brand-700 transition-colors"
                      title="Générer une référence automatique"
                    >
                      <FaBarcode size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Tarification */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-emerald-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-emerald-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Tarification
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Prix de vente et location par jour
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Prix TTC (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price_ttc}
                    onChange={(event) => onFormChange("price_ttc", event.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Prix HT (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price_ht}
                    disabled
                    className="bg-gray-100 cursor-not-allowed dark:bg-gray-800"
                  />
                </div>
                <div>
                  <Label>Location / jour TTC (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price_per_day_ttc}
                    onChange={(event) => onFormChange("price_per_day_ttc", event.target.value)}
                  />
                </div>
                <div>
                  <Label>Location / jour HT (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price_per_day_ht}
                    disabled
                    className="bg-gray-100 cursor-not-allowed dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Caractéristiques */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-blue-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-blue-950/10 dark:to-white/[0.01]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Caractéristiques
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Type, taille, état et couleur
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Type</Label>
                  <select
                    value={editForm.type_id}
                    onChange={(event) => onFormChange("type_id", event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {dressTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Taille</Label>
                  <select
                    value={editForm.size_id}
                    onChange={(event) => onFormChange("size_id", event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {dressSizes.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>État</Label>
                  <select
                    value={editForm.condition_id}
                    onChange={(event) => onFormChange("condition_id", event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {dressConditions.map((condition) => (
                      <option key={condition.id} value={condition.id}>
                        {condition.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Couleur</Label>
                  <select
                    value={editForm.color_id}
                    onChange={(event) => onFormChange("color_id", event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  >
                    <option value="">Aucune</option>
                    {dressColors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section Images */}
          <div className="rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="overflow-hidden rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-pink-50/80 to-white/50 p-5 dark:border-gray-800 dark:from-pink-950/10 dark:to-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Images ({editForm.images.length}/{MAX_IMAGES})
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Compression automatique pour optimiser le stockage
                    </p>
                  </div>
                </div>
                {editUploadingImages && (
                  <span className="text-xs text-pink-600 dark:text-pink-400 animate-pulse">
                    Téléversement en cours...
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-5 p-6">
              {editForm.images.length ? (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {editForm.images.map((image) => (
                    <div key={image} className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <img src={image} alt="Robe" className="h-40 w-full object-cover" loading="lazy" />
                      <button
                        type="button"
                        onClick={() => onRemoveImage(image)}
                        disabled={editUploadingImages}
                        className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-theme-xs transition hover:bg-error-50 hover:text-error-600 dark:bg-gray-900/90 dark:text-gray-300"
                      >
                        <TrashBinIcon className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
                  Aucune image pour l'instant. Ajoutez-en pour valoriser la robe.
                </div>
              )}

              <div
                {...getEditRootProps()}
                className={`rounded-xl border border-dashed px-6 py-8 text-center transition ${
                  isEditDragActive
                    ? "border-brand-500 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-500/10"
                    : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.02]"
                } ${editImageDropDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-brand-500"}`}
              >
                <input {...getEditInputProps()} />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Glissez-déposez vos images ou cliquez pour sélectionner des fichiers.
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Formats acceptés : JPG, PNG, WebP, HEIC. Compression automatique pour optimiser le stockage S3.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={editLoading || editUploadingImages}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={editLoading || editUploadingImages}>
              {editLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      )}
    </RightDrawer>
  );
}
