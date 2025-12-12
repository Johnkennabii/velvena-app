import { useState, useEffect } from "react";
import { ContractTemplatesAPI } from "../../api/endpoints/contractTemplates";
import type { ContractTemplate } from "../../types/contractTemplate";
import Button from "../ui/button/Button";

interface TemplatesListProps {
  contractTypeId?: string;
  onEdit?: (templateId: string) => void;
  onSelect?: (template: ContractTemplate) => void;
  selectedTemplateId?: string;
}

/**
 * Liste des templates de contrats avec actions CRUD
 */
export function TemplatesList({
  contractTypeId,
  onEdit,
  onSelect,
  selectedTemplateId,
}: TemplatesListProps) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");

  useEffect(() => {
    loadTemplates();
  }, [contractTypeId, filter]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await ContractTemplatesAPI.list({
        contract_type_id: contractTypeId,
        is_active: filter === "all" ? undefined : filter === "active",
      });
      console.log('📋 Templates chargés:', data.map(t => ({
        id: t.id,
        name: t.name,
        is_default: t.is_default,
        is_active: t.is_active,
      })));
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (templateId: string) => {
    if (!confirm("Dupliquer ce template ?")) return;

    try {
      await ContractTemplatesAPI.duplicate(templateId);
      await loadTemplates();
      alert("Template dupliqué avec succès !");
    } catch (error) {
      console.error("Error duplicating template:", error);
      alert("Erreur lors de la duplication");
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) return;

    try {
      await ContractTemplatesAPI.delete(templateId);
      await loadTemplates();
      alert("Template supprimé avec succès !");
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleToggleActive = async (template: ContractTemplate) => {
    try {
      await ContractTemplatesAPI.update(template.id, {
        is_active: !template.is_active,
      });
      await loadTemplates();
    } catch (error) {
      console.error("Error toggling template:", error);
      alert("Erreur lors de la modification");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-2">
        <Button
          onClick={() => setFilter("all")}
          variant={filter === "all" ? "primary" : "outline"}
          size="sm"
        >
          Tous
        </Button>
        <Button
          onClick={() => setFilter("active")}
          variant={filter === "active" ? "primary" : "outline"}
          size="sm"
        >
          Actifs
        </Button>
        <Button
          onClick={() => setFilter("inactive")}
          variant={filter === "inactive" ? "primary" : "outline"}
          size="sm"
        >
          Inactifs
        </Button>
      </div>

      {/* Liste */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun template</h3>
          <p className="mt-1 text-sm text-gray-500">
            Créez votre premier template de contrat
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => {
            const isSelected = template.id === selectedTemplateId;

            return (
              <div
                key={template.id}
                className={`bg-white rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-blue-500 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        {template.is_default && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            Par défaut
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            template.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {template.is_active ? "Actif" : "Inactif"}
                        </span>
                      </div>

                      {template.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {template.description}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        {template.contract_type && (
                          <span>Type: {template.contract_type.name}</span>
                        )}
                        <span>
                          Créé le{" "}
                          {new Date(template.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        {template.organization && (
                          <span>Organisation: {template.organization.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {onSelect && (
                        <button
                          onClick={() => onSelect(template)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {isSelected ? "Sélectionné" : "Sélectionner"}
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleActive(template)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title={template.is_active ? "Désactiver" : "Activer"}
                      >
                        {template.is_active ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>

                      {onEdit && (
                        <button
                          onClick={() => onEdit(template.id)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Éditer"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}

                      <button
                        onClick={() => handleDuplicate(template.id)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Dupliquer"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>

                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
