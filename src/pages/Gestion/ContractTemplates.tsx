import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { TemplateEditor } from "../../components/contractTemplates/TemplateEditor";
import { TemplatesList } from "../../components/contractTemplates/TemplatesList";
import { ContractTypesAPI, type ContractType } from "../../api/endpoints/contractTypes";
import type { ContractTemplate } from "../../types/contractTemplate";

/**
 * Page de gestion des templates de contrats
 * Permet de créer, éditer, dupliquer et supprimer des templates personnalisables
 */
export default function ContractTemplates() {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [selectedContractTypeId, setSelectedContractTypeId] = useState<string>("");
  const [loadingTypes, setLoadingTypes] = useState(true);

  // États pour l'édition
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  // Charger les types de contrats au montage
  useEffect(() => {
    loadContractTypes();
  }, []);

  const loadContractTypes = async () => {
    setLoadingTypes(true);
    try {
      const data = await ContractTypesAPI.list();
      setContractTypes(data);

      // Sélectionner le premier type par défaut
      if (data.length > 0 && !selectedContractTypeId) {
        setSelectedContractTypeId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading contract types:", error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplateId(undefined);
    setEditorOpen(true);
  };

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(templateId);
    setEditorOpen(true);
  };

  const handleSaveTemplate = () => {
    setEditorOpen(false);
    setEditingTemplateId(undefined);
    // Forcer le rechargement de la liste
    setRefreshKey((prev) => {
      const newKey = prev + 1;
      console.log('🔄 Rafraîchissement de la liste (refreshKey:', newKey, ')');
      return newKey;
    });
  };

  const handleCancelEdit = () => {
    setEditorOpen(false);
    setEditingTemplateId(undefined);
  };

  return (
    <>
      <PageMeta
        title="Templates de Contrats | Velvena"
        description="Gérez vos templates de contrats personnalisables"
      />

      <PageBreadcrumb pageTitle="Templates de Contrats" />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Templates de Contrats
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Créez et gérez des templates personnalisables avec variables Handlebars
              </p>
            </div>

            <Button
              onClick={handleCreateTemplate}
              variant="primary"
              startIcon={
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
            >
              Nouveau Template
            </Button>
          </div>

          {/* Filtres par type de contrat */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par type de contrat
            </label>
            {loadingTypes ? (
              <div className="text-sm text-gray-500">Chargement des types...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setSelectedContractTypeId("")}
                  variant={selectedContractTypeId === "" ? "primary" : "outline"}
                  size="sm"
                >
                  Tous les types
                </Button>
                {contractTypes.map((type) => (
                  <Button
                    key={type.id}
                    onClick={() => setSelectedContractTypeId(type.id)}
                    variant={selectedContractTypeId === type.id ? "primary" : "outline"}
                    size="sm"
                  >
                    {type.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Liste des templates */}
        <div className="p-6">
          <TemplatesList
            key={refreshKey}
            contractTypeId={selectedContractTypeId || undefined}
            onEdit={handleEditTemplate}
          />
        </div>
      </div>

      {/* Modal d'édition */}
      <Modal
        isOpen={editorOpen}
        onClose={handleCancelEdit}
        className="max-w-full w-full h-screen p-0"
        showCloseButton={false}
      >
        <TemplateEditor
          templateId={editingTemplateId}
          contractTypeId={selectedContractTypeId || undefined}
          onSave={handleSaveTemplate}
          onCancel={handleCancelEdit}
        />
      </Modal>
    </>
  );
}
