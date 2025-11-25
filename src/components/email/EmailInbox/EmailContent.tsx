import { useState, useEffect } from "react";
import EmailHeader from "./EmailHeader";
import EmailPagination from "./EmailPagination";
import EmailWrapper from "../EmailDetails/EmailWrapper";
import Checkbox from "../../form/input/Checkbox";
import SimpleBar from "simplebar-react";
import { EmailsAPI, InboxEmail } from "../../../api/endpoints/emails";
import { useNotification } from "../../../context/NotificationContext";
import { Modal } from "../../ui/modal";

interface EmailContentProps {
  selectedMailbox: string;
  refreshTrigger?: number; // Incrémenter pour déclencher un refresh
  onDragStart?: (emailUid: number, mailbox: string) => void;
  onDragEnd?: () => void;
}

// Mapping des noms de mailbox affichés vers les noms API
const MAILBOX_API_MAP: Record<string, string> = {
  inbox: "inbox",
  sent: "sent",
  trash: "trash",
  junk: "junk",
  spam: "spam",
  drafts: "drafts",
};

export default function EmailContent({ selectedMailbox, refreshTrigger, onDragStart, onDragEnd }: EmailContentProps) {
  const { notify } = useNotification();
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, count: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  const [starredItems, setStarredItems] = useState<boolean[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'single' | 'multiple', index?: number } | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<{ uid: number; mailbox: string } | null>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * pagination.limit;
        const response = await EmailsAPI.getInboxEmails({
          mailbox: selectedMailbox,
          limit: pagination.limit,
          offset,
        });
        setEmails(response.data);
        setPagination(response.pagination);
        setCheckedItems(new Array(response.data.length).fill(false));

        // Initialiser starredItems en fonction du flag \\Flagged
        const starred = response.data.map(email => email.flags.includes("\\Flagged"));
        setStarredItems(starred);
      } catch (error) {
        console.error("Erreur lors de la récupération des emails:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [selectedMailbox, currentPage, pagination.limit]);

  // Réinitialiser la page à 1 quand on change de mailbox
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMailbox]);

  // Rafraîchir les emails quand refreshTrigger change (après un drop)
  useEffect(() => {
    const refreshEmails = async () => {
      if (refreshTrigger !== undefined && refreshTrigger > 0) {
        try {
          setLoading(true);
          const offset = (currentPage - 1) * pagination.limit;
          const response = await EmailsAPI.getInboxEmails({
            mailbox: selectedMailbox,
            limit: pagination.limit,
            offset,
          });
          setEmails(response.data);
          setPagination(response.pagination);
          setCheckedItems(new Array(response.data.length).fill(false));
          const starred = response.data.map(email => email.flags.includes("\\Flagged"));
          setStarredItems(starred);
        } catch (error) {
          console.error("Erreur lors du rafraîchissement des emails:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    refreshEmails();
  }, [refreshTrigger]);

  const toggleCheck = (index: number, checked: boolean) => {
    const updated = [...checkedItems];
    updated[index] = checked;
    setCheckedItems(updated);
  };

  const toggleStar = async (index: number) => {
    const email = emails[index];
    const newStarredState = !starredItems[index];

    try {
      // Optimistic update
      const updated = [...starredItems];
      updated[index] = newStarredState;
      setStarredItems(updated);

      // Appeler l'API avec le mailbox et uid corrects
      const mailbox = MAILBOX_API_MAP[selectedMailbox] || selectedMailbox;
      await EmailsAPI.toggleFlag(email.uid, mailbox, newStarredState);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du flag:", error);
      // Rollback en cas d'erreur
      const updated = [...starredItems];
      updated[index] = !newStarredState;
      setStarredItems(updated);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setCheckedItems(new Array(emails.length).fill(checked));
  };

  const allChecked = checkedItems.every(Boolean);
  const selectedCount = checkedItems.filter(Boolean).length;

  // Rafraîchir la liste des emails
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pagination.limit;
      const response = await EmailsAPI.getInboxEmails({
        mailbox: selectedMailbox,
        limit: pagination.limit,
        offset,
      });
      setEmails(response.data);
      setPagination(response.pagination);
      setCheckedItems(new Array(response.data.length).fill(false));
      const starred = response.data.map(email => email.flags.includes("\\Flagged"));
      setStarredItems(starred);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des emails:", error);
    } finally {
      setLoading(false);
    }
  };

  // Afficher confirmation de suppression
  const handleDelete = () => {
    const selectedCount = checkedItems.filter(Boolean).length;
    if (selectedCount === 0) return;
    setShowDeleteConfirm({ type: 'multiple' });
  };

  // Supprimer définitivement les emails sélectionnés - après confirmation
  const confirmDeleteMultiple = async () => {
    const selectedIndices = checkedItems.map((checked, i) => checked ? i : -1).filter(i => i !== -1);
    if (selectedIndices.length === 0) return;

    const selectedEmails = emails.filter((_, i) => checkedItems[i]);
    const previousEmails = emails;
    const previousChecked = checkedItems;
    const previousStarred = starredItems;

    setShowDeleteConfirm(null);

    // Optimistic update - retirer les emails sélectionnés
    const updatedEmails = emails.filter((_, i) => !checkedItems[i]);
    setEmails(updatedEmails);
    setCheckedItems(new Array(updatedEmails.length).fill(false));
    setStarredItems(starredItems.filter((_, i) => !checkedItems[i]));

    // API call en arrière-plan
    try {
      const mailbox = MAILBOX_API_MAP[selectedMailbox] || selectedMailbox;
      await Promise.all(
        selectedEmails.map(email => EmailsAPI.delete(email.uid, mailbox, true))
      );
      setPagination(prev => ({ ...prev, count: prev.count - selectedEmails.length }));
      notify("success", "Suppression réussie", `${selectedEmails.length} email(s) supprimé(s) définitivement`);
    } catch (error) {
      console.error("Erreur lors de la suppression des emails:", error);
      notify("error", "Erreur", "Impossible de supprimer les emails");
      // Rollback
      setEmails(previousEmails);
      setCheckedItems(previousChecked);
      setStarredItems(previousStarred);
    }
  };

  // Marquer les emails sélectionnés comme lus - avec optimistic update
  const handleMarkAsRead = async () => {
    const selectedEmails = emails.filter((_, i) => checkedItems[i]);
    if (selectedEmails.length === 0) return;

    const previousEmails = emails;

    // Optimistic update
    const updatedEmails = emails.map((email, i) => {
      if (checkedItems[i]) {
        return {
          ...email,
          flags: email.flags.includes("\\Seen") ? email.flags : [...email.flags, "\\Seen"]
        };
      }
      return email;
    });
    setEmails(updatedEmails);
    setCheckedItems(new Array(emails.length).fill(false));

    // API call en arrière-plan
    try {
      const mailbox = MAILBOX_API_MAP[selectedMailbox] || selectedMailbox;
      await Promise.all(
        selectedEmails.map(email => EmailsAPI.markAsRead(email.uid, mailbox, true))
      );
      notify("success", "Marqué comme lu", `${selectedEmails.length} email(s) marqué(s) comme lu(s)`);
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
      notify("error", "Erreur", "Impossible de marquer les emails comme lus");
      setEmails(previousEmails);
    }
  };

  // Marquer les emails sélectionnés comme non lus - avec optimistic update
  const handleMarkAsUnread = async () => {
    const selectedEmails = emails.filter((_, i) => checkedItems[i]);
    if (selectedEmails.length === 0) return;

    const previousEmails = emails;

    // Optimistic update
    const updatedEmails = emails.map((email, i) => {
      if (checkedItems[i]) {
        return {
          ...email,
          flags: email.flags.filter(flag => flag !== "\\Seen")
        };
      }
      return email;
    });
    setEmails(updatedEmails);
    setCheckedItems(new Array(emails.length).fill(false));

    // API call en arrière-plan
    try {
      const mailbox = MAILBOX_API_MAP[selectedMailbox] || selectedMailbox;
      await Promise.all(
        selectedEmails.map(email => EmailsAPI.markAsRead(email.uid, mailbox, false))
      );
      notify("success", "Marqué comme non lu", `${selectedEmails.length} email(s) marqué(s) comme non lu(s)`);
    } catch (error) {
      console.error("Erreur lors du marquage comme non lu:", error);
      notify("error", "Erreur", "Impossible de marquer les emails comme non lus");
      setEmails(previousEmails);
    }
  };

  // Déplacer les emails sélectionnés vers un autre dossier - avec optimistic update
  const handleMoveTo = async (toMailbox: string) => {
    const selectedEmails = emails.filter((_, i) => checkedItems[i]);
    if (selectedEmails.length === 0) return;

    const previousEmails = emails;
    const previousChecked = checkedItems;
    const previousStarred = starredItems;

    // Optimistic update - retirer les emails sélectionnés
    const updatedEmails = emails.filter((_, i) => !checkedItems[i]);
    setEmails(updatedEmails);
    setCheckedItems(new Array(updatedEmails.length).fill(false));
    setStarredItems(starredItems.filter((_, i) => !checkedItems[i]));

    // Mapping des noms pour notification
    const folderNames: Record<string, string> = {
      inbox: "Boîte de réception",
      trash: "Corbeille",
      spam: "Spam",
      sent: "Envoyés"
    };

    // API call en arrière-plan
    try {
      const fromMailbox = MAILBOX_API_MAP[selectedMailbox] || selectedMailbox;
      await Promise.all(
        selectedEmails.map(email => EmailsAPI.move(email.uid, fromMailbox, toMailbox))
      );
      setPagination(prev => ({ ...prev, count: prev.count - selectedEmails.length }));
      notify("success", "Déplacement réussi", `${selectedEmails.length} email(s) déplacé(s) vers ${folderNames[toMailbox] || toMailbox}`);
    } catch (error) {
      console.error("Erreur lors du déplacement des emails:", error);
      notify("error", "Erreur", "Impossible de déplacer les emails");
      // Rollback
      setEmails(previousEmails);
      setCheckedItems(previousChecked);
      setStarredItems(previousStarred);
    }
  };

  // Actions sur un email individuel (icônes sur la ligne) - avec optimistic updates
  const handleSingleEmailMarkAsRead = async (index: number, read: boolean) => {
    const email = emails[index];

    // Optimistic update
    const updatedEmails = [...emails];
    const currentFlags = updatedEmails[index].flags;
    if (read) {
      if (!currentFlags.includes("\\Seen")) {
        updatedEmails[index].flags = [...currentFlags, "\\Seen"];
      }
    } else {
      updatedEmails[index].flags = currentFlags.filter(flag => flag !== "\\Seen");
    }
    setEmails(updatedEmails);

    // API call en arrière-plan
    try {
      const mailbox = MAILBOX_API_MAP[selectedMailbox] || selectedMailbox;
      await EmailsAPI.markAsRead(email.uid, mailbox, read);
    } catch (error) {
      console.error("Erreur lors du marquage de l'email:", error);
      // Rollback en cas d'erreur
      setEmails(emails);
    }
  };

  // Afficher confirmation de suppression pour un email
  const handleSingleEmailDelete = (index: number) => {
    setShowDeleteConfirm({ type: 'single', index });
  };

  // Confirmer suppression d'un email individuel
  const confirmDeleteSingle = async (index: number) => {
    const email = emails[index];
    const previousEmails = emails;
    const previousChecked = checkedItems;
    const previousStarred = starredItems;

    setShowDeleteConfirm(null);

    // Optimistic update - retirer l'email de la liste
    const updatedEmails = emails.filter((_, i) => i !== index);
    setEmails(updatedEmails);
    setCheckedItems(checkedItems.filter((_, i) => i !== index));
    setStarredItems(starredItems.filter((_, i) => i !== index));

    // API call en arrière-plan
    try {
      const mailbox = MAILBOX_API_MAP[selectedMailbox] || selectedMailbox;
      await EmailsAPI.delete(email.uid, mailbox, true); // true = suppression définitive
      setPagination(prev => ({ ...prev, count: prev.count - 1 }));
      notify("success", "Email supprimé", "Email supprimé définitivement");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'email:", error);
      notify("error", "Erreur", "Impossible de supprimer l'email");
      // Rollback en cas d'erreur
      setEmails(previousEmails);
      setCheckedItems(previousChecked);
      setStarredItems(previousStarred);
    }
  };


  // Afficher tous les emails sans pagination
  const handleViewAll = async () => {
    try {
      setLoading(true);
      const response = await EmailsAPI.getInboxEmails({
        mailbox: selectedMailbox,
        limit: pagination.count, // Utiliser le nombre total d'emails
        offset: 0,
      });
      setEmails(response.data);
      setPagination(response.pagination);
      setCheckedItems(new Array(response.data.length).fill(false));
      const starred = response.data.map(email => email.flags.includes("\\Flagged"));
      setStarredItems(starred);
      setCurrentPage(1); // Remettre à la page 1
    } catch (error) {
      console.error("Erreur lors du chargement de tous les emails:", error);
    } finally {
      setLoading(false);
    }
  };


  // Formater la date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays < 7) {
      return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
    } else {
      return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
    }
  };

  // Extraire un extrait du texte ou HTML
  const getEmailSnippet = (email: InboxEmail): string => {
    const text = email.text || email.html || "";
    return text.replace(/<[^>]*>/g, "").substring(0, 120) + "...";
  };

  // Télécharger une pièce jointe
  const handleDownloadAttachment = async (email: InboxEmail, attachmentIndex: number) => {
    try {
      const mailbox = MAILBOX_API_MAP[selectedMailbox] || selectedMailbox;
      const blob = await EmailsAPI.downloadAttachment(email.uid, attachmentIndex, mailbox);

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = email.attachments?.[attachmentIndex]?.filename || `attachment-${attachmentIndex}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notify("success", "Téléchargement réussi", `Pièce jointe téléchargée`);
    } catch (error) {
      console.error("Erreur lors du téléchargement de la pièce jointe:", error);
      notify("error", "Erreur", "Impossible de télécharger la pièce jointe");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl xl:col-span-9 w-full border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-gray-500 dark:text-gray-400">Chargement des emails...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl xl:col-span-9 w-full border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <EmailHeader
        isChecked={allChecked}
        onSelectAll={handleSelectAll}
        selectedCount={selectedCount}
        onRefresh={handleRefresh}
        onDelete={handleDelete}
        onMarkAsRead={handleMarkAsRead}
        onMarkAsUnread={handleMarkAsUnread}
        onMoveTo={handleMoveTo}
        onViewAll={handleViewAll}
      />
      <SimpleBar className="max-h-[510px] 2xl:max-h-[630px]">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {emails.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-sm text-gray-500 dark:text-gray-400">Aucun email trouvé</div>
            </div>
          ) : (
            emails.map((email, index) => {
              const isUnread = !email.flags.includes("\\Seen");
              const sender = email.from[0]?.name || email.from[0]?.address || "Inconnu";

              return (
                <div
                  key={email.uid}
                  draggable="true"
                  onDragStart={() => {
                    if (onDragStart) {
                      const mailbox = MAILBOX_API_MAP[selectedMailbox] || selectedMailbox;
                      onDragStart(email.uid, mailbox);
                    }
                  }}
                  onDragEnd={() => {
                    if (onDragEnd) {
                      onDragEnd();
                    }
                  }}
                  onClick={() => {
                    const mailbox = MAILBOX_API_MAP[selectedMailbox] || selectedMailbox;
                    setSelectedEmail({ uid: email.uid, mailbox });
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`flex cursor-pointer items-center px-4 py-4 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/[0.03] ${
                    isUnread ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                >
                  {/* Left Section */}
                  <div className="flex items-center w-1/5">
                    {/* Indicateur de statut lu/non-lu - cliquable */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleEmailMarkAsRead(index, isUnread);
                      }}
                      className="w-8 h-8 flex items-center justify-center mr-2 flex-shrink-0 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                      title={isUnread ? "Marquer comme lu" : "Marquer comme non-lu"}
                      type="button"
                    >
                      {isUnread ? (
                        <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-gray-400"></div>
                      )}
                    </button>

                    {/* Custom Checkbox */}
                    <Checkbox
                      checked={checkedItems[index]}
                      onChange={(checked) => toggleCheck(index, checked)}
                    />

                    {/* Star */}
                    <span
                      className="ml-3 text-gray-400 cursor-pointer"
                      onClick={() => toggleStar(index)}
                    >
                      {starredItems[index] ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="#FDB022"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.99991 3.125L12.2337 7.65114L17.2286 8.37694L13.6142 11.9L14.4675 16.8747L9.99991 14.526L5.53235 16.8747L6.38558 11.9L2.77124 8.37694L7.76613 7.65114L9.99991 3.125Z" />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.99993 2.375C10.2854 2.375 10.5461 2.53707 10.6725 2.79308L12.7318 6.96563L17.3365 7.63473C17.619 7.67578 17.8537 7.87367 17.9419 8.14517C18.0301 8.41668 17.9565 8.71473 17.7521 8.914L14.4201 12.1619L15.2067 16.748C15.255 17.0293 15.1393 17.3137 14.9083 17.4815C14.6774 17.6493 14.3712 17.6714 14.1185 17.5386L9.99993 15.3733L5.88137 17.5386C5.62869 17.6714 5.32249 17.6493 5.09153 17.4815C4.86057 17.3137 4.7449 17.0293 4.79316 16.748L5.57974 12.1619L2.24775 8.914C2.04332 8.71473 1.96975 8.41668 2.05797 8.14517C2.14619 7.87367 2.3809 7.67578 2.66341 7.63473L7.2681 6.96563L9.32738 2.79308C9.45373 2.53707 9.71445 2.375 9.99993 2.375ZM9.99993 4.81966L8.4387 7.98306C8.32946 8.20442 8.11828 8.35785 7.874 8.39334L4.38298 8.90062L6.90911 11.363C7.08587 11.5353 7.16653 11.7835 7.1248 12.0268L6.52847 15.5037L9.65093 13.8622C9.86942 13.7473 10.1304 13.7473 10.3489 13.8622L13.4714 15.5037L12.8751 12.0268C12.8333 11.7835 12.914 11.5353 13.0908 11.363L15.6169 8.90062L12.1259 8.39334C11.8816 8.35785 11.6704 8.20442 11.5612 7.98306L9.99993 4.81966Z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </span>

                    {/* Sender */}
                    <span className={`ml-3 text-sm truncate ${isUnread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-400"}`}>
                      {sender}
                    </span>
                  </div>

                  {/* Middle Section */}
                  <div className="flex items-center w-3/5 gap-3">
                    <div className="flex-1 truncate">
                      <span className={`text-sm ${isUnread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-400"}`}>
                        {email.subject || "(Sans sujet)"}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        - {getEmailSnippet(email)}
                      </span>
                    </div>
                    {email.hasAttachments && email.attachments && email.attachments.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Si une seule pièce jointe, télécharger directement
                          if (email.attachments.length === 1) {
                            handleDownloadAttachment(email, 0);
                          }
                        }}
                        className="flex-shrink-0 flex items-center gap-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                        title={email.attachments.length === 1
                          ? `Télécharger: ${email.attachments[0].filename}`
                          : `${email.attachments.length} pièces jointes`}
                      >
                        <svg
                          className="fill-current"
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M10.6685 12.035C10.6685 12.044 10.6686 12.0529 10.6689 12.0617V13.4533C10.6689 13.8224 10.3697 14.1216 10.0006 14.1216C9.63155 14.1216 9.33235 13.8224 9.33235 13.4533V5.12807C9.33235 4.71385 8.99657 4.37807 8.58235 4.37807C8.16814 4.37807 7.83235 4.71385 7.83235 5.12807V13.4533C7.83235 14.6508 8.80313 15.6216 10.0006 15.6216C11.1981 15.6216 12.1689 14.6508 12.1689 13.4533V5.12807C12.1689 5.11803 12.1687 5.10804 12.1683 5.09811C12.1522 3.1311 10.5527 1.5415 8.58189 1.5415C6.60108 1.5415 4.99532 3.14727 4.99532 5.12807L4.99532 12.035C4.99532 12.0414 4.9954 12.0477 4.99556 12.0539V13.4533C4.99556 16.2174 7.2363 18.4582 10.0004 18.4582C12.7645 18.4582 15.0053 16.2174 15.0053 13.4533V7.96463C15.0053 7.55042 14.6695 7.21463 14.2553 7.21463C13.841 7.21463 13.5053 7.55042 13.5053 7.96463V13.4533C13.5053 15.389 11.9361 16.9582 10.0004 16.9582C8.06473 16.9582 6.49556 15.389 6.49556 13.4533V7.96463C6.49556 7.95832 6.49548 7.95202 6.49532 7.94574L6.49532 5.12807C6.49532 3.97569 7.42951 3.0415 8.58189 3.0415C9.73427 3.0415 10.6685 3.97569 10.6685 5.12807L10.6685 12.035Z"
                            fill=""
                          />
                        </svg>
                        {email.attachments.length > 1 && (
                          <span className="text-xs">{email.attachments.length}</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right Section */}
                  <div className="w-1/5 flex items-center justify-end gap-2 relative">
                    {hoveredIndex === index ? (
                      <>
                        {/* Icône Marquer comme lu/non lu */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleEmailMarkAsRead(index, isUnread);
                          }}
                          title={isUnread ? "Marquer comme lu" : "Marquer comme non lu"}
                          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                          {isUnread ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M3.33325 6.04183C3.33325 5.62762 3.66904 5.29183 4.08325 5.29183H15.9166C16.3308 5.29183 16.6666 5.62762 16.6666 6.04183V13.9585C16.6666 14.3727 16.3308 14.7085 15.9166 14.7085H4.08325C3.66904 14.7085 3.33325 14.3727 3.33325 13.9585V6.04183ZM4.83325 6.79183V13.2085H15.1666V6.79183H4.83325Z" fill="currentColor"/>
                              <path d="M5.08008 6.7915L9.99967 10.7499L14.9193 6.7915" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M3.33325 6.04183C3.33325 5.62762 3.66904 5.29183 4.08325 5.29183H15.9166C16.3308 5.29183 16.6666 5.62762 16.6666 6.04183V13.9585C16.6666 14.3727 16.3308 14.7085 15.9166 14.7085H4.08325C3.66904 14.7085 3.33325 14.3727 3.33325 13.9585V6.04183ZM15.1666 7.50065V13.2085H4.83325V7.50065L9.99967 11.5837L15.1666 7.50065ZM14.2358 6.79183H5.76353L9.99967 10.0829L14.2358 6.79183Z" fill="currentColor"/>
                            </svg>
                          )}
                        </button>

                        {/* Icône Supprimer */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleEmailDelete(index);
                          }}
                          title="Supprimer"
                          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-error-500 dark:hover:text-error-400"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M6.54118 3.7915C6.54118 2.54886 7.54854 1.5415 8.79118 1.5415H11.2078C12.4505 1.5415 13.4578 2.54886 13.4578 3.7915V4.0415H15.6249H16.6658C17.08 4.0415 17.4158 4.37729 17.4158 4.7915C17.4158 5.20572 17.08 5.5415 16.6658 5.5415H16.3749V8.24638V13.2464V16.2082C16.3749 17.4508 15.3676 18.4582 14.1249 18.4582H5.87492C4.63228 18.4582 3.62492 17.4508 3.62492 16.2082V13.2464V8.24638V5.5415H3.33325C2.91904 5.5415 2.58325 5.20572 2.58325 4.7915C2.58325 4.37729 2.91904 4.0415 3.33325 4.0415H4.37492H6.54118V3.7915ZM14.8749 13.2464V8.24638V5.5415H13.4578H12.7078H7.29118H6.54118H5.12492V8.24638V13.2464V16.2082C5.12492 16.6224 5.46071 16.9582 5.87492 16.9582H14.1249C14.5391 16.9582 14.8749 16.6224 14.8749 16.2082V13.2464ZM8.04118 4.0415H11.9578V3.7915C11.9578 3.37729 11.6221 3.0415 11.2078 3.0415H8.79118C8.37696 3.0415 8.04118 3.37729 8.04118 3.7915V4.0415ZM8.33325 7.99984C8.74747 7.99984 9.08325 8.33562 9.08325 8.74984V13.7498C9.08325 14.1641 8.74747 14.4998 8.33325 14.4998C7.91904 14.4998 7.58325 14.1641 7.58325 13.7498V8.74984C7.58325 8.33562 7.91904 7.99984 8.33325 7.99984ZM12.4166 8.74984C12.4166 8.33562 12.0808 7.99984 11.6666 7.99984C11.2524 7.99984 10.9166 8.33562 10.9166 8.74984V13.7498C10.9166 14.1641 11.2524 14.4998 11.6666 14.4998C12.0808 14.4998 12.4166 14.1641 12.4166 13.7498V8.74984Z" fill="currentColor"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">{formatDate(email.date)}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SimpleBar>
      <EmailPagination
        currentPage={currentPage}
        totalEmails={pagination.count}
        emailsPerPage={pagination.limit}
        onPageChange={setCurrentPage}
      />

      {/* Confirmation Dialog */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        showCloseButton={false}
        className="max-w-md p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Confirmer la suppression
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {showDeleteConfirm?.type === 'multiple'
            ? `Êtes-vous sûr de vouloir supprimer définitivement ${checkedItems.filter(Boolean).length} email(s) ? Cette action est irréversible.`
            : "Êtes-vous sûr de vouloir supprimer définitivement cet email ? Cette action est irréversible."}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDeleteConfirm(null)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (showDeleteConfirm?.type === 'multiple') {
                confirmDeleteMultiple();
              } else if (showDeleteConfirm?.index !== undefined) {
                confirmDeleteSingle(showDeleteConfirm.index);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-error-500 rounded-lg hover:bg-error-600 dark:bg-error-600 dark:hover:bg-error-700"
          >
            Confirmer
          </button>
        </div>
      </Modal>

      {/* Email Detail View - Slide-in panel */}
      {selectedEmail && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 transition-opacity"
            onClick={() => {
              setSelectedEmail(null);
              handleRefresh();
            }}
          />

          {/* Slide-in panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl transform transition-transform duration-300 ease-in-out">
            <EmailWrapper
              emailUid={selectedEmail.uid}
              mailbox={selectedEmail.mailbox}
              onClose={() => {
                setSelectedEmail(null);
                handleRefresh();
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
