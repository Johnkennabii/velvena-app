import { useState, useEffect } from "react";
import SimpleBar from "simplebar-react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { useAuth } from "../../context/AuthContext";
import { httpClient } from "../../api/httpClient";
import { useNotification } from "../../context/NotificationContext";
import { PasswordValidator, validatePassword } from "../common/PasswordValidator";

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileDrawer({ isOpen, onClose }: UserProfileDrawerProps) {
  const { user, updateUserProfile } = useAuth();
  const { notify } = useNotification();

  const [form, setForm] = useState({
    firstname: user?.profile?.firstname || user?.profile?.firstName || "",
    lastname: user?.profile?.lastname || user?.profile?.lastName || "",
    country: user?.profile?.country || "",
    city: user?.profile?.city || "",
    address: user?.profile?.address || "",
    postal_code: user?.profile?.postal_code || "",
    email: user?.email || "",
    password: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        firstname: user?.profile?.firstname || user?.profile?.firstName || "",
        lastname: user?.profile?.lastname || user?.profile?.lastName || "",
        country: user?.profile?.country || "",
        city: user?.profile?.city || "",
        address: user?.profile?.address || "",
        postal_code: user?.profile?.postal_code || "",
        email: user?.email || "",
        password: "",
      });
    }
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    try {
      const payload: {
        profile: {
          firstName: string;
          lastName: string;
          country: string;
          city: string;
          address: string;
          postal_code: string;
          role_id?: string;
        };
        password?: string;
      } = {
        profile: {
          firstName: form.firstname.trim(),
          lastName: form.lastname.trim(),
          country: form.country.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          postal_code: form.postal_code.trim(),
        },
      };

      if (user.profile?.role_id) {
        payload.profile.role_id = user.profile.role_id;
      }

      if (form.password.trim()) {
        if (!validatePassword(form.password)) {
          notify(
            "warning",
            "Mot de passe invalide",
            "Le mot de passe doit contenir au moins 10 caractères, 1 majuscule, 2 chiffres et 1 caractère spécial."
          );
          setSaving(false);
          return;
        }
        payload.password = form.password.trim();
      }

      const res = await httpClient.put(`/users/${user.id}`, payload);

      notify("success", "Profil mis à jour", "Vos informations ont été modifiées avec succès");

      const updatedProfile = res?.profile ?? {
        ...(user?.profile ?? {}),
        firstName: form.firstname.trim(),
        lastName: form.lastname.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        postal_code: form.postal_code.trim(),
      };

      updateUserProfile(updatedProfile);

      setForm((prev) => ({
        ...prev,
        firstname: updatedProfile?.firstname || updatedProfile?.firstName || "",
        lastname: updatedProfile?.lastname || updatedProfile?.lastName || "",
        country: updatedProfile?.country || "",
        city: updatedProfile?.city || "",
        address: updatedProfile?.address || "",
        postal_code: updatedProfile?.postal_code || "",
        password: "",
      }));
      onClose();
    } catch (err: any) {
      console.error("❌ Erreur de mise à jour:", err);
      notify("error", "Erreur", "Impossible de mettre à jour le profil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={handleCancel}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10.0003 2.2915C7.69923 2.2915 5.83366 4.15707 5.83366 6.45817C5.83366 8.75926 7.69923 10.6248 10.0003 10.6248C12.3014 10.6248 14.167 8.75926 14.167 6.45817C14.167 4.15707 12.3014 2.2915 10.0003 2.2915ZM7.33366 6.45817C7.33366 4.98549 8.52766 3.7915 10.0003 3.7915C11.473 3.7915 12.667 4.98549 12.667 6.45817C12.667 7.93084 11.473 9.12484 10.0003 9.12484C8.52766 9.12484 7.33366 7.93084 7.33366 6.45817Z" fill="white"/>
                  <path d="M5.8418 12.7082C4.38788 12.7082 3.2085 13.8876 3.2085 15.3415V16.0415C3.2085 16.4557 3.54428 16.7915 3.9585 16.7915C4.37271 16.7915 4.7085 16.4557 4.7085 16.0415V15.3415C4.7085 14.716 5.21631 14.2082 5.8418 14.2082H14.1585C14.784 14.2082 15.2918 14.716 15.2918 15.3415V16.0415C15.2918 16.4557 15.6276 16.7915 16.0418 16.7915C16.456 16.7915 16.7918 16.4557 16.7918 16.0415V15.3415C16.7918 13.8876 15.6124 12.7082 14.1585 12.7082H5.8418Z" fill="white"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Modifier mon profil</h2>
            </div>
            <button
              onClick={handleCancel}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
            <SimpleBar className="custom-scrollbar flex-1">
              <div className="p-6 xl:p-8 space-y-8">
                {/* Section Informations personnelles */}
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                      <svg className="text-brand-600 dark:text-brand-400" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17.0838 17.5C17.0838 14.5016 13.9252 12.0833 10.0005 12.0833C6.0758 12.0833 2.91716 14.5016 2.91716 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Informations personnelles
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label>Prénom <span className="text-error-500">*</span></Label>
                      <Input name="firstname" value={form.firstname} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label>Nom <span className="text-error-500">*</span></Label>
                      <Input name="lastname" value={form.lastname} onChange={handleChange} required />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Email</Label>
                      <Input name="email" type="email" value={form.email} disabled />
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        L'email ne peut pas être modifié
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Adresse */}
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                      <svg className="text-brand-600 dark:text-brand-400" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10.625C11.3807 10.625 12.5 9.50571 12.5 8.125C12.5 6.74429 11.3807 5.625 10 5.625C8.61929 5.625 7.5 6.74429 7.5 8.125C7.5 9.50571 8.61929 10.625 10 10.625Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16.25 8.125C16.25 13.75 10 18.125 10 18.125C10 18.125 3.75 13.75 3.75 8.125C3.75 6.4674 4.40848 4.87769 5.58058 3.70558C6.75269 2.53348 8.3424 1.875 10 1.875C11.6576 1.875 13.2473 2.53348 14.4194 3.70558C15.5915 4.87769 16.25 6.4674 16.25 8.125Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Adresse
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label>Adresse complète</Label>
                      <Input name="address" value={form.address} onChange={handleChange} placeholder="123 Rue de la Paix" />
                    </div>
                    <div>
                      <Label>Ville</Label>
                      <Input name="city" value={form.city} onChange={handleChange} placeholder="Paris" />
                    </div>
                    <div>
                      <Label>Code postal</Label>
                      <Input name="postal_code" value={form.postal_code} onChange={handleChange} placeholder="75001" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Pays</Label>
                      <Input name="country" value={form.country} onChange={handleChange} placeholder="France" />
                    </div>
                  </div>
                </div>

                {/* Section Sécurité */}
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                      <svg className="text-brand-600 dark:text-brand-400" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.1667 8.33333V6.66667C14.1667 4.36548 12.3012 2.5 10 2.5C7.69881 2.5 5.83333 4.36548 5.83333 6.66667V8.33333M10 12.0833V13.75M6.5 17.5H13.5C14.4205 17.5 15.1667 16.7538 15.1667 15.8333V9.83333C15.1667 8.91286 14.4205 8.16667 13.5 8.16667H6.5C5.57953 8.16667 4.83333 8.91286 4.83333 9.83333V15.8333C4.83333 16.7538 5.57953 17.5 6.5 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Sécurité
                    </h3>
                  </div>

                  <div>
                    <Label>Nouveau mot de passe</Label>
                    <Input
                      name="password"
                      type="password"
                      placeholder="Laissez vide pour ne pas changer"
                      value={form.password}
                      onChange={handleChange}
                    />
                    {form.password && (
                      <div className="mt-3">
                        <PasswordValidator password={form.password} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SimpleBar>

            {/* Footer with actions */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-[#171f2f]">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
