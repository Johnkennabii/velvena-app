import { useState, useEffect } from "react";
import { FiSave, FiHome } from "react-icons/fi";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { useOrganization } from "../../context/OrganizationContext";
import type { UpdateOrganizationInput } from "../../types/organization";

export default function OrganizationSettings() {
  const { organization, updateOrganization, loading } = useOrganization();
  const [formData, setFormData] = useState<UpdateOrganizationInput>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    siret: "",
    manager_gender: null,
    manager_firstname: "",
    manager_lastname: "",
    manager_title: "",
  });
  const [saving, setSaving] = useState(false);

  // Mettre à jour le formulaire quand les données de l'organisation sont chargées
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
        city: organization.city || "",
        postal_code: organization.postal_code || "",
        country: organization.country || "",
        siret: organization.siret || "",
        manager_gender: organization.manager_gender || null,
        manager_firstname: organization.manager_firstname || "",
        manager_lastname: organization.manager_lastname || "",
        manager_title: organization.manager_title || "",
      });
    }
  }, [organization]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value === "" ? null : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateOrganization(formData);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="Paramètres Organisation - Velvena App"
        description="Gérez les informations de votre organisation"
      />
      <PageBreadcrumb pageTitle="Paramètres de l'Organisation" />

      <div className="max-w-4xl">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/20">
                <FiHome className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  Informations de l'organisation
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gérez les détails de votre organisation
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* General Information */}
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                Informations générales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Nom de l'organisation <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Velvena"
                    required
                  />
                </div>

                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    placeholder="contact@velvena.fr"
                    required
                  />
                </div>

                <div>
                  <Label>Téléphone</Label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                Informations légales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>SIRET</Label>
                  <Input
                    name="siret"
                    value={formData.siret || ""}
                    onChange={handleChange}
                    placeholder="123 456 789 00010"
                    maxLength={14}
                  />
                  <p className="mt-1 text-xs text-gray-500">Numéro d'immatriculation de l'entreprise</p>
                </div>
              </div>
            </div>

            {/* Manager Information */}
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                Informations du gérant
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Civilité</Label>
                  <select
                    name="manager_gender"
                    value={formData.manager_gender || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">Monsieur</option>
                    <option value="F">Madame</option>
                  </select>
                </div>

                <div>
                  <Label>Titre/Fonction</Label>
                  <Input
                    name="manager_title"
                    value={formData.manager_title || ""}
                    onChange={handleChange}
                    placeholder="Gérant(e)"
                  />
                </div>

                <div>
                  <Label>Prénom</Label>
                  <Input
                    name="manager_firstname"
                    value={formData.manager_firstname || ""}
                    onChange={handleChange}
                    placeholder="Jean"
                  />
                </div>

                <div>
                  <Label>Nom</Label>
                  <Input
                    name="manager_lastname"
                    value={formData.manager_lastname || ""}
                    onChange={handleChange}
                    placeholder="Dupont"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                Adresse
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Adresse</Label>
                  <Input
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    placeholder="123 Rue de la Mode"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Ville</Label>
                    <Input
                      name="city"
                      value={formData.city || ""}
                      onChange={handleChange}
                      placeholder="Paris"
                    />
                  </div>

                  <div>
                    <Label>Code postal</Label>
                    <Input
                      name="postal_code"
                      value={formData.postal_code || ""}
                      onChange={handleChange}
                      placeholder="75001"
                    />
                  </div>

                  <div>
                    <Label>Pays</Label>
                    <Input
                      name="country"
                      value={formData.country || ""}
                      onChange={handleChange}
                      placeholder="France"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2"
              >
                <FiSave className="w-4 h-4" />
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
