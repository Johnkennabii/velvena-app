import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import EmailWrapper from "../../components/email/EmailDetails/EmailWrapper";
import EmailSidebar from "../../components/email/EmailSidebar/EmailSidebar";
import { EmailsAPI } from "../../api/endpoints/emails";

export default function EmailDetails() {
  const [selectedMailbox, setSelectedMailbox] = useState<string>("inbox");
  const [firstEmailUid, setFirstEmailUid] = useState<number | null>(null);

  useEffect(() => {
    // Charger le premier email de la boîte de réception
    const loadFirstEmail = async () => {
      try {
        const response = await EmailsAPI.getInboxEmails({
          mailbox: selectedMailbox,
          limit: 1,
          offset: 0,
        });
        if (response.data.length > 0) {
          setFirstEmailUid(response.data[0].uid);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du premier email:", error);
      }
    };

    loadFirstEmail();
  }, [selectedMailbox]);

  return (
    <>
      <PageMeta
        title="React.js Inbox Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Inbox Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="sm:h-[calc(100vh-174px)] xl:h-[calc(100vh-186px)]">
        <div className="flex flex-col gap-5 xl:grid xl:grid-cols-12 sm:gap-5">
          <div className="xl:col-span-3 col-span-full">
            <EmailSidebar onMailboxSelect={setSelectedMailbox} selectedMailbox={selectedMailbox} />
          </div>
          <div className="w-full xl:col-span-9">
            {firstEmailUid ? (
              <EmailWrapper
                emailUid={firstEmailUid}
                mailbox={selectedMailbox}
                onClose={() => {
                  // Recharger le premier email
                  setFirstEmailUid(null);
                  setTimeout(() => {
                    const loadFirstEmail = async () => {
                      try {
                        const response = await EmailsAPI.getInboxEmails({
                          mailbox: selectedMailbox,
                          limit: 1,
                          offset: 0,
                        });
                        if (response.data.length > 0) {
                          setFirstEmailUid(response.data[0].uid);
                        }
                      } catch (error) {
                        console.error("Erreur lors du chargement du premier email:", error);
                      }
                    };
                    loadFirstEmail();
                  }, 100);
                }}
              />
            ) : (
              <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:h-full">
                <div className="flex items-center justify-center py-20">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Aucun email à afficher</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
