import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import { EventInput, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import { ContractsAPI, type ContractFullView } from "../api/endpoints/contracts";
import SpinnerOne from "../components/ui/spinner/SpinnerOne";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { formatCurrency, formatDateTime } from "../utils/formatters";

interface ContractEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    contract: ContractFullView;
    cautionPaid: boolean;
    isPackage: boolean;
  };
}

const statusConfig: Record<
  string,
  { label: string; color: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark" }
> = {
  DRAFT: { label: "Brouillon", color: "light" },
  PENDING: { label: "En attente", color: "warning" },
  PENDING_SIGNATURE: { label: "En attente de signature", color: "warning" },
  SIGNED: { label: "Signé", color: "success" },
  SIGNED_ELECTRONICALLY: { label: "Signé électroniquement", color: "success" },
  COMPLETED: { label: "Terminé", color: "success" },
  DISABLED: { label: "Désactivé", color: "error" },
  CANCELLED: { label: "Annulé", color: "error" },
};

const Calendar: React.FC = () => {
  const [selectedContract, setSelectedContract] = useState<ContractFullView | null>(null);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const navigate = useNavigate();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const response = await ContractsAPI.listAll();
      const contractEvents: ContractEvent[] = response
        .filter((contract: ContractFullView) => contract.start_datetime && contract.end_datetime)
        .map((contract: ContractFullView) => {
          const cautionTtc = Number(contract.caution_ttc) || 0;
          const cautionPaidTtc = Number(contract.caution_paid_ttc) || 0;
          const cautionPaid = cautionPaidTtc >= cautionTtc && cautionTtc > 0;
          const isPackage = Boolean(contract.package_id);

          const customerName =
            contract.customer_firstname && contract.customer_lastname
              ? `${contract.customer_firstname} ${contract.customer_lastname}`
              : "Client inconnu";

          return {
            id: contract.id,
            title: `${customerName} - ${contract.contract_number}`,
            start: contract.start_datetime,
            end: contract.end_datetime,
            extendedProps: {
              contract,
              cautionPaid,
              isPackage,
            },
          };
        });

      setEvents(contractEvents);
    } catch (error) {
      console.error("Erreur lors du chargement des contrats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const contract = clickInfo.event.extendedProps.contract as ContractFullView;
    setSelectedContract(contract);
    openModal();
  };

  const handleAddContract = () => {
    // Déclencher l'événement pour ouvrir le drawer de contrat
    window.dispatchEvent(new CustomEvent("open-contract-drawer", { detail: { mode: "daily" } }));

    // Naviguer vers le catalogue avec le state
    navigate("/catalogue", {
      state: {
        quickAction: "open-contract-drawer",
        mode: "daily",
      },
    });
  };


  return (
    <>
      <PageMeta
        title="Calendrier des contrats - Velvena App"
        description="Vue calendrier de tous les contrats de location"
      />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <SpinnerOne />
          </div>
        ) : (
          <div className="custom-calendar">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Calendrier des contrats</h2>
              <Button onClick={handleAddContract} variant="outline">
                Ajouter un contrat
              </Button>
            </div>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={frLocale}
              headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "Aujourd'hui",
                month: "Mois",
                week: "Semaine",
                day: "Jour",
              }}
              events={events}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              height="auto"
            />
          </div>
        )}

        {/* Modal de récapitulatif du contrat */}
        <Modal
          isOpen={isOpen}
          onClose={() => {
            closeModal();
            setSelectedContract(null);
          }}
          className="max-w-[800px] p-6 lg:p-10"
          showCloseButton={false}
        >
          {selectedContract && (
            <div className="flex flex-col overflow-y-auto custom-scrollbar max-h-[80vh]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h5 className="mb-2 font-semibold text-gray-800 text-theme-xl dark:text-white/90 lg:text-2xl">
                    Contrat {selectedContract.contract_number}
                  </h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedContract.customer_firstname && selectedContract.customer_lastname
                      ? `${selectedContract.customer_firstname} ${selectedContract.customer_lastname}`
                      : "Client inconnu"}
                  </p>
                </div>
                <Badge
                  color={
                    selectedContract.status && statusConfig[selectedContract.status]
                      ? statusConfig[selectedContract.status].color
                      : "light"
                  }
                >
                  {selectedContract.status && statusConfig[selectedContract.status]
                    ? statusConfig[selectedContract.status].label
                    : selectedContract.status || "N/A"}
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Début
                    </p>
                    <p className="text-base text-gray-900 dark:text-white">
                      {formatDateTime(selectedContract.start_datetime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Fin
                    </p>
                    <p className="text-base text-gray-900 dark:text-white">
                      {formatDateTime(selectedContract.end_datetime)}
                    </p>
                  </div>
                </div>

                {/* Type de location */}
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Type de location
                  </p>
                  <p className="text-base text-gray-900 dark:text-white">
                    {selectedContract.package_id ? (
                      <>
                        <span className="font-semibold text-green-600 dark:text-green-400">Forfait</span>
                        {(selectedContract as any).package_name && (
                          <span className="ml-1">- {(selectedContract as any).package_name}</span>
                        )}
                      </>
                    ) : (
                      "Location par jour"
                    )}
                  </p>
                </div>

                {/* Robes */}
                {selectedContract.dresses && selectedContract.dresses.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Robes
                    </p>
                    <div className="space-y-2">
                      {selectedContract.dresses.map((dress, index) => (
                        <div
                          key={dress.id || index}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        >
                          <span className="text-sm text-gray-900 dark:text-white">
                            {dress.name} (Réf: {dress.reference})
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(dress.price_per_day_ttc || dress.price_ttc)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prix */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Prix total TTC
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(selectedContract.total_price_ttc)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Acompte TTC
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(selectedContract.account_ttc)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Caution TTC
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {formatCurrency(selectedContract.caution_ttc)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Caution payée TTC
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {formatCurrency(selectedContract.caution_paid_ttc)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Méthode de paiement de l'acompte */}
                {selectedContract.deposit_payment_method && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Méthode de paiement de l'acompte
                    </p>
                    <p className="text-base text-gray-900 dark:text-white">
                      {selectedContract.deposit_payment_method === "card"
                        ? "Carte bancaire"
                        : selectedContract.deposit_payment_method === "cash"
                        ? "Espèces"
                        : "Virement"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => {
                    closeModal();
                    setSelectedContract(null);
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedContract.customer_id) {
                      console.error("❌ customer_id manquant dans le contrat");
                      return;
                    }
                    navigate("/customers", {
                      state: {
                        quickSearch: {
                          entity: "customer" as const,
                          entityId: selectedContract.customer_id,
                        },
                      },
                    });
                    closeModal();
                  }}
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  Voir le client
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const { cautionPaid, isPackage } = eventInfo.event.extendedProps;

  // Couleur de fond: vert pour forfait, bleu pour location par jour
  const bgColor = isPackage
    ? "bg-green-500/90 dark:bg-green-600/90"
    : "bg-blue-500/90 dark:bg-blue-600/90";

  // Couleur de la barre: verte si caution payée, rouge sinon
  const barColor = cautionPaid ? "bg-green-500" : "bg-red-500";

  return (
    <div
      className={`${bgColor} text-white rounded-sm overflow-hidden h-full flex flex-row items-stretch`}
    >
      {/* Barre verticale à gauche */}
      <div className={`${barColor} flex-shrink-0`} style={{ width: '4px', minHeight: '100%' }}></div>

      {/* Contenu de l'événement */}
      <div className="flex-1 p-1 text-xs overflow-hidden">
        <div className="font-medium truncate">{eventInfo.event.title}</div>
        {eventInfo.timeText && (
          <div className="text-xs opacity-90">{eventInfo.timeText}</div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
