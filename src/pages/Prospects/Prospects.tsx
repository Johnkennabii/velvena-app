import type React from "react";
import { useCallback, useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import PaginationWithIcon from "../../components/tables/DataTables/TableOne/PaginationWithIcon";
import { useNotification } from "../../context/NotificationContext";
import { useProspects } from "../../context/ProspectsContext";
import {
  ProspectsAPI,
  type Prospect,
  type ProspectStatus,
  type ProspectPayload,
  type ProspectDressReservation,
} from "../../api/endpoints/prospects";
import { DressesAPI } from "../../api/endpoints/dresses";
import type { DressComboboxOption } from "../../components/form/DressCombobox";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { IoEyeOutline } from "react-icons/io5";
import { formatCurrency, formatDateTimeShort } from "../../utils/formatters";
import ProspectFormDrawer, { type DressReservationForm, type ProspectFormState } from "./components/ProspectFormDrawer";
import ProspectDetailsDrawer from "./components/ProspectDetailsDrawer";

interface ProspectRow extends Prospect {
  fullName: string;
  createdLabel: string;
  reservationCount: number;
  totalEstimatedCostValue: number;
}

type ConfirmState = {
  mode: "soft" | "hard" | "convert";
  prospect: ProspectRow | null;
};

const createDefaultFormState = (): ProspectFormState => ({
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  status: "new",
  source: "",
  notes: "",
  dressReservations: [],
});

const statusLabels: Record<ProspectStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  converted: "Converti",
  lost: "Perdu",
};

const statusColors: Record<ProspectStatus, "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"> = {
  new: "info",
  contacted: "warning",
  qualified: "success",
  converted: "primary",
  lost: "error",
};

const createClientReservationId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const buildEmptyReservation = (): DressReservationForm => ({
  clientId: createClientReservationId(),
  dress_id: "",
  dress: null,
  rental_start_date: "",
  rental_end_date: "",
  notes: "",
});

const parseDateInput = (value: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  // Utiliser UTC pour éviter les problèmes de fuseau horaire
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return Number.isNaN(date.getTime()) ? null : date;
};

const computeRentalDaysFromInput = (start: string, end: string): number => {
  const startDate = parseDateInput(start);
  const endDate = parseDateInput(end);
  if (!startDate || !endDate) return 0;
  const diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) return 0;
  // Calcul inclusif : du 1er au 2 = 2 jours (1er + 2ème)
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

const toNumericValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const computeLocalReservationEstimates = (reservation: DressReservationForm) => {
  const rentalDays = computeRentalDaysFromInput(reservation.rental_start_date, reservation.rental_end_date);
  const pricePerDay = reservation.dress ? toNumericValue(reservation.dress.price_per_day_ttc ?? 0) : 0;
  const estimatedCost = rentalDays * pricePerDay;
  return { rentalDays, estimatedCost };
};

const Prospects: React.FC = () => {
  const { notify } = useNotification();
  const { refreshNewProspectsCount } = useProspects();

  // États
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // Modales et formulaires
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [formState, setFormState] = useState<ProspectFormState>(createDefaultFormState);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingProspect, setViewingProspect] = useState<Prospect | null>(null);
  const [dressOptions, setDressOptions] = useState<DressComboboxOption[]>([]);

  // Charger les prospects
  const loadProspects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ProspectsAPI.list({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        page,
        limit,
      });
      setProspects(response.data);
      setTotal(response.pagination.total);
    } catch (error: any) {
      notify("error", "Erreur", error.message || "Impossible de charger les prospects");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, page, limit, notify]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  // Charger les robes disponibles avec vérification de disponibilité par dates
  const loadDressOptionsWithAvailability = useCallback(async (_reservationId: string, startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      // Si pas de dates, on charge toutes les robes sans vérification de disponibilité
      try {
        const response = await DressesAPI.listDetails({ limit: 1000 });
        const options: DressComboboxOption[] = response.data.map((dress) => ({
          id: dress.id,
          name: dress.name,
          reference: dress.reference,
          isAvailable: true,
        }));
        setDressOptions(options);
      } catch (error: any) {
        console.error("Error loading dress options:", error);
        notify("error", "Erreur", "Impossible de charger les robes");
      }
      return;
    }

    // Vérifier la disponibilité avec les dates
    try {
      const response = await DressesAPI.listAvailability(startDate, endDate);
      const options: DressComboboxOption[] = response.data.map((dress) => ({
        id: dress.id,
        name: dress.name || "",
        reference: dress.reference || "",
        isAvailable: dress.isAvailable,
      }));
      setDressOptions(options);
    } catch (error: any) {
      console.error("Error loading dress availability:", error);
      notify("error", "Erreur", "Impossible de vérifier la disponibilité des robes");
    }
  }, [notify]);

  // Charger toutes les robes au départ
  useEffect(() => {
    loadDressOptionsWithAvailability("", "", "");
  }, [loadDressOptionsWithAvailability]);

  // Gestion du formulaire
  const openDrawerForCreate = () => {
    setEditingProspect(null);
    setFormState(createDefaultFormState());
    setIsDrawerOpen(true);
  };

  const openDrawerForEdit = (prospect: Prospect) => {
    setEditingProspect(prospect);
    const mappedReservations: DressReservationForm[] = (prospect.dress_reservations ?? []).map(
      (reservation: ProspectDressReservation) => ({
        clientId: reservation.id ?? createClientReservationId(),
        id: reservation.id,
        dress_id: reservation.dress_id,
        dress: reservation.dress ?? null,
        rental_start_date: reservation.rental_start_date ? reservation.rental_start_date.slice(0, 10) : "",
        rental_end_date: reservation.rental_end_date ? reservation.rental_end_date.slice(0, 10) : "",
        notes: reservation.notes ?? "",
      }),
    );
    setFormState({
      firstname: prospect.firstname,
      lastname: prospect.lastname,
      email: prospect.email,
      phone: prospect.phone || "",
      status: prospect.status,
      source: prospect.source || "",
      notes: prospect.notes || "",
      dressReservations: mappedReservations,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProspect(null);
    setFormState(createDefaultFormState());
  };

  const handleFormChange = (field: keyof ProspectFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const openProspectDetails = (prospect: Prospect) => {
    setViewingProspect(prospect);
  };

  const closeProspectDetails = () => setViewingProspect(null);

  const handleAddReservation = () => {
    setFormState((prev) => ({
      ...prev,
      dressReservations: [...prev.dressReservations, buildEmptyReservation()],
    }));
  };

  const handleRemoveReservation = (reservationId: string) => {
    setFormState((prev) => ({
      ...prev,
      dressReservations: prev.dressReservations.filter((reservation) => reservation.clientId !== reservationId),
    }));
  };

  const handleReservationFieldChange = (
    reservationId: string,
    field: "rental_start_date" | "rental_end_date" | "notes",
    value: string,
  ) => {
    setFormState((prev) => ({
      ...prev,
      dressReservations: prev.dressReservations.map((reservation) =>
        reservation.clientId === reservationId ? { ...reservation, [field]: value } : reservation,
      ),
    }));
  };

  const handleDatesChange = (reservationId: string, startDate: string, endDate: string) => {
    // Charger les robes disponibles avec les nouvelles dates
    loadDressOptionsWithAvailability(reservationId, startDate, endDate);
  };

  const handleDressChange = async (reservationId: string, dressId: string) => {
    try {
      // Charger les détails de la robe sélectionnée
      const dress = await DressesAPI.getById(dressId);

      setFormState((prev) => ({
        ...prev,
        dressReservations: prev.dressReservations.map((reservation) =>
          reservation.clientId === reservationId
            ? {
                ...reservation,
                dress_id: dress.id,
                dress: {
                  id: dress.id,
                  name: dress.name,
                  reference: dress.reference,
                  price_per_day_ttc: toNumericValue(dress.price_per_day_ttc ?? dress.price_per_day_ht ?? 0),
                  price_per_day_ht: toNumericValue(dress.price_per_day_ht ?? 0),
                  type: dress.type ? { name: dress.type.name } : null,
                  size: dress.size ? { name: dress.size.name } : null,
                  color: dress.color ? { name: dress.color.name } : null,
                  condition: dress.condition ? { name: dress.condition.name } : null,
                },
              }
            : reservation,
        ),
      }));
    } catch (error: any) {
      notify("error", "Erreur", "Impossible de charger les détails de la robe");
    }
  };

  const handleSubmit = async () => {
    if (!formState.firstname || !formState.lastname || !formState.email) {
      notify("warning", "Champs requis", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    const hasIncompleteReservation = formState.dressReservations.some((reservation) => {
      if (!reservation.dress_id) return false;
      if (!reservation.rental_start_date || !reservation.rental_end_date) return true;
      return computeRentalDaysFromInput(reservation.rental_start_date, reservation.rental_end_date) <= 0;
    });

    if (hasIncompleteReservation) {
      notify(
        "warning",
        "Réservations incomplètes",
        "Chaque robe doit avoir une date de début et de fin valides. Veuillez compléter ou supprimer la ligne.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload: ProspectPayload = {
        firstname: formState.firstname,
        lastname: formState.lastname,
        email: formState.email,
        phone: formState.phone || null,
        status: formState.status,
        source: formState.source || null,
        notes: formState.notes || null,
      };
      const reservationsPayload = formState.dressReservations
        .filter((reservation) => reservation.dress_id && reservation.rental_start_date && reservation.rental_end_date)
        .map((reservation) => ({
          id: reservation.id && !reservation.id.startsWith("tmp-") ? reservation.id : undefined,
          dress_id: reservation.dress_id,
          rental_start_date: reservation.rental_start_date,
          rental_end_date: reservation.rental_end_date,
          notes: reservation.notes ? reservation.notes : null,
        }));
      if (reservationsPayload.length > 0) {
        payload.dress_reservations = reservationsPayload;
      }

      if (editingProspect) {
        await ProspectsAPI.update(editingProspect.id, payload);
        notify("success", "Prospect mis à jour", "Le prospect a été mis à jour avec succès");
      } else {
        await ProspectsAPI.create(payload);
        notify("success", "Prospect créé", "Le prospect a été créé avec succès");
      }

      closeDrawer();
      loadProspects();
      refreshNewProspectsCount();
    } catch (error: any) {
      notify("error", "Erreur", error.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (!confirmState?.prospect) return;

    setSubmitting(true);
    try {
      if (confirmState.mode === "soft") {
        await ProspectsAPI.softDelete(confirmState.prospect.id);
        notify("success", "Prospect supprimé", "Le prospect a été archivé");
      } else if (confirmState.mode === "hard") {
        await ProspectsAPI.hardDelete(confirmState.prospect.id);
        notify("success", "Prospect supprimé", "Le prospect a été supprimé définitivement");
      }

      setConfirmState(null);
      loadProspects();
      refreshNewProspectsCount();
    } catch (error: any) {
      notify("error", "Erreur", error.message || "Impossible de supprimer le prospect");
    } finally {
      setSubmitting(false);
    }
  };

  // Conversion en client
  const handleConvert = async () => {
    if (!confirmState?.prospect) return;

    setSubmitting(true);
    try {
      await ProspectsAPI.convertToCustomer(confirmState.prospect.id);
      notify("success", "Conversion réussie", "Le prospect a été converti en client");
      setConfirmState(null);
      loadProspects();
      refreshNewProspectsCount();
    } catch (error: any) {
      // Parser le message d'erreur qui peut être du JSON
      let errorData: any = {};
      try {
        errorData = JSON.parse(error.message || "{}");
      } catch {
        errorData = { error: error.message };
      }

      // Gérer le cas où un client avec cet email existe déjà
      const errorMessage = errorData?.error || errorData?.message || error.message || "";

      if (errorMessage.toLowerCase().includes("already exists")) {
        const customerId = errorData?.customer_id;
        let message = "Un client avec cet email existe déjà.";

        if (customerId) {
          message += ` (ID: ${customerId.substring(0, 8)}...)`;
        }

        message += " Le prospect ne peut pas être converti. Veuillez vérifier les clients existants ou modifier l'email du prospect.";

        notify("warning", "Client existant", message);
      } else {
        notify("error", "Erreur de conversion", errorMessage || "Impossible de convertir le prospect");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Transformation des données
  const prospectRows: ProspectRow[] = prospects.map((prospect) => {
    const reservationCount =
      prospect.dress_reservations?.length ?? prospect._count?.dress_reservations ?? 0;
    const fallbackTotal =
      prospect.dress_reservations?.reduce(
        (acc, reservation) => acc + toNumericValue(reservation.estimated_cost ?? 0),
        0,
      ) ?? 0;
    const totalEstimatedCostValue =
      prospect.total_estimated_cost !== undefined && prospect.total_estimated_cost !== null
        ? toNumericValue(prospect.total_estimated_cost)
        : fallbackTotal;

    return {
      ...prospect,
      fullName: `${prospect.firstname} ${prospect.lastname}`,
      createdLabel: formatDateTimeShort(prospect.created_at),
      reservationCount,
      totalEstimatedCostValue,
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <PageMeta
        title="Prospects - Allure Creation"
        description="Gérer et suivre vos prospects avec Allure Creation"
      />
      <PageBreadcrumb pageTitle="Prospects" />

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Header avec recherche et filtres */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                type="text"
                placeholder="Nom, email, téléphone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as ProspectStatus | "");
                  setPage(1);
                }}
                options={[
                  { value: "new", label: "Nouveau" },
                  { value: "contacted", label: "Contacté" },
                  { value: "qualified", label: "Qualifié" },
                  { value: "converted", label: "Converti" },
                  { value: "lost", label: "Perdu" },
                ]}
                emptyOptionLabel="Tous"
              />
            </div>
          </div>
          <Button onClick={openDrawerForCreate}>Ajouter un prospect</Button>
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="flex w-full justify-center py-16">
            <SpinnerOne />
          </div>
        ) : prospectRows.length === 0 ? (
          <div className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
            <h4 className="text-base font-medium text-gray-800 dark:text-white/90">Aucun prospect trouvé</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ajustez votre recherche ou ajoutez un nouveau prospect.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <TableHeader className="bg-gray-50 dark:bg-white/[0.03]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Nom complet
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Téléphone
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Statut
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Source
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Robes
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Créé le
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent">
                  {prospectRows.map((prospect) => (
                    <TableRow key={prospect.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                      <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                        {prospect.fullName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {prospect.email || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {prospect.phone || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge color={statusColors[prospect.status]}>
                          {statusLabels[prospect.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {prospect.source || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {prospect.reservationCount > 0 ? (
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white/90">
                              {prospect.reservationCount} robe{prospect.reservationCount > 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Total {formatCurrency(prospect.totalEstimatedCostValue)}
                            </p>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {prospect.createdLabel}
                      </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openProspectDetails(prospect)}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                        >
                          <IoEyeOutline className="size-4" />
                          <span className="sr-only">Voir le prospect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openDrawerForEdit(prospect)}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                          aria-label="Modifier"
                          >
                            <PencilIcon className="size-4" />
                          </button>
                          {prospect.status !== "converted" && (
                            <button
                              type="button"
                              onClick={() => setConfirmState({ mode: "convert", prospect })}
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-green-200 text-green-600 transition hover:bg-green-50 hover:text-green-700 dark:border-green-800/60 dark:text-green-400 dark:hover:bg-green-900/30"
                              aria-label="Convertir en client"
                              title="Convertir en client"
                            >
                              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmState({ mode: "soft", prospect })}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-900/30"
                            aria-label="Supprimer"
                          >
                            <TrashBinIcon className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Page {page} / {totalPages} — {total} prospect{total > 1 ? "s" : ""}
              </p>
              <PaginationWithIcon
                key={page}
                initialPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Drawer pour créer/éditer */}
      <ProspectFormDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        editingProspect={editingProspect}
        formState={formState}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        submitting={submitting}
        onAddReservation={handleAddReservation}
        onRemoveReservation={handleRemoveReservation}
        onReservationFieldChange={handleReservationFieldChange}
        onDressChange={handleDressChange}
        onDatesChange={handleDatesChange}
        dressOptions={dressOptions}
        computeLocalReservationEstimates={computeLocalReservationEstimates}
      />

      {/* Modal de confirmation */}
      {confirmState && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmState(null)}
          className="max-w-md p-6"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {confirmState.mode === "convert"
                ? "Convertir en client"
                : confirmState.mode === "soft"
                ? "Archiver le prospect"
                : "Supprimer définitivement"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {confirmState.mode === "convert"
                ? `Voulez-vous vraiment convertir "${confirmState.prospect?.fullName}" en client ?`
                : confirmState.mode === "soft"
                ? `Voulez-vous archiver "${confirmState.prospect?.fullName}" ?`
                : `Voulez-vous supprimer définitivement "${confirmState.prospect?.fullName}" ? Cette action est irréversible.`}
            </p>
            <div className="flex gap-2">
              {confirmState.mode === "convert" ? (
                <Button
                  variant="primary"
                  onClick={handleConvert}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "Conversion..." : "Convertir"}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 !bg-red-600 hover:!bg-red-700"
                >
                  {submitting ? "Suppression..." : "Supprimer"}
                </Button>
              )}
              <Button variant="outline" onClick={() => setConfirmState(null)} disabled={submitting}>
                Annuler
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Drawer de visualisation du prospect */}
      <ProspectDetailsDrawer
        isOpen={!!viewingProspect}
        onClose={closeProspectDetails}
        prospect={viewingProspect}
      />
    </>
  );
};

export default Prospects;
