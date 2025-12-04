import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Checkbox from "../../components/form/input/Checkbox";
import Label from "../../components/form/Label";
import Alert from "../../components/ui/alert/Alert";
import { useNotification } from "../../context/NotificationContext";
import {
  ContractsAPI,
  type ContractAddon,
  type ContractDress,
  type ContractFullView,
} from "../../api/endpoints/contracts";
import ContractTemplateNegafa from "./ContractTemplateNegafa";
import ContractTemplateLocation from "./ContractTemplateLocation";
import { formatCurrency, formatDate } from "../../utils/formatters";


const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};


const SIGNED_STATUSES = new Set(["SIGNED", "SIGNED_ELECTRONICALLY", "COMPLETED"]);

export default function ContractSignPage() {
  const { token } = useParams<{ token: string }>();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<ContractFullView | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Lien de signature invalide.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const response = await ContractsAPI.getSignatureByToken(token);
        if (cancelled) return;
        setContract(response);
      } catch (err) {
        console.error("Impossible de récupérer le contrat à signer :", err);
        if (!cancelled) {
          setError("Ce lien de signature n'est plus valide ou a déjà été utilisé.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const customerName = useMemo(() => {
    if (!contract) return "-";
    const parts = [contract.customer_firstname, contract.customer_lastname].filter(Boolean);
    if (parts.length === 0) return "-";
    return parts.join(" ");
  }, [contract]);

  const dresses = useMemo(() => {
    if (!contract) return [] as ContractDress[];
    const list = (contract.dresses ?? []) as ContractDress[];
    return list.map((entry) => entry?.dress ?? entry).filter(Boolean) as ContractDress[];
  }, [contract]);

  const addons = useMemo(() => {
    if (!contract) return [] as ContractAddon[];
    if (contract.addons && contract.addons.length) return contract.addons as ContractAddon[];
    if (contract.addon_links && contract.addon_links.length) {
      return contract.addon_links
        .map((link) => link.addon)
        .filter((addon): addon is ContractAddon => Boolean(addon));
    }
    return [] as ContractAddon[];
  }, [contract]);

  // Récupérer les IDs des addons inclus dans le forfait
  const packageAddonIds = useMemo(() => {
    return contract?.package?.addons?.map(pa => pa.addon_id) ?? [];
  }, [contract?.package?.addons]);

  const getAddonLabel = (addonId?: string) => {
    if (addonId && packageAddonIds.includes(addonId)) {
      return { text: "Inclus au forfait", color: "text-success-600" };
    }
    return { text: "Optionnel", color: "text-gray-500" };
  };

  const isDisabled = useMemo(() => {
    return Boolean(contract?.deleted_at);
  }, [contract]);

  const isSigned = useMemo(() => {
    if (!contract) return false;
    const status = (contract.status ?? "").toUpperCase();
    const signedByStatus = SIGNED_STATUSES.has(status);
    const signedByTimestamp = Boolean(contract.signed_at);
    const signedByReference = Boolean(contract.signature_reference);

    // Un contrat est signé si:
    // 1. Le statut est dans SIGNED_STATUSES OU
    // 2. Il y a une date de signature (signed_at) OU
    // 3. Il y a une référence de signature (signature_reference)
    const signed = signedByStatus || signedByTimestamp || signedByReference;

    console.log("📝 Vérification signature:", {
      status_original: contract.status,
      status_uppercase: status,
      signedByStatus,
      signedByTimestamp,
      signedByReference,
      signed,
      signed_at: contract.signed_at,
      signature_reference: contract.signature_reference
    });
    return signed;
  }, [contract]);

  const daysRemaining = useMemo(() => {
    if (!contract?.sign_link?.expires_at) {
      return null;
    }
    const expiresAt = new Date(contract.sign_link.expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [contract]);

  const handleConfirmSignature = async () => {
    if (!token) return;
    setSigning(true);
    try {
      const updated = await ContractsAPI.signByToken(token);
      console.log("✅ Contrat mis à jour après signature:", {
        status: updated.status,
        signed_at: updated.signed_at,
        signature_reference: updated.signature_reference
      });
      setContract(updated);
      setModalOpen(false);
      notify("success", "Signature confirmée", "Le contrat a été signé électroniquement.");

      // Force un refresh de la page après 1 seconde pour être sûr que le statut est à jour
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Signature électronique impossible :", err);
      notify("error", "Erreur", "La signature électronique n'a pas pu être enregistrée.");
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      if (!contract?.id || !contract?.signature_reference) {
        notify("error", "Erreur", "Informations de contrat manquantes.");
        console.error("❌ Contract data:", {
          id: contract?.id,
          signature_reference: contract?.signature_reference,
          has_id: !!contract?.id,
          has_signature_reference: !!contract?.signature_reference
        });
        return;
      }

      notify("info", "Téléchargement en cours", "Veuillez patienter...");

      const blob = await ContractsAPI.downloadContractPdf(contract.id, contract.signature_reference);

      // Créer un lien temporaire pour télécharger le fichier
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrat-${contract.contract_number || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notify("success", "Téléchargement réussi", "Le contrat a été téléchargé avec succès.");
    } catch (err) {
      console.error("Erreur lors du téléchargement du PDF :", err);
      notify("error", "Erreur", `Impossible de télécharger le PDF: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <SpinnerOne />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-lg rounded-2xl border border-error-100 bg-white p-8 text-center shadow-theme-md">
          <h1 className="text-xl font-semibold text-gray-900">Lien de signature invalide</h1>
          <p className="mt-3 text-sm text-gray-600">{error ?? "Nous ne parvenons pas à afficher ce contrat."}</p>
        </div>
      </div>
    );
  }

  const handleCloseModal = () => {
    setModalOpen(false);
    setAcceptedTerms(false);
  };

  const legalModal = (
    <Modal isOpen={modalOpen} onClose={handleCloseModal} className="max-w-2xl w-full p-6 !bg-white" showCloseButton={false}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-900">Confirmation de signature</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-600">
            En validant la signature électronique de ce document, le signataire reconnaît expressément avoir pris
            connaissance de l'ensemble de son contenu et en accepter toutes les dispositions sans réserve.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-600">
            Cette signature constitue un engagement ferme et définitif entre les parties.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-600">
            Le document signé électroniquement est conservé de manière sécurisée afin de garantir son intégrité et sa
            valeur probante.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="accept-terms"
              checked={acceptedTerms}
              onChange={(checked) => setAcceptedTerms(checked)}
              disabled={signing}
              className="!border-gray-300 dark:!border-gray-300"
            />
            <Label htmlFor="accept-terms" className="!mb-0 !text-sm !text-gray-700 dark:!text-gray-700 cursor-pointer">
              <strong>J'accepte</strong> les conditions générales et je confirme avoir lu et compris l'intégralité du contrat.
            </Label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCloseModal}
            disabled={signing}
            className="!bg-white !text-gray-700 !ring-gray-300 hover:!bg-gray-50 dark:!bg-white dark:!text-gray-700 dark:!ring-gray-300 dark:hover:!bg-gray-50"
          >
            Annuler
          </Button>
          <Button onClick={handleConfirmSignature} disabled={signing || !acceptedTerms}>
            {signing ? "Signature..." : "Je signe"}
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4">
        <header className="space-y-3 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Contrat de location</h1>
          <p className="text-sm text-gray-600">
            Contrat n° {contract.contract_number ?? "-"} — {formatDateTime(contract.created_at)}
          </p>
          {isSigned && (
            <div className="inline-flex items-center gap-2 rounded-full bg-success-100 px-4 py-2 text-sm font-medium text-success-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Contrat signé électroniquement
            </div>
          )}
        </header>

        {daysRemaining !== null && daysRemaining > 0 && !isSigned && !isDisabled && (
          <Alert
            variant="info"
            title="Validité du lien de signature"
            message={
              daysRemaining === 1
                ? "Ce lien de signature expire dans 1 jour. Veuillez signer le contrat avant son expiration."
                : `Ce lien de signature expire dans ${daysRemaining} jours. Veuillez signer le contrat avant son expiration.`
            }
          />
        )}

        {daysRemaining !== null && daysRemaining <= 0 && !isSigned && !isDisabled && (
          <Alert
            variant="error"
            title="Lien expiré"
            message="Ce lien de signature a expiré. Veuillez contacter l'entreprise pour obtenir un nouveau lien."
          />
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
          <h2 className="text-base font-semibold text-gray-900">Informations client</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Nom complet</p>
              <p className="mt-1 text-sm text-gray-800">{customerName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Email</p>
              <p className="mt-1 text-sm text-gray-800">{contract.customer_email || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Téléphone</p>
              <p className="mt-1 text-sm text-gray-800">{contract.customer_phone || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Adresse</p>
              <p className="mt-1 text-sm text-gray-800">{contract.customer_address || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Ville</p>
              <p className="mt-1 text-sm text-gray-800">{contract.customer_city || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Code postal</p>
              <p className="mt-1 text-sm text-gray-800">{contract.customer_postal_code || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Pays</p>
              <p className="mt-1 text-sm text-gray-800">{contract.customer_country || "-"}</p>
            </div>
            {contract.customer_birthday && (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Date de naissance</p>
                <p className="mt-1 text-sm text-gray-800">{formatDate(contract.customer_birthday)}</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
          <h2 className="text-base font-semibold text-gray-900">Détails du contrat</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Type de contrat</p>
              <p className="mt-1 text-sm text-gray-800">{contract.contract_type?.name || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Période de location</p>
              <p className="mt-1 text-sm text-gray-800">
                {formatDateTime(contract.start_datetime)} — {formatDateTime(contract.end_datetime)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Méthode de paiement caution</p>
              <p className="mt-1 text-sm text-gray-800">
                {(contract.deposit_payment_method ?? "").toLowerCase() === "cash"
                  ? "Espèces"
                  : (contract.deposit_payment_method ?? "").toLowerCase() === "card"
                  ? "Carte bancaire"
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Date de création</p>
              <p className="mt-1 text-sm text-gray-800">{formatDateTime(contract.created_at)}</p>
            </div>
          </div>
        </section>

        {contract.package && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
            <h2 className="text-base font-semibold text-gray-900">Forfait</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Nom du forfait</p>
                <p className="mt-1 text-sm text-gray-800">{contract.package.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Nombre de robes incluses</p>
                <p className="mt-1 text-sm text-gray-800">
                  {contract.package.num_dresses ?? "-"} {contract.package.num_dresses && contract.package.num_dresses > 1 ? "robes" : contract.package.num_dresses === 1 ? "robe" : ""}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Prix HT</p>
                <p className="mt-1 text-sm text-gray-800">{formatCurrency(contract.package.price_ht)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Prix TTC</p>
                <p className="mt-1 text-sm text-gray-800">{formatCurrency(contract.package.price_ttc)}</p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
          <h2 className="text-base font-semibold text-gray-900">Récapitulatif financier</h2>
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Montant total</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Total HT</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(contract.total_price_ht)}</p>
                </div>
                <div className="rounded-lg bg-brand-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Total TTC</p>
                  <p className="mt-1 text-lg font-semibold text-brand-700">{formatCurrency(contract.total_price_ttc)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Acompte</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Acompte HT</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(contract.account_ht)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Acompte TTC</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(contract.account_ttc)}</p>
                </div>
                <div className="rounded-lg bg-success-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Payé HT</p>
                  <p className="mt-1 text-sm font-semibold text-success-700">{formatCurrency(contract.account_paid_ht)}</p>
                </div>
                <div className="rounded-lg bg-success-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Payé TTC</p>
                  <p className="mt-1 text-sm font-semibold text-success-700">{formatCurrency(contract.account_paid_ttc)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Caution</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Caution HT</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(contract.caution_ht)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Caution TTC</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(contract.caution_ttc)}</p>
                </div>
                <div className="rounded-lg bg-success-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Payée HT</p>
                  <p className="mt-1 text-sm font-semibold text-success-700">{formatCurrency(contract.caution_paid_ht)}</p>
                </div>
                <div className="rounded-lg bg-success-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Payée TTC</p>
                  <p className="mt-1 text-sm font-semibold text-success-700">{formatCurrency(contract.caution_paid_ttc)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {dresses.length ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
            <h2 className="text-base font-semibold text-gray-900">Robes incluses ({dresses.length})</h2>
            <div className="mt-4 space-y-4">
              {dresses.map((dress) => (
                <div
                  key={dress.id ?? dress.reference}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-start sm:gap-6"
                >
                  {dress.images && dress.images.length > 0 && (
                    <div className="flex-shrink-0 overflow-hidden rounded-lg sm:w-32 sm:h-32">
                      <img
                        src={dress.images[0]}
                        alt={dress.name ?? "Robe"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="mb-1 font-medium text-gray-800 text-lg dark:text-white/90">
                      {dress.name ?? "Robe"}
                    </h4>
                    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                      Réf. {dress.reference ?? "-"}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400">
                      {dress.type_name && (
                        <div>
                          <span className="font-medium">Type:</span>
                          <span className="ml-1">{dress.type_name}</span>
                        </div>
                      )}
                      {dress.size_name && (
                        <div>
                          <span className="font-medium">Taille:</span>
                          <span className="ml-1">{dress.size_name}</span>
                        </div>
                      )}
                      {dress.color_name && (
                        <div>
                          <span className="font-medium">Couleur:</span>
                          <span className="ml-1">{dress.color_name}</span>
                        </div>
                      )}
                      {dress.condition_name && (
                        <div>
                          <span className="font-medium">État:</span>
                          <span className="ml-1">{dress.condition_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {addons.length ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
            <h2 className="text-base font-semibold text-gray-900">Options</h2>
            <div className="mt-4 space-y-3">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{addon.name}</p>
                    {addon.description && (
                      <p className="text-xs text-gray-600">{addon.description}</p>
                    )}
                    <p className={`text-xs ${getAddonLabel(addon.id).color}`}>{getAddonLabel(addon.id).text}</p>
                  </div>
                  <p className="ml-3 text-xs text-gray-500">{formatCurrency(addon.price_ttc)} TTC</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {contract.contract_type?.name?.toLowerCase().includes("forfait") ||
        contract.contract_type?.name?.toLowerCase().includes("negafa") ? (
          <ContractTemplateNegafa />
        ) : (
          <ContractTemplateLocation />
        )}

        {/* <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
          <article className="space-y-4 text-sm leading-relaxed text-gray-700">
            <p><strong>Entre les soussignés :</strong></p>
            <p>
              La société ALLURE CREATION, Société par actions simplifiée (SAS) immatriculée au registre du commerce et
              des sociétés sous le numéro 9852878800014 ayant son siège social au 4 avenue Laurent Cély 92600 Asnières
              sur Seine, représentée par Hassna NAFILI en qualité de gérante, ci-après dénommée « le Prestataire » ALLURE
              CREATION.
            </p>
            <p><strong>Article 1 : Description</strong></p>
            <p>
              Ce Contrat a pour objet de définir les modalités suivant lesquelles le prestataire fournira à ses clients,
              qui l’acceptent, un ensemble de services en lien avec la tenue de manifestations festives qu’ils auront
              organisées.
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Location des robes mariée et les bijoux ainsi que les accessoires (voiles, jupons).</li>
              <li>Location robes invitées.</li>
            </ul>
            <p><strong>Article 2 : Conditions financières et caution</strong></p>
            <p>
              Un acompte de la moitié (50%) du montant total de la location sera versé par le client le jour de la
              signature du contrat et le reste le jour où la robe est récupérée, accompagné d’une caution. Seules les
              cautions en empreinte bancaire ou en espèces sont acceptées.
            </p>
            <p><strong>Article 3 : Résiliation - Annulation</strong></p>
            <p>
              Nos contrats sont fermes et définitifs. En cas d’annulation, l’acompte de 50% reste acquis. La
              responsabilité du prestataire ne pourra être engagée en cas de force majeure.
            </p>
            <p><strong>Article 4 : Responsabilité des parties</strong></p>
            <p>
              En cas de perte, de dégât ou de vol, la caution bancaire sera conservée. Si un article est réparable, le
              montant des retouches sera déduit de la caution. En cas de non restitution, le prix d’achat pourra être
              réclamé.
            </p>
            <p><strong>Article 5 : Restitution</strong></p>
            <p>Le bien doit être restitué le dimanche (pour les locations week-end) aux heures d’ouverture.</p>
            <p><strong>Article 6 : Retard</strong></p>
            <p>
              Tout retard de restitution entraîne des pénalités : 50 € par jour et par robe invitée, 100 € par jour et par
              robe mariée.
            </p>
            <p><strong>Article 7 : Remplacement</strong></p>
            <p>
              En cas d’impossibilité de fournir le bien réservé, un bien de même catégorie ou de qualité supérieure sera
              proposé.
            </p>
            <p><strong>Article 8 : Housse et cintre</strong></p>
            <p>La non restitution de la housse ou du cintre entraînera une indemnité forfaitaire de 50 €.</p>
          </article>
        </section> */}

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm print:hidden">
          <p className="text-sm text-gray-600">
            En cliquant sur « Signer », vous confirmez votre accord pour l'intégralité des clauses ci-dessus.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => setModalOpen(true)} disabled={isSigned || isDisabled}>
              {isDisabled ? "Contrat désactivé" : isSigned ? "Contrat déjà signé" : "Signer électroniquement"}
            </Button>
            {isSigned && (
              <>
                <Button onClick={handlePrint} variant="outline">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimer le contrat
                </Button>
                <Button onClick={handleDownload}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Télécharger en PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {legalModal}
    </div>
  );
}
