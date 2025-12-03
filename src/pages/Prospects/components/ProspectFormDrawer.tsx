import { useMemo } from "react";
import RightDrawer from "../../../components/ui/drawer/RightDrawer";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import type { Prospect, ProspectStatus } from "../../../api/endpoints/prospects";
import { formatCurrency } from "../../../utils/formatters";

type DressReservationForm = {
  clientId: string;
  id?: string;
  dress_id: string;
  dress?: {
    name?: string | null;
    reference?: string | null;
    price_per_day_ttc?: number | string | null;
    type?: { name?: string | null } | null;
    size?: { name?: string | null } | null;
    color?: { name?: string | null } | null;
    condition?: { name?: string | null } | null;
  } | null;
  rental_start_date: string;
  rental_end_date: string;
  notes: string;
};

type ProspectFormState = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  status: ProspectStatus;
  source: string;
  notes: string;
  dressReservations: DressReservationForm[];
};

interface ProspectFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editingProspect: Prospect | null;
  formState: ProspectFormState;
  onFormChange: (field: keyof ProspectFormState, value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  onAddReservation: () => void;
  onRemoveReservation: (reservationId: string) => void;
  onReservationFieldChange: (
    reservationId: string,
    field: "rental_start_date" | "rental_end_date" | "notes",
    value: string
  ) => void;
  onOpenDressPicker: (reservationId: string) => void;
  computeLocalReservationEstimates: (reservation: DressReservationForm) => { rentalDays: number; estimatedCost: number };
}

export default function ProspectFormDrawer({
  isOpen,
  onClose,
  editingProspect,
  formState,
  onFormChange,
  onSubmit,
  submitting,
  onAddReservation,
  onRemoveReservation,
  onReservationFieldChange,
  onOpenDressPicker,
  computeLocalReservationEstimates,
}: ProspectFormDrawerProps) {
  const totalLocalEstimatedCost = useMemo(
    () =>
      formState.dressReservations.reduce((acc, reservation) => {
        const { estimatedCost } = computeLocalReservationEstimates(reservation);
        return acc + estimatedCost;
      }, 0),
    [formState.dressReservations, computeLocalReservationEstimates]
  );

  return (
    <RightDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingProspect ? "Modifier le prospect" : "Nouveau prospect"}
      description={editingProspect?.email ?? undefined}
      widthClassName="w-full max-w-3xl"
    >
      <div className="space-y-6">
        {/* Section Informations personnelles */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50/80 to-white/50 px-5 py-4 dark:border-gray-800 dark:from-blue-950/10 dark:to-white/[0.01]">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Informations personnelles
            </h3>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstname">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstname"
                  type="text"
                  value={formState.firstname}
                  onChange={(e) => onFormChange("firstname", e.target.value)}
                  placeholder="Marie"
                  className={!formState.firstname && formState.email ? "border-red-300 dark:border-red-700" : ""}
                />
              </div>

              <div>
                <Label htmlFor="lastname">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastname"
                  type="text"
                  value={formState.lastname}
                  onChange={(e) => onFormChange("lastname", e.target.value)}
                  placeholder="Dupont"
                  className={!formState.lastname && formState.email ? "border-red-300 dark:border-red-700" : ""}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(e) => onFormChange("email", e.target.value)}
                placeholder="marie.dupont@example.com"
                className={!formState.email && formState.firstname ? "border-red-300 dark:border-red-700" : ""}
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formState.phone}
                onChange={(e) => onFormChange("phone", e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>
        </div>

        {/* Section Qualification */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
          <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50/80 to-white/50 px-5 py-4 dark:border-gray-800 dark:from-purple-950/10 dark:to-white/[0.01]">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Qualification
            </h3>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="status-form">Statut</Label>
                <Select
                  value={formState.status}
                  onChange={(value) => onFormChange("status", value as ProspectStatus)}
                  options={[
                    { value: "new", label: "Nouveau" },
                    { value: "contacted", label: "Contacté" },
                    { value: "qualified", label: "Qualifié" },
                    { value: "converted", label: "Converti" },
                    { value: "lost", label: "Perdu" },
                  ]}
                />
              </div>

              <div>
                <Label htmlFor="source">Source d'acquisition</Label>
                <Input
                  id="source"
                  type="text"
                  value={formState.source}
                  onChange={(e) => onFormChange("source", e.target.value)}
                  placeholder="Ex: Site web, Instagram"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes internes</Label>
              <textarea
                id="notes"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800"
                rows={3}
                value={formState.notes}
                onChange={(e) => onFormChange("notes", e.target.value)}
                placeholder="Besoins spécifiques, préférences..."
              />
            </div>
          </div>
        </div>

        {/* Section Réservations */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
          <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50/80 to-white/50 px-5 py-4 dark:border-gray-800 dark:from-amber-950/10 dark:to-white/[0.01]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Réservations de robes
              </h3>
              {totalLocalEstimatedCost > 0 && (
                <div className="rounded-lg bg-amber-100 px-3 py-1 dark:bg-amber-900/30">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    {formatCurrency(totalLocalEstimatedCost)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 p-6">
            {formState.dressReservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center dark:border-gray-700 dark:bg-white/[0.02]">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aucune robe associée</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ajoutez une réservation pour estimer le coût
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {formState.dressReservations.map((reservation, index) => {
                  const { rentalDays, estimatedCost } = computeLocalReservationEstimates(reservation);
                  const hasValidDates = reservation.rental_start_date && reservation.rental_end_date && rentalDays > 0;
                  return (
                    <div
                      key={reservation.clientId}
                      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                              {index + 1}
                            </span>
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {reservation.dress?.name || "Robe non sélectionnée"}
                            </p>
                          </div>
                          {reservation.dress?.reference && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Réf. {reservation.dress.reference}
                              {reservation.dress?.price_per_day_ttc && (
                                <span className="ml-2">• {formatCurrency(reservation.dress.price_per_day_ttc)}/jour</span>
                              )}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveReservation(reservation.clientId)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenDressPicker(reservation.clientId)}
                          className="w-full"
                        >
                          {reservation.dress ? "Changer de robe" : "Sélectionner une robe"}
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Date de début</Label>
                          <Input
                            type="date"
                            value={reservation.rental_start_date}
                            onChange={(event) =>
                              onReservationFieldChange(reservation.clientId, "rental_start_date", event.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Date de fin</Label>
                          <Input
                            type="date"
                            value={reservation.rental_end_date}
                            onChange={(event) =>
                              onReservationFieldChange(reservation.clientId, "rental_end_date", event.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Notes (optionnel)</Label>
                        <textarea
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          rows={2}
                          value={reservation.notes}
                          onChange={(event) => onReservationFieldChange(reservation.clientId, "notes", event.target.value)}
                          placeholder="Précisions..."
                        />
                      </div>

                      {hasValidDates && (
                        <div className="mt-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-brand-50 to-indigo-50 p-3 dark:from-brand-900/20 dark:to-indigo-900/20">
                          <div className="text-xs">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Durée:</span>
                            <span className="ml-1 text-gray-900 dark:text-white">
                              {rentalDays} jour{rentalDays > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Estimation</p>
                            <p className="text-base font-bold text-brand-700 dark:text-brand-400">
                              {formatCurrency(estimatedCost)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <Button type="button" variant="outline" onClick={onAddReservation} disabled={submitting} className="w-full">
              Ajouter une réservation
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <Button onClick={onSubmit} disabled={submitting} className="flex-1">
            {submitting ? "Enregistrement..." : editingProspect ? "Mettre à jour" : "Créer"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
        </div>
      </div>
    </RightDrawer>
  );
}
