import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useNotification } from "../../context/NotificationContext";
import {
  ContractsAPI,
  type ContractAddon,
  type ContractDress,
  type ContractFullView,
} from "../../api/endpoints/contracts";
import ContractTemplateNegafa from "./ContractTemplateNegafa";
import ContractTemplateLocation from "./ContractTemplateLocation";

const formatCurrency = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(numeric);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
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

  const isSigned = useMemo(() => {
    if (!contract) return false;
    if (contract.deleted_at) return true;
    const status = (contract.status ?? "").toUpperCase();
    return SIGNED_STATUSES.has(status);
  }, [contract]);

  const handleConfirmSignature = async () => {
    if (!token) return;
    setSigning(true);
    try {
      const updated = await ContractsAPI.signByToken(token);
      setContract(updated);
      setModalOpen(false);
      notify("success", "Signature confirmée", "Le contrat a été signé électroniquement.");
    } catch (err) {
      console.error("Signature électronique impossible :", err);
      notify("error", "Erreur", "La signature électronique n'a pas pu être enregistrée.");
    } finally {
      setSigning(false);
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

  const legalModal = (
    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} className="max-w-2xl w-full p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Confirmation de signature</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            En validant la signature électronique de ce document, le signataire reconnaît expressément avoir pris
            connaissance de l’ensemble de son contenu et en accepter toutes les dispositions sans réserve.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Cette signature constitue un engagement ferme et définitif entre les parties.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Le document signé électroniquement est conservé de manière sécurisée afin de garantir son intégrité et sa
            valeur probante.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => setModalOpen(false)} disabled={signing}>
            Annuler
          </Button>
          <Button onClick={handleConfirmSignature} disabled={signing}>
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
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
          <h2 className="text-base font-semibold text-gray-900">Récapitulatif du contrat</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Client</p>
              <p className="mt-1 text-sm text-gray-800">{customerName}</p>
              <p className="text-xs text-gray-500">{contract.customer_email}</p>
              <p className="text-xs text-gray-500">{contract.customer_phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Période</p>
              <p className="mt-1 text-sm text-gray-800">
                {formatDate(contract.start_datetime)} — {formatDate(contract.end_datetime)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Montant TTC</p>
              <p className="mt-1 text-sm text-gray-800">{formatCurrency(contract.total_price_ttc)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Acompte TTC</p>
              <p className="mt-1 text-sm text-gray-800">{formatCurrency(contract.account_ttc)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Caution TTC</p>
              <p className="mt-1 text-sm text-gray-800">{formatCurrency(contract.caution_ttc)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Méthode de paiement</p>
              <p className="mt-1 text-sm text-gray-800">
                {(contract.deposit_payment_method ?? "").toLowerCase() === "cash"
                  ? "Espèces"
                  : (contract.deposit_payment_method ?? "").toLowerCase() === "card"
                  ? "Carte bancaire"
                  : "-"}
              </p>
            </div>
          </div>
        </section>

        {dresses.length ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
            <h2 className="text-base font-semibold text-gray-900">Robes incluses</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {dresses.map((dress) => (
                <div key={dress.id ?? dress.reference} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                  <p className="font-medium text-gray-900">{dress.name ?? "Robe"}</p>
                  <p className="text-xs text-gray-500">Réf. {dress.reference ?? "-"}</p>
                  <p className="text-xs text-gray-500">Prix journée TTC : {formatCurrency(dress.price_per_day_ttc)}</p>
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
                  <div>
                    <p className="font-medium text-gray-900">{addon.name}</p>
                    <p className="text-xs text-gray-500">{addon.included ? "Inclus" : "Optionnel"}</p>
                  </div>
                  <p className="text-xs text-gray-500">{formatCurrency(addon.price_ttc)} TTC</p>
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

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
          <p className="text-sm text-gray-600">
            En cliquant sur « Signer », vous confirmez votre accord pour l’intégralité des clauses ci-dessus.
          </p>
          <Button onClick={() => setModalOpen(true)} disabled={isSigned}>
            {isSigned ? "Contrat déjà signé" : "Signer électroniquement"}
          </Button>
        </div>
      </div>
      {legalModal}
    </div>
  );
}
