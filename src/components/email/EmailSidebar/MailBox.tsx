import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { EmailsAPI, Mailbox } from "../../../api/endpoints/emails";

interface MailBoxProps {
  onMailboxSelect: (mailbox: string) => void;
  selectedMailbox: string;
  onEmailDrop?: (toMailbox: string) => void;
  draggingEmail?: { uid: number; mailbox: string } | null;
}

// Mapping des noms de mailbox API vers les noms utilisés par l'API
// Valeurs acceptées par l'API : inbox, sent, trash, spam, junk
const MAILBOX_NAME_MAP: Record<string, string> = {
  INBOX: "inbox",
  Sent: "sent",
  Drafts: "drafts", // Note: L'API liste cette mailbox mais ne la supporte pas encore
  Junk: "junk",
  Trash: "trash",
};

// Mailboxes qui ne sont pas encore supportées par l'API
const UNSUPPORTED_MAILBOXES = ["drafts"];

export default function MailBox({ onMailboxSelect, selectedMailbox, onEmailDrop, draggingEmail }: MailBoxProps) {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverMailbox, setDragOverMailbox] = useState<string | null>(null);

  useEffect(() => {
    const fetchMailboxes = async () => {
      try {
        const data = await EmailsAPI.getMailboxes();
        setMailboxes(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des mailboxes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMailboxes();
  }, []);

  const handleDragOver = (e: React.DragEvent, mailboxName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverMailbox(mailboxName);
  };

  const handleDragLeave = () => {
    setDragOverMailbox(null);
  };

  const handleDrop = (e: React.DragEvent, toMailboxName: string) => {
    e.preventDefault();
    setDragOverMailbox(null);

    if (draggingEmail && onEmailDrop) {
      const toMailbox = MAILBOX_NAME_MAP[toMailboxName] || toMailboxName.toLowerCase();
      onEmailDrop(toMailbox);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }
  // Mapping des noms de mailbox vers les icônes
  const getIconComponent = (mailboxName: string) => {
    const iconMap: Record<string, () => ReactElement> = {
      INBOX: InboxIcon,
      Sent: SentIcon,
      Drafts: DraftIcon,
      Junk: SpamIcon,
      Trash: TrashIcon,
    };
    return iconMap[mailboxName] || InboxIcon;
  };

  const handleMailboxClick = (mailboxName: string) => {
    const normalizedName = MAILBOX_NAME_MAP[mailboxName] || mailboxName.toLowerCase();

    // Vérifier si la mailbox est supportée par l'API
    if (UNSUPPORTED_MAILBOXES.includes(normalizedName)) {
      console.warn(`La mailbox "${mailboxName}" n'est pas encore supportée par l'API`);
      return;
    }

    onMailboxSelect(normalizedName);
  };

  return (
    <ul className="flex flex-col gap-1">
      {mailboxes.map((mailbox) => {
        const IconComponent = getIconComponent(mailbox.name);
        const hasNewMessages = mailbox.new > 0;
        const normalizedName = MAILBOX_NAME_MAP[mailbox.name] || mailbox.name.toLowerCase();
        const isActive = selectedMailbox === normalizedName;
        const isUnsupported = UNSUPPORTED_MAILBOXES.includes(normalizedName);

        const isDragOver = dragOverMailbox === mailbox.name;

        return (
          <li key={mailbox.name}>
            <button
              onClick={() => handleMailboxClick(mailbox.name)}
              disabled={isUnsupported}
              onDragOver={(e) => handleDragOver(e, mailbox.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, mailbox.name)}
              className={`group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${
                  isActive
                    ? "text-brand-500 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/[0.12]"
                    : isUnsupported
                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : "text-gray-500 dark:text-gray-400"
                }
                ${isDragOver && !isUnsupported ? "ring-2 ring-brand-500 bg-brand-100 dark:bg-brand-500/[0.20]" : ""}
                ${!isUnsupported ? "hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/[0.12] dark:hover:text-brand-400" : ""}`}
            >
              <span className="flex items-center gap-3">
                <IconComponent />
                {mailbox.displayName}
              </span>
              {hasNewMessages && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-brand-500 rounded-full">
                  {mailbox.new}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const InboxIcon = () => (
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
      d="M12.2996 1.12891C11.4713 1.12891 10.7998 1.80033 10.7996 2.62867L10.7996 3.1264V3.12659L10.7997 4.87507H6.14591C3.6031 4.87507 1.54175 6.93642 1.54175 9.47923V14.3207C1.54175 15.4553 2.46151 16.3751 3.5961 16.3751H6.14591H10.0001H16.2084C17.4511 16.3751 18.4584 15.3677 18.4584 14.1251V10.1251C18.4584 7.22557 16.1079 4.87507 13.2084 4.87507H12.2997L12.2996 3.87651H13.7511C14.5097 3.87651 15.1248 3.26157 15.1249 2.50293C15.125 1.74411 14.5099 1.12891 13.7511 1.12891H12.2996ZM3.04175 9.47923C3.04175 7.76485 4.43153 6.37507 6.14591 6.37507C7.8603 6.37507 9.25008 7.76485 9.25008 9.47923V14.8751H6.14591H3.5961C3.28994 14.8751 3.04175 14.6269 3.04175 14.3207V9.47923ZM10.7501 9.47923V14.8751H16.2084C16.6226 14.8751 16.9584 14.5393 16.9584 14.1251V10.1251C16.9584 8.054 15.2795 6.37507 13.2084 6.37507H9.54632C10.294 7.19366 10.7501 8.28319 10.7501 9.47923Z"
      fill="currentColor"
    />
  </svg>
);
const SentIcon = () => (
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
      d="M4.98481 2.44399C3.11333 1.57147 1.15325 3.46979 1.96543 5.36824L3.82086 9.70527C3.90146 9.89367 3.90146 10.1069 3.82086 10.2953L1.96543 14.6323C1.15326 16.5307 3.11332 18.4291 4.98481 17.5565L16.8184 12.0395C18.5508 11.2319 18.5508 8.76865 16.8184 7.961L4.98481 2.44399ZM3.34453 4.77824C3.0738 4.14543 3.72716 3.51266 4.35099 3.80349L16.1846 9.32051C16.762 9.58973 16.762 10.4108 16.1846 10.68L4.35098 16.197C3.72716 16.4879 3.0738 15.8551 3.34453 15.2223L5.19996 10.8853C5.21944 10.8397 5.23735 10.7937 5.2537 10.7473L9.11784 10.7473C9.53206 10.7473 9.86784 10.4115 9.86784 9.99726C9.86784 9.58304 9.53206 9.24726 9.11784 9.24726L5.25157 9.24726C5.2358 9.20287 5.2186 9.15885 5.19996 9.11528L3.34453 4.77824Z"
      fill="currentColor"
    />
  </svg>
);
const DraftIcon = () => (
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
      d="M3.04175 7.06206V14.375C3.04175 14.6511 3.26561 14.875 3.54175 14.875H16.4584C16.7346 14.875 16.9584 14.6511 16.9584 14.375V7.06245L11.1443 11.1168C10.457 11.5961 9.54373 11.5961 8.85638 11.1168L3.04175 7.06206ZM16.9584 5.19262C16.9584 5.19341 16.9584 5.1942 16.9584 5.19498V5.20026C16.9572 5.22216 16.946 5.24239 16.9279 5.25501L10.2864 9.88638C10.1145 10.0062 9.8862 10.0062 9.71437 9.88638L3.07255 5.25485C3.05342 5.24151 3.04202 5.21967 3.04202 5.19636C3.042 5.15695 3.07394 5.125 3.11335 5.125H16.8871C16.9253 5.125 16.9564 5.15494 16.9584 5.19262ZM18.4584 5.21428V14.375C18.4584 15.4796 17.563 16.375 16.4584 16.375H3.54175C2.43718 16.375 1.54175 15.4796 1.54175 14.375V5.19498C1.54175 5.1852 1.54194 5.17546 1.54231 5.16577C1.55858 4.31209 2.25571 3.625 3.11335 3.625H16.8871C17.7549 3.625 18.4584 4.32843 18.4585 5.19622C18.4585 5.20225 18.4585 5.20826 18.4584 5.21428Z"
      fill="currentColor"
    />
  </svg>
);
const SpamIcon = () => (
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
      d="M12.2996 1.12891C11.4713 1.12891 10.7998 1.80033 10.7996 2.62867L10.7996 3.1264V3.12659L10.7997 4.87507H6.14591C3.6031 4.87507 1.54175 6.93642 1.54175 9.47923V14.3207C1.54175 15.4553 2.46151 16.3751 3.5961 16.3751H6.14591H10.0001H16.2084C17.4511 16.3751 18.4584 15.3677 18.4584 14.1251V10.1251C18.4584 7.22557 16.1079 4.87507 13.2084 4.87507H12.2997L12.2996 3.87651H13.7511C14.5097 3.87651 15.1248 3.26157 15.1249 2.50293C15.125 1.74411 14.5099 1.12891 13.7511 1.12891H12.2996ZM3.04175 9.47923C3.04175 7.76485 4.43153 6.37507 6.14591 6.37507C7.8603 6.37507 9.25008 7.76485 9.25008 9.47923V14.8751H6.14591H3.5961C3.28994 14.8751 3.04175 14.6269 3.04175 14.3207V9.47923ZM10.7501 9.47923V14.8751H16.2084C16.6226 14.8751 16.9584 14.5393 16.9584 14.1251V10.1251C16.9584 8.054 15.2795 6.37507 13.2084 6.37507H9.54632C10.294 7.19366 10.7501 8.28319 10.7501 9.47923Z"
      fill="currentColor"
    />
  </svg>
);
const TrashIcon = () => (
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
      d="M6.54118 3.7915C6.54118 2.54886 7.54854 1.5415 8.79118 1.5415H11.2078C12.4505 1.5415 13.4578 2.54886 13.4578 3.7915V4.0415H15.6249H16.6658C17.08 4.0415 17.4158 4.37729 17.4158 4.7915C17.4158 5.20572 17.08 5.5415 16.6658 5.5415H16.3749V8.24638V13.2464V16.2082C16.3749 17.4508 15.3676 18.4582 14.1249 18.4582H5.87492C4.63228 18.4582 3.62492 17.4508 3.62492 16.2082V13.2464V8.24638V5.5415H3.33325C2.91904 5.5415 2.58325 5.20572 2.58325 4.7915C2.58325 4.37729 2.91904 4.0415 3.33325 4.0415H4.37492H6.54118V3.7915ZM14.8749 13.2464V8.24638V5.5415H13.4578H12.7078H7.29118H6.54118H5.12492V8.24638V13.2464V16.2082C5.12492 16.6224 5.46071 16.9582 5.87492 16.9582H14.1249C14.5391 16.9582 14.8749 16.6224 14.8749 16.2082V13.2464ZM8.04118 4.0415H11.9578V3.7915C11.9578 3.37729 11.6221 3.0415 11.2078 3.0415H8.79118C8.37696 3.0415 8.04118 3.37729 8.04118 3.7915V4.0415ZM8.33325 7.99984C8.74747 7.99984 9.08325 8.33562 9.08325 8.74984V13.7498C9.08325 14.1641 8.74747 14.4998 8.33325 14.4998C7.91904 14.4998 7.58325 14.1641 7.58325 13.7498V8.74984C7.58325 8.33562 7.91904 7.99984 8.33325 7.99984ZM12.4166 8.74984C12.4166 8.33562 12.0808 7.99984 11.6666 7.99984C11.2524 7.99984 10.9166 8.33562 10.9166 8.74984V13.7498C10.9166 14.1641 11.2524 14.4998 11.6666 14.4998C12.0808 14.4998 12.4166 14.1641 12.4166 13.7498V8.74984Z"
      fill="currentColor"
    />
  </svg>
);
