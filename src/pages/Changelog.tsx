import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { FiUsers, FiCalendar, FiPackage, FiSettings, FiFileText, FiBarChart2, FiBell, FiDownload } from "react-icons/fi";
import { HiOutlineTicket } from "react-icons/hi2";
import { PiDress } from "react-icons/pi";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "added" | "fixed" | "improved" | "removed";
  description: string;
}

interface HelpSection {
  title: string;
  icon: React.ReactNode;
  features: {
    name: string;
    description: string;
    roles?: string[];
  }[];
}

const changelogs: ChangelogEntry[] = [
  {
    version: "2.1.0",
    date: "14 novembre 2025",
    type: "fixed",
    description: "Correction de l'affichage 'NaN minutes' dans les notifications",
  },
  {
    version: "2.1.0",
    date: "14 novembre 2025",
    type: "added",
    description: "Ajout des icônes React Icons (FiUserPlus, HiOutlineTicket, PiDress) pour une meilleure cohérence visuelle",
  },
  {
    version: "2.1.0",
    date: "14 novembre 2025",
    type: "improved",
    description: "Amélioration du dropdown 'Plus' avec icônes pour ajouter client/contrat/robe",
  },
  {
    version: "2.0.0",
    date: "13 novembre 2025",
    type: "added",
    description: "Dashboard dynamique avec données en temps réel depuis l'API",
  },
  {
    version: "2.0.0",
    date: "13 novembre 2025",
    type: "added",
    description: "Système de notifications REST avec gestion read/unread",
  },
  {
    version: "2.0.0",
    date: "13 novembre 2025",
    type: "added",
    description: "Export Excel des robes les moins louées",
  },
  {
    version: "2.0.0",
    date: "13 novembre 2025",
    type: "fixed",
    description: "Correction des débordements de contenu sur mobile",
  },
  {
    version: "1.9.0",
    date: "9 novembre 2025",
    type: "added",
    description: "Calendrier interactif avec FullCalendar pour visualiser les contrats",
  },
  {
    version: "1.9.0",
    date: "9 novembre 2025",
    type: "added",
    description: "Génération de PDF pour les contrats avec upload des contrats signés",
  },
  {
    version: "1.9.0",
    date: "9 novembre 2025",
    type: "added",
    description: "Système de notifications en temps réel avec Socket.IO",
  },
  {
    version: "1.8.0",
    date: "8 novembre 2025",
    type: "added",
    description: "Workflow de statut des contrats (DRAFT → PENDING_SIGNATURE → SIGNED)",
  },
  {
    version: "1.8.0",
    date: "8 novembre 2025",
    type: "added",
    description: "Widget 'Phrase du jour' avec citations islamiques sur le mariage",
  },
  {
    version: "1.8.0",
    date: "8 novembre 2025",
    type: "improved",
    description: "Restrictions des rôles et permissions granulaires (ADMIN, MANAGER, COLLABORATOR)",
  },
];

const helpSections: HelpSection[] = [
  {
    title: "Gestion des Clients",
    icon: <FiUsers className="size-6" />,
    features: [
      {
        name: "Fiche client complète",
        description: "Créez et gérez les informations clients avec coordonnées, notes et historique des contrats",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Recherche rapide",
        description: "Trouvez rapidement un client par nom, email ou téléphone",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Historique des locations",
        description: "Consultez tous les contrats passés et à venir d'un client",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
    ],
  },
  {
    title: "Gestion du Catalogue",
    icon: <PiDress className="size-6" />,
    features: [
      {
        name: "Catalogue de robes",
        description: "Gérez votre inventaire avec photos, tailles, couleurs et conditions",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        name: "Disponibilité en temps réel",
        description: "Vérifiez instantanément la disponibilité des robes pour une période donnée",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Filtres avancés",
        description: "Filtrez par type, taille, couleur, prix et disponibilité",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Export Excel",
        description: "Exportez la liste des robes les moins louées pour analyse",
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Gestion des Contrats",
    icon: <HiOutlineTicket className="size-6" />,
    features: [
      {
        name: "Création de contrats",
        description: "Créez des contrats de location par jour ou en forfait avec sélection de robes et addons",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Génération de PDF",
        description: "Générez automatiquement le PDF du contrat prêt à être signé",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Signature électronique",
        description: "Envoyez un lien de signature électronique au client via Yousign",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        name: "Upload contrat signé",
        description: "Importez le PDF du contrat signé pour archivage",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Calculs automatiques",
        description: "Prix TTC, cautions et réductions calculés automatiquement",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
    ],
  },
  {
    title: "Calendrier",
    icon: <FiCalendar className="size-6" />,
    features: [
      {
        name: "Vue calendrier",
        description: "Visualisez tous les contrats dans un calendrier interactif",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Codes couleur",
        description: "Vert pour forfaits, bleu pour locations par jour. Barre verte/rouge pour caution payée/non payée",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Détails au clic",
        description: "Cliquez sur un événement pour voir tous les détails du contrat",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Navigation rapide",
        description: "Accédez directement à la fiche client depuis le calendrier",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
    ],
  },
  {
    title: "Dashboard",
    icon: <FiBarChart2 className="size-6" />,
    features: [
      {
        name: "Métriques en temps réel",
        description: "Nombre de clients, robes, chiffre d'affaires et statistiques actualisées",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        name: "Graphiques dynamiques",
        description: "Visualisez le CA mensuel, cautions vs prix TTC, objectifs du mois",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        name: "Comparaisons temporelles",
        description: "Comparez les performances du mois actuel vs mois dernier",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        name: "Phrase du jour",
        description: "Citation islamique quotidienne sur le mariage",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
    ],
  },
  {
    title: "Notifications",
    icon: <FiBell className="size-6" />,
    features: [
      {
        name: "Temps réel",
        description: "Recevez des notifications instantanées pour les contrats signés et robes créées",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Centre de notifications",
        description: "Consultez toutes vos notifications dans le header et le dashboard",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Marquage lu/non lu",
        description: "Marquez individuellement ou en groupe les notifications comme lues",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
    ],
  },
  {
    title: "Paramètres",
    icon: <FiSettings className="size-6" />,
    features: [
      {
        name: "Types de contrats",
        description: "Configurez les différents types de contrats (mariage, soirée, etc.)",
        roles: ["ADMIN"],
      },
      {
        name: "Forfaits",
        description: "Créez et gérez des forfaits avec robes et addons inclus",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        name: "Addons",
        description: "Gérez les options supplémentaires (accessoires, retouches, etc.)",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        name: "Types/Tailles/Couleurs/Conditions",
        description: "Configurez les attributs des robes pour le catalogue",
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Gestion des Utilisateurs",
    icon: <FiUsers className="size-6" />,
    features: [
      {
        name: "Rôles et permissions",
        description: "3 rôles disponibles : ADMIN (tous droits), MANAGER (gestion complète), COLLABORATOR (consultation et création limitée)",
        roles: ["ADMIN"],
      },
      {
        name: "Création d'utilisateurs",
        description: "Ajoutez des membres de l'équipe avec leurs rôles",
        roles: ["ADMIN"],
      },
      {
        name: "Profil utilisateur",
        description: "Chaque utilisateur peut modifier son profil et ses informations",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
    ],
  },
  {
    title: "Exports et Rapports",
    icon: <FiDownload className="size-6" />,
    features: [
      {
        name: "Export Excel",
        description: "Exportez les listes de robes les moins louées pour analyse",
        roles: ["ADMIN", "MANAGER"],
      },
      {
        name: "PDF des contrats",
        description: "Générez et téléchargez les contrats en PDF",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
      {
        name: "Archivage",
        description: "Conservez tous les contrats signés en PDF",
        roles: ["ADMIN", "MANAGER", "COLLABORATOR"],
      },
    ],
  },
];

export default function Changelog() {
  const [activeTab, setActiveTab] = useState<"changelog" | "help">("help");

  const getTypeColor = (type: string) => {
    switch (type) {
      case "added":
        return "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400";
      case "fixed":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
      case "improved":
        return "bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400";
      case "removed":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "added":
        return "Ajouté";
      case "fixed":
        return "Corrigé";
      case "improved":
        return "Amélioré";
      case "removed":
        return "Supprimé";
      default:
        return type;
    }
  };

  // Grouper les changelogs par version
  const groupedChangelogs = changelogs.reduce((acc, entry) => {
    if (!acc[entry.version]) {
      acc[entry.version] = {
        version: entry.version,
        date: entry.date,
        entries: [],
      };
    }
    acc[entry.version].entries.push(entry);
    return acc;
  }, {} as Record<string, { version: string; date: string; entries: ChangelogEntry[] }>);

  return (
    <div>
      <PageMeta
        title="Changelog & Aide - Allure Creation App"
        description="Retrouvez ici toutes les modifications et mises à jour de l'application Allure Creation ainsi que le guide des fonctionnalités."
      />
      <PageBreadcrumb pageTitle="Changelog & Aide" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-4 px-6 pt-6">
            <button
              onClick={() => setActiveTab("help")}
              className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "help"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <FiFileText className="inline-block mr-2 size-4" />
              Guide des fonctionnalités
            </button>
            <button
              onClick={() => setActiveTab("changelog")}
              className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "changelog"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <FiPackage className="inline-block mr-2 size-4" />
              Historique des versions
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {activeTab === "help" && (
            <div className="space-y-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
                  Guide des fonctionnalités
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Découvrez toutes les fonctionnalités de l'application Allure Creation et comment les utiliser efficacement.
                </p>
              </div>

              {helpSections.map((section, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                      {section.icon}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                      {section.title}
                    </h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {section.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50"
                      >
                        <h3 className="font-medium text-gray-800 dark:text-white/90 mb-2">
                          {feature.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {feature.description}
                        </p>
                        {feature.roles && (
                          <div className="flex flex-wrap gap-1">
                            {feature.roles.map((role, roleIndex) => (
                              <span
                                key={roleIndex}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "changelog" && (
            <div className="space-y-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
                  Historique des versions
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Suivez l'évolution de l'application Allure Creation avec toutes les nouveautés et corrections.
                </p>
              </div>

              {Object.values(groupedChangelogs).map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                  <div className="flex items-baseline gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                      Version {group.version}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {group.date}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.entries.map((entry, entryIndex) => (
                      <div
                        key={entryIndex}
                        className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50"
                      >
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(
                            entry.type
                          )}`}
                        >
                          {getTypeLabel(entry.type)}
                        </span>
                        <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                          {entry.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
