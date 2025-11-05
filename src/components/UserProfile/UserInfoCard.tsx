import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "../../context/AuthContext";
import { httpClient } from "../../api/httpClient";
import { useNotification } from "../../context/NotificationContext";
import { useEffect, useState } from "react";

export default function UserInfoCard() {
  const { user, updateUserProfile } = useAuth();
  const { notify } = useNotification();
  const { isOpen, openModal, closeModal } = useModal();

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
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("🔵 handleSave called");
    if (!user?.id) {
      console.log("❌ No user ID found");
      return;
    }
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

      // Only include role_id if it exists
      if (user.profile?.role_id) {
        payload.profile.role_id = user.profile.role_id;
      }

      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      console.log("🔵 Sending payload:", payload);
      const res = await httpClient.put(`/users/${user.id}`, payload);
      console.log("✅ API Response:", res);

      notify("success", "Profil mis à jour", "Vos informations ont été modifiées avec succès");

      const updatedProfile =
        res?.profile ??
        {
          ...(user?.profile ?? {}),
          firstName: form.firstname.trim(),
          lastName: form.lastname.trim(),
          country: form.country.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          postal_code: form.postal_code.trim(),
        };

      console.log("🔵 Updating user profile with:", updatedProfile);
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
      closeModal();
    } catch (err: any) {
      console.error("❌ Erreur de mise à jour:", err);
      notify("error", "Erreur", "Impossible de mettre à jour le profil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Informations personnelles
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Nom</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {form.lastname || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Prénom</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {form.firstname || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.email || "—"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
            />
          </svg>
          Modifier
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Modifier mes informations
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Mettez à jour vos informations personnelles ci-dessous.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" value={form.email} disabled />
                </div>
                <div>
                  <Label>Prénom</Label>
                  <Input name="firstname" value={form.firstname} onChange={handleChange} />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input name="lastname" value={form.lastname} onChange={handleChange} />
                </div>
                <div>
                  <Label>Pays</Label>
                  <Input name="country" value={form.country} onChange={handleChange} />
                </div>
                <div>
                  <Label>Ville</Label>
                  <Input name="city" value={form.city} onChange={handleChange} />
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input name="address" value={form.address} onChange={handleChange} />
                </div>
                <div>
                  <Label>Code postal</Label>
                  <Input name="postal_code" value={form.postal_code} onChange={handleChange} />
                </div>
                <div className="lg:col-span-2">
                  <Label>Nouveau mot de passe</Label>
                  <Input
                    name="password"
                    type="password"
                    placeholder="Laissez vide pour ne pas changer"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} disabled={saving}>
                Fermer
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Enregistrement…
                  </span>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
