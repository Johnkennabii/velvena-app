import RightDrawer from "../../../components/ui/drawer/RightDrawer";
import Badge from "../../../components/ui/badge/Badge";
import { formatCurrency, formatDateShort, formatDateTimeShort } from "../../../utils/formatters";
import type { Prospect, ProspectStatus, RequestStatus } from "../../../api/endpoints/prospects";

interface ProspectDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: Prospect | null;
}

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

const requestStatusLabels: Record<RequestStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  confirmed: "Confirmée",
  cancelled: "Annulée",
};

const requestStatusColors: Record<RequestStatus, "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"> = {
  draft: "light",
  sent: "info",
  confirmed: "success",
  cancelled: "error",
};

export default function ProspectDetailsDrawer({
  isOpen,
  onClose,
  prospect,
}: ProspectDetailsDrawerProps) {
  if (!prospect) return null;

  const totalEstimatedCost = prospect.total_estimated_cost ??
    (prospect.dress_reservations?.reduce((acc, r) => acc + (r.estimated_cost || 0), 0) ?? 0);

  return (
    <RightDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${prospect.firstname} ${prospect.lastname}`}
      description={prospect.email}
      widthClassName="w-full max-w-3xl"
    >
      <div className="space-y-6">
        {/* Badge de statut */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <Badge color={statusColors[prospect.status]}>
            {statusLabels[prospect.status]}
          </Badge>
        </div>

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
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Prénom</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {prospect.firstname}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Nom</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {prospect.lastname}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {prospect.email}
              </p>
            </div>

            {prospect.phone && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Téléphone</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {prospect.phone}
                </p>
              </div>
            )}
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
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Statut</p>
                <div className="mt-1">
                  <Badge color={statusColors[prospect.status]}>
                    {statusLabels[prospect.status]}
                  </Badge>
                </div>
              </div>

              {prospect.source && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Source d'acquisition</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {prospect.source}
                  </p>
                </div>
              )}
            </div>

            {prospect.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes internes</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {prospect.notes}
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Créé le</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDateTimeShort(prospect.created_at)}
                </p>
              </div>

              {prospect.updated_at && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Dernière mise à jour</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDateTimeShort(prospect.updated_at)}
                  </p>
                </div>
              )}
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
              {totalEstimatedCost > 0 && (
                <div className="rounded-lg bg-amber-100 px-3 py-1 dark:bg-amber-900/30">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    {formatCurrency(totalEstimatedCost)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 p-6">
            {!prospect.dress_reservations || prospect.dress_reservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center dark:border-gray-700 dark:bg-white/[0.02]">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Aucune réservation
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ce prospect n'a pas encore de réservations
                  </p>
                </div>
              </div>
            ) : (
              prospect.dress_reservations.map((reservation, index) => (
                <div
                  key={reservation.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50"
                >
                  {/* Header de la carte */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                          {index + 1}
                        </span>
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {reservation.dress?.name || "Robe"}
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
                  </div>

                  {/* Détails de la robe */}
                  {reservation.dress && (
                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.02]">
                      {reservation.dress.type?.name && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {reservation.dress.type.name}
                          </p>
                        </div>
                      )}
                      {reservation.dress.size?.name && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Taille</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {reservation.dress.size.name}
                          </p>
                        </div>
                      )}
                      {reservation.dress.color?.name && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Couleur</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {reservation.dress.color.name}
                          </p>
                        </div>
                      )}
                      {reservation.dress.condition?.name && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">État</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {reservation.dress.condition.name}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dates de location */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Date de début</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDateShort(reservation.rental_start_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Date de fin</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDateShort(reservation.rental_end_date)}
                      </p>
                    </div>
                  </div>

                  {/* Récapitulatif */}
                  {(reservation.rental_days || reservation.estimated_cost) && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-brand-50 to-indigo-50 p-3 dark:from-brand-900/20 dark:to-indigo-900/20">
                      {reservation.rental_days && (
                        <div className="text-xs">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Durée:
                          </span>
                          <span className="ml-1 text-gray-900 dark:text-white">
                            {reservation.rental_days} jour{reservation.rental_days > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {reservation.estimated_cost && (
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Estimation
                          </p>
                          <p className="text-base font-bold text-brand-700 dark:text-brand-400">
                            {formatCurrency(reservation.estimated_cost)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {reservation.notes && (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-white/[0.02]">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Notes
                      </p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {reservation.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section Demandes (Nouveau système) */}
        {prospect.requests && prospect.requests.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-gray-200/70 dark:bg-white/[0.03] dark:ring-white/10">
            <div className="border-b border-gray-200 bg-gradient-to-r from-green-50/80 to-white/50 px-5 py-4 dark:border-gray-800 dark:from-green-950/10 dark:to-white/[0.01]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Demandes de location
                </h3>
                <Badge color="info">
                  {prospect.requests.length} demande{prospect.requests.length > 1 ? "s" : ""}
                </Badge>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {prospect.requests.map((request) => (
                <div
                  key={request.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/50"
                >
                  {/* Header de la demande */}
                  <div className="border-b border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            Demande #{request.request_number}
                          </p>
                          <Badge color={requestStatusColors[request.status]}>
                            {requestStatusLabels[request.status]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Créée le {formatDateTimeShort(request.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Total
                        </p>
                        <p className="text-lg font-bold text-brand-700 dark:text-brand-400">
                          {formatCurrency(request.total_estimated_ttc)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          HT: {formatCurrency(request.total_estimated_ht)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Liste des robes de la demande */}
                  <div className="p-4 space-y-3">
                    {request.dresses.map((requestDress, index) => (
                      <div
                        key={requestDress.id}
                        className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/30"
                      >
                        {/* Info robe */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                                {index + 1}
                              </span>
                              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                {requestDress.dress?.name || "Robe"}
                              </p>
                            </div>
                            {requestDress.dress?.reference && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Réf. {requestDress.dress.reference}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Détails de la robe */}
                        {requestDress.dress && (
                          <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2 text-xs dark:bg-white/[0.02]">
                            {requestDress.dress.type?.name && (
                              <div>
                                <p className="font-medium text-gray-500 dark:text-gray-400">Type</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {requestDress.dress.type.name}
                                </p>
                              </div>
                            )}
                            {requestDress.dress.size?.name && (
                              <div>
                                <p className="font-medium text-gray-500 dark:text-gray-400">Taille</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {requestDress.dress.size.name}
                                </p>
                              </div>
                            )}
                            {requestDress.dress.color?.name && (
                              <div>
                                <p className="font-medium text-gray-500 dark:text-gray-400">Couleur</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {requestDress.dress.color.name}
                                </p>
                              </div>
                            )}
                            {requestDress.dress.condition?.name && (
                              <div>
                                <p className="font-medium text-gray-500 dark:text-gray-400">État</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {requestDress.dress.condition.name}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Dates et prix */}
                        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-gradient-to-r from-brand-50 to-indigo-50 p-2 text-xs dark:from-brand-900/20 dark:to-indigo-900/20">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-gray-600 dark:text-gray-400">Du</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatDateShort(requestDress.rental_start_date)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-600 dark:text-gray-400">Au</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatDateShort(requestDress.rental_end_date)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-600 dark:text-gray-400">Durée</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {requestDress.rental_days} jour{requestDress.rental_days > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                              Prix TTC
                            </p>
                            <p className="text-sm font-bold text-brand-700 dark:text-brand-400">
                              {formatCurrency(requestDress.estimated_price_ttc)}
                            </p>
                          </div>
                        </div>

                        {/* Notes de la robe */}
                        {requestDress.notes && (
                          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50/50 p-2 dark:border-gray-700 dark:bg-white/[0.02]">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Notes
                            </p>
                            <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                              {requestDress.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Notes de la demande */}
                  {request.notes && (
                    <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Notes de la demande
                      </p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {request.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RightDrawer>
  );
}
