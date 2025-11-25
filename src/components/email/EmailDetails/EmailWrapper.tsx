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
      <div className="flex flex-col justify-between overflow-hidden h-full border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-2xl">
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
    <div className="flex flex-col justify-between overflow-hidden h-full border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-2xl">
      <EmailDetailsHeader />
      <SimpleBar className="custom-scrollbar flex-1">
        <div className="p-5 xl:p-6">
          {/* Email Header avec expéditeur */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-500 text-white font-semibold text-lg">
                {email.from[0]?.name?.[0]?.toUpperCase() || email.from[0]?.address?.[0]?.toUpperCase() || "?"}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {email.from[0]?.name || email.from[0]?.address}
                  </span>
                  {email.from[0]?.name && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      &lt;{email.from[0]?.address}&gt;
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  À: {email.to.map(t => t.address).join(", ")}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Sujet */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {email.subject || "(Sans sujet)"}
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(email.date)}
            </div>
          </div>

          {/* Contenu de l'email */}
          <div className="text-sm text-gray-700 mb-7 dark:text-gray-400">
            {email.html ? (
              <iframe
                srcDoc={email.html}
                className="w-full min-h-[400px] border-0"
                sandbox="allow-same-origin"
                title="Contenu de l'email"
              />
            ) : (
              <div className="whitespace-pre-wrap">{email.text}</div>
            )}
          </div>

          {/* Pièces jointes */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 sm:p-4">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-gray-500 dark:text-gray-400">
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
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
                </span>

                <span className="text-sm text-gray-700 dark:text-gray-400">
                  {email.attachments.length} pièce{email.attachments.length > 1 ? "s" : ""} jointe{email.attachments.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap">
                {email.attachments.map((attachment, index) => (
                  <button
                    key={index}
                    onClick={() => handleDownloadAttachment(index)}
                    className="relative hover:border-gray-300 dark:hover:border-white/[0.05] flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-5 dark:border-gray-800 dark:bg-white/5 sm:w-auto transition-colors"
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="8" fill="#F3F4F6" className="dark:fill-gray-800"/>
                        <path d="M20 22.5L16.25 18.75M20 22.5L23.75 18.75M20 22.5V13.75M27.5 22.5V26.25H12.5V22.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate max-w-[200px]">
                        {attachment.filename}
                      </p>
                      <span className="flex items-center gap-1.5">
                        <span className="text-gray-500 text-xs dark:text-gray-400">
                          {Math.round(attachment.size / 1024)} Ko
                        </span>
                        <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span className="text-gray-500 text-xs dark:text-gray-400">
                          Télécharger
                        </span>
                      </span>
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
