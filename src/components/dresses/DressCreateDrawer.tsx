import type React from "react";
import RightDrawer from "../ui/drawer/RightDrawer";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import type { DressType } from "../../api/endpoints/dressTypes";
import type { DressSize } from "../../api/endpoints/dressSizes";
import type { DressCondition } from "../../api/endpoints/dressConditions";
import type { DressColor } from "../../api/endpoints/dressColors";
import type { DressFormState } from "../../pages/Catalogue/types";

type DropzoneGetProps = (props?: Record<string, unknown>) => Record<string, unknown>;

export interface DressCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: DressFormState;
  onChange: (field: keyof DressFormState, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  creating: boolean;
  uploading: boolean;
  images: Array<{ preview: string }>;
  onRemoveImage: (preview: string) => void;
  getRootProps: DropzoneGetProps;
  getInputProps: DropzoneGetProps;
  isDragActive: boolean;
  dressTypes: DressType[];
  dressSizes: DressSize[];
  dressConditions: DressCondition[];
  dressColors: DressColor[];
  maxImages: number;
}

export function DressCreateDrawer({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  creating,
  uploading,
  images,
  onRemoveImage,
  getRootProps,
  getInputProps,
  isDragActive,
  dressTypes,
  dressSizes,
  dressConditions,
  dressColors,
  maxImages,
}: DressCreateDrawerProps) {
  return (
    <RightDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter une robe"
      description="Créer une nouvelle référence"
      widthClassName="w-full max-w-4xl"
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Nom</Label>
            <Input value={form.name} onChange={(event) => onChange("name", event.target.value)} required />
          </div>
          <div>
            <Label>Référence</Label>
            <Input value={form.reference} onChange={(event) => onChange("reference", event.target.value)} required />
          </div>
          <div>
            <Label>Prix HT (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.price_ht}
              onChange={(event) => onChange("price_ht", event.target.value)}
              required
            />
          </div>
          <div>
            <Label>Prix TTC (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.price_ttc}
              onChange={(event) => onChange("price_ttc", event.target.value)}
              required
            />
          </div>
          <div>
            <Label>Location / jour HT (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.price_per_day_ht}
              onChange={(event) => onChange("price_per_day_ht", event.target.value)}
            />
          </div>
          <div>
            <Label>Location / jour TTC (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.price_per_day_ttc}
              onChange={(event) => onChange("price_per_day_ttc", event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Type</Label>
            <select
              value={form.type_id}
              onChange={(event) => onChange("type_id", event.target.value)}
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
              value={form.size_id}
              onChange={(event) => onChange("size_id", event.target.value)}
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
              value={form.condition_id}
              onChange={(event) => onChange("condition_id", event.target.value)}
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
              value={form.color_id}
              onChange={(event) => onChange("color_id", event.target.value)}
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Images ({images.length}/{maxImages})</Label>
            {(uploading || creating) && (
              <span className="text-xs text-gray-500 dark:text-gray-400">Téléversement en cours...</span>
            )}
          </div>
          <div
            {...getRootProps({
              className:
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-white/60 px-6 py-10 text-center transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-gray-700 dark:bg-white/[0.03] dark:hover:border-brand-500/60 dark:hover:bg-brand-500/5",
            })}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-sm text-brand-600 dark:text-brand-400">Relâchez les fichiers pour les ajouter…</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Glissez-déposez vos images ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG ou WebP — {maxImages} images maximum
                </p>
              </div>
            )}
          </div>
          {images.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((item) => (
                <div
                  key={item.preview}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03]"
                >
                  <img
                    src={item.preview}
                    alt="Prévisualisation"
                    className="h-44 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(item.preview)}
                    className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-white dark:border-white/10 dark:bg-gray-900/70 dark:text-gray-100"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={creating || uploading}>
            Annuler
          </Button>
          <Button type="submit" disabled={creating || uploading}>
            {creating ? "Création..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </RightDrawer>
  );
}
