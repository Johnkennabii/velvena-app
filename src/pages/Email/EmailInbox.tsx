import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import EmailContent from "../../components/email/EmailInbox/EmailContent";
import EmailSidebar from "../../components/email/EmailSidebar/EmailSidebar";
import { EmailsAPI } from "../../api/endpoints/emails";
import { useNotification } from "../../context/NotificationContext";

export default function EmailInbox() {
  const [selectedMailbox, setSelectedMailbox] = useState<string>("inbox");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [draggingEmail, setDraggingEmail] = useState<{ uid: number; mailbox: string } | null>(null);
  const { notify } = useNotification();

  const handleDragStart = (emailUid: number, mailbox: string) => {
    setDraggingEmail({ uid: emailUid, mailbox });
  };

  const handleDragEnd = () => {
    setDraggingEmail(null);
  };

  const handleEmailDrop = async (toMailbox: string) => {
    if (!draggingEmail) return;

    try {
      await EmailsAPI.move(draggingEmail.uid, draggingEmail.mailbox, toMailbox);

      const folderNames: Record<string, string> = {
        inbox: "Boîte de réception",
        trash: "Corbeille",
        spam: "Spam",
        sent: "Envoyés",
        junk: "Courrier indésirable"
      };

      notify("success", "Email déplacé", `Email déplacé vers ${folderNames[toMailbox] || toMailbox}`);

      // Déclencher un refresh de la liste
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erreur lors du déplacement de l'email:", error);
      notify("error", "Erreur", "Impossible de déplacer l'email");
    } finally {
      setDraggingEmail(null);
    }
  };

  return (
    <>
      <PageMeta
        title="Mails - Allure Creation App"
        description="Gérez vos emails efficacement via l'application Allure Creation App."
      />
      <div className="sm:h-[calc(100vh-174px)] h-screen xl:h-[calc(100vh-186px)]">
        <div className="flex flex-col gap-5 xl:grid xl:grid-cols-12 sm:gap-5">
          <div className="xl:col-span-3 col-span-full">
            <EmailSidebar
              onMailboxSelect={setSelectedMailbox}
              selectedMailbox={selectedMailbox}
              onEmailDrop={handleEmailDrop}
              draggingEmail={draggingEmail}
            />
          </div>
          <EmailContent
            selectedMailbox={selectedMailbox}
            refreshTrigger={refreshTrigger}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      </div>
    </>
  );
}
