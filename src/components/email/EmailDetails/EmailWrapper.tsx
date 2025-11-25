import { useState, useEffect } from "react";
import SimpleBar from "simplebar-react";
import EmailDetailsHeader from "./EmailDetailsHeader";
import EmailDetailsBottom from "./EmailDetailsBottom";
import { EmailsAPI, InboxEmail } from "../../../api/endpoints/emails";
import { useNotification } from "../../../context/NotificationContext";

interface EmailWrapperProps {
  emailUid: number;
  mailbox: string;
  onClose: () => void;
}

export default function EmailWrapper({ emailUid, mailbox, onClose }: EmailWrapperProps) {
  const [email, setEmail] = useState<InboxEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        setLoading(true);
        const data = await EmailsAPI.getEmail(emailUid, mailbox);
        setEmail(data);

        // Marquer comme lu automatiquement
        if (!data.flags.includes("\\Seen")) {
          await EmailsAPI.markAsRead(emailUid, mailbox, true);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'email:", error);
        notify("error", "Erreur", "Impossible de charger l'email");
      } finally {
        setLoading(false);
      }
    };

    fetchEmail();
  }, [emailUid, mailbox]);

  const handleDownloadAttachment = async (attachmentIndex: number) => {
    if (!email) return;

    try {
      const blob = await EmailsAPI.downloadAttachment(emailUid, attachmentIndex, mailbox);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = email.attachments?.[attachmentIndex]?.filename || `attachment-${attachmentIndex}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notify("success", "Téléchargement réussi", "Pièce jointe téléchargée");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      notify("error", "Erreur", "Impossible de télécharger la pièce jointe");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-between overflow-hidden h-full border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-gray-500 dark:text-gray-400">Chargement de l'email...</div>
        </div>
      </div>
    );
  }

  if (!email) {
    return null;
  }

  return (
    <div className="flex flex-col justify-between overflow-hidden h-full border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xl">
      <EmailDetailsHeader />
      <SimpleBar className="custom-scrollbar flex-1">
        <div className="p-6 xl:p-8">
          {/* Email Header avec expéditeur amélioré */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Avatar avec gradient et ombre */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white font-semibold text-lg shadow-lg ring-4 ring-brand-100 dark:ring-brand-900/30">
                  {email.from[0]?.name?.[0]?.toUpperCase() || email.from[0]?.address?.[0]?.toUpperCase() || "?"}
                </div>
                {!email.flags.includes("\\Seen") && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Nom et email avec meilleure hiérarchie */}
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {email.from[0]?.name || email.from[0]?.address}
                  </h3>
                  {email.from[0]?.name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {email.from[0]?.address}
                    </p>
                  )}
                </div>

                {/* Destinataires avec labels */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">À:</span>
                    <span className="text-gray-700 dark:text-gray-300 break-words">
                      {email.to.map(t => t.name || t.address).join(", ")}
                    </span>
                  </div>
                  {email.cc && email.cc.length > 0 && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Cc:</span>
                      <span className="text-gray-700 dark:text-gray-300 break-words">
                        {email.cc.map(c => c.name || c.address).join(", ")}
                      </span>
                    </div>
                  )}
                  {email.bcc && email.bcc.length > 0 && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Cci:</span>
                      <span className="text-gray-700 dark:text-gray-300 break-words">
                        {email.bcc.map(b => b.name || b.address).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Sujet et métadonnées */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
              {email.subject || "(Sans sujet)"}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800">
                <svg className="text-gray-500 dark:text-gray-400" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 5V10L13.3333 11.6667M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatDate(email.date)}
                </span>
              </div>
              {email.flags.includes("\\Flagged") && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning-50 dark:bg-warning-900/20">
                  <svg className="text-warning-600 dark:text-warning-400" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.33334 10.8333L3.33334 2.5L14.1667 8.33333L3.33334 14.1667L3.33334 10.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-xs font-medium text-warning-700 dark:text-warning-300">
                    Important
                  </span>
                </div>
              )}
              {email.attachments && email.attachments.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800">
                  <svg className="text-gray-500 dark:text-gray-400" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5 10.8333V13.5C17.5 15.3409 16.0076 16.8333 14.1667 16.8333H5.83333C3.99238 16.8333 2.5 15.3409 2.5 13.5V10.8333M14.1667 6.66667L10 2.5M10 2.5L5.83333 6.66667M10 2.5V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {email.attachments.length} fichier{email.attachments.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contenu de l'email avec style amélioré */}
          <div className="mb-8">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] p-6 text-sm text-gray-700 dark:text-gray-300">
              {email.html ? (
                <iframe
                  srcDoc={email.html}
                  className="w-full min-h-[400px] border-0 rounded-lg"
                  sandbox="allow-same-origin"
                  title="Contenu de l'email"
                />
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed">{email.text}</div>
              )}
            </div>
          </div>

          {/* Pièces jointes avec design amélioré */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-white/[0.02] dark:to-white/[0.01] p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                  <svg
                    className="text-gray-600 dark:text-gray-400"
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.6685 12.035C10.6685 12.044 10.6686 12.0529 10.6689 12.0617V13.4533C10.6689 13.8224 10.3697 14.1216 10.0006 14.1216C9.63155 14.1216 9.33235 13.8224 9.33235 13.4533V5.12807C9.33235 4.71385 8.99657 4.37807 8.58235 4.37807C8.16814 4.37807 7.83235 4.71385 7.83235 5.12807V13.4533C7.83235 14.6508 8.80313 15.6216 10.0006 15.6216C11.1981 15.6216 12.1689 14.6508 12.1689 13.4533V5.12807C12.1689 5.11803 12.1687 5.10804 12.1683 5.09811C12.1522 3.1311 10.5527 1.5415 8.58189 1.5415C6.60108 1.5415 4.99532 3.14727 4.99532 5.12807L4.99532 12.035C4.99532 12.0414 4.9954 12.0477 4.99556 12.0539V13.4533C4.99556 16.2174 7.2363 18.4582 10.0004 18.4582C12.7645 18.4582 15.0053 16.2174 15.0053 13.4533V7.96463C15.0053 7.55042 14.6695 7.21463 14.2553 7.21463C13.841 7.21463 13.5053 7.55042 13.5053 7.96463V13.4533C13.5053 15.389 11.9361 16.9582 10.0004 16.9582C8.06473 16.9582 6.49556 15.389 6.49556 13.4533V7.96463C6.49556 7.95832 6.49548 7.95202 6.49532 7.94574L6.49532 5.12807C6.49532 3.97569 7.42951 3.0415 8.58189 3.0415C9.73427 3.0415 10.6685 3.97569 10.6685 5.12807L10.6685 12.035Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Pièces jointes
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {email.attachments.length} fichier{email.attachments.length > 1 ? "s" : ""} joint{email.attachments.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {email.attachments.map((attachment, index) => (
                  <button
                    key={index}
                    onClick={() => handleDownloadAttachment(index)}
                    className="group relative flex items-center gap-3 rounded-lg border border-gray-200 bg-white py-3 px-3.5 hover:border-brand-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-700 dark:hover:bg-gray-750 transition-all"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 group-hover:from-brand-100 group-hover:to-brand-200 dark:group-hover:from-brand-800/40 dark:group-hover:to-brand-700/40 transition-colors">
                      <svg className="text-brand-600 dark:text-brand-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 13.3333L6.66667 10M10 13.3333L13.3333 10M10 13.3333V5M17.5 13.3333V16.6667H2.5V13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {attachment.filename}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(attachment.size / 1024)} Ko
                        </span>
                        <span className="inline-block w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                        <span className="text-xs text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Télécharger
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SimpleBar>
      <EmailDetailsBottom />
    </div>
  );
}
