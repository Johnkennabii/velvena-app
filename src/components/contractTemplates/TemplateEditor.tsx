import { useState, useEffect, useRef } from "react";
import { ContractTemplatesAPI } from "../../api/endpoints/contractTemplates";
import { ContractTypesAPI, type ContractType } from "../../api/endpoints/contractTypes";
import { TemplateToolbar } from "./TemplateToolbar";
import { STARTER_TEMPLATES } from "./starterTemplates";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

interface TemplateEditorProps {
  templateId?: string;
  contractTypeId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

/**
 * Éditeur de template de contrat avec prévisualisation
 * Permet de créer/modifier des templates Handlebars
 */
export function TemplateEditor({
  templateId,
  contractTypeId,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  // Types de contrats disponibles
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [selectedContractTypeId, setSelectedContractTypeId] = useState(contractTypeId || "");

  // Données du formulaire
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Prévisualisation
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Référence du textarea pour l'insertion de texte
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Modal de sélection de template de départ
  const [showStarterModal, setShowStarterModal] = useState(false);

  // Charger les types de contrats au montage
  useEffect(() => {
    loadContractTypes();
  }, []);

  // Afficher le modal de sélection si nouveau template sans contenu
  useEffect(() => {
    if (!templateId && !content) {
      setShowStarterModal(true);
    }
  }, [templateId]);

  // Charger le template si on est en mode édition
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadContractTypes = async () => {
    try {
      const types = await ContractTypesAPI.list();
      setContractTypes(types);

      // Si un contractTypeId est fourni et qu'on n'a pas encore de sélection
      if (contractTypeId && !selectedContractTypeId) {
        setSelectedContractTypeId(contractTypeId);
      }
    } catch (error) {
      console.error("Error loading contract types:", error);
    }
  };

  const loadTemplate = async () => {
    if (!templateId) return;

    setLoading(true);
    try {
      const template = await ContractTemplatesAPI.getById(templateId);
      console.log('📥 Template chargé:', template);
      console.log('   - is_default:', template.is_default);
      console.log('   - is_active:', template.is_active);

      setName(template.name);
      setDescription(template.description || "");
      setContent(template.content);
      setIsDefault(template.is_default);
      setIsActive(template.is_active);
      setSelectedContractTypeId(template.contract_type_id);
    } catch (error) {
      console.error("Error loading template:", error);
      alert("Erreur lors du chargement du template");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation basique
    if (!name.trim()) {
      alert("Le nom du template est obligatoire");
      return;
    }
    if (!content.trim()) {
      alert("Le contenu du template est obligatoire");
      return;
    }
    if (!selectedContractTypeId) {
      alert("Le type de contrat est obligatoire");
      return;
    }

    setSaving(true);
    try {
      if (templateId) {
        // Mise à jour
        const payload = {
          name,
          description: description || undefined,
          content,
          is_default: isDefault,
          is_active: isActive,
        };
        console.log('🔄 Mise à jour du template:', templateId, payload);
        const result = await ContractTemplatesAPI.update(templateId, payload);
        console.log('✅ Template mis à jour:', result);
      } else {
        // Création
        const payload = {
          name,
          description: description || undefined,
          contract_type_id: selectedContractTypeId,
          content,
          is_default: isDefault,
          is_active: isActive,
        };
        console.log('➕ Création du template:', payload);
        const result = await ContractTemplatesAPI.create(payload);
        console.log('✅ Template créé:', result);
      }

      alert("Template sauvegardé avec succès !");

      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error("Error saving template:", error);
      alert(error?.message || "Erreur lors de la sauvegarde du template");
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setValidationErrors([]);

    try {
      const result = await ContractTemplatesAPI.validate({ content });

      if (result.valid) {
        alert("✓ Le template est valide !");
      } else {
        setValidationErrors(result.errors || ["Erreur de validation inconnue"]);
      }
    } catch (error: any) {
      setValidationErrors([error?.message || "Erreur lors de la validation"]);
    } finally {
      setValidating(false);
    }
  };

  const handlePreview = async () => {
    if (!content.trim()) {
      alert("Le template est vide");
      return;
    }

    // Prévisualisation locale simple sans appel API
    // On affiche juste le HTML brut (les variables ne seront pas remplacées)
    setPreviewHtml(content);
    setShowPreview(true);
  };

  // Insérer du texte à la position du curseur
  const handleInsertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.substring(0, start) + text + content.substring(end);

    setContent(newContent);

    // Replacer le curseur après le texte inséré
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  // Sélectionner un template de départ
  const handleSelectStarter = (templateId: string) => {
    const starter = STARTER_TEMPLATES.find((t) => t.id === templateId);
    if (starter) {
      setContent(starter.content);
      setShowStarterModal(false);
    }
  };

  if (loading && templateId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement du template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Panel gauche : Éditeur */}
      <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 bg-white">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du template *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Contrat Négafa Standard"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <TextArea
                value={description}
                onChange={(value) => setDescription(value)}
                placeholder="Description courte du template"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de contrat *
              </label>
              <select
                value={selectedContractTypeId}
                onChange={(e) => setSelectedContractTypeId(e.target.value)}
                disabled={!!templateId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Sélectionnez un type de contrat</option>
                {contractTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {templateId && (
                <p className="text-xs text-gray-500 mt-1">
                  Le type de contrat ne peut pas être modifié après la création
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <Checkbox
                label="Template par défaut"
                checked={isDefault}
                onChange={(checked) => setIsDefault(checked)}
              />

              <Checkbox
                label="Actif"
                checked={isActive}
                onChange={(checked) => setIsActive(checked)}
              />
            </div>
          </div>
        </div>

        {/* Toolbar d'insertion */}
        <TemplateToolbar onInsert={handleInsertText} />

        {/* Éditeur de code */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full p-4 font-mono text-sm border-0 focus:ring-0 resize-none overflow-auto"
            placeholder="Cliquez sur les boutons ci-dessus pour insérer du contenu...

Ou commencez à écrire votre template HTML avec variables Handlebars ici."
            spellCheck={false}
          />
        </div>

        {/* Erreurs de validation */}
        {validationErrors.length > 0 && (
          <div className="border-t border-red-200 bg-red-50 p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              Erreurs de validation :
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-200 p-4 bg-white flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="primary"
          >
            {saving ? "Sauvegarde..." : templateId ? "Mettre à jour" : "Créer"}
          </Button>

          <Button
            onClick={handleValidate}
            disabled={validating}
            variant="outline"
          >
            {validating ? "Validation..." : "Valider la syntaxe"}
          </Button>

          <Button
            onClick={handlePreview}
            disabled={!content.trim()}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Prévisualiser
          </Button>

          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
            >
              Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Modal de sélection de template de départ */}
      <Modal
        isOpen={showStarterModal}
        onClose={() => setShowStarterModal(false)}
        className="max-w-4xl"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Choisissez un modèle de départ
            </h3>
            <p className="text-sm text-gray-600">
              Sélectionnez un template prédéfini pour commencer rapidement, ou partez de zéro.
            </p>
          </div>

          <div className="max-h-[60vh] overflow-auto mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STARTER_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectStarter(template.id)}
                  className="text-left p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all group"
                >
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                    <span>Utiliser ce modèle</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowStarterModal(false)}
              variant="outline"
            >
              Fermer et partir de zéro
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        showCloseButton ={true}
        className="max-w-4xl"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Prévisualisation du template
            </h3>
          </div>

          <div className="max-h-[70vh] overflow-auto bg-gray-50 p-6 rounded-lg">
            <div
              className="bg-white p-8 shadow-lg rounded-lg"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
