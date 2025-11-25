import { useState } from "react";
import SimpleBar from "simplebar-react";
import Button from "../../ui/button/Button";
import { EmailsAPI } from "../../../api/endpoints/emails";
import { useNotification } from "../../../context/NotificationContext";
import EmailRecipientInput from "./EmailRecipientInput";

interface EmailComposeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSent?: () => void;
}

export default function EmailComposeDrawer({ isOpen, onClose, onEmailSent }: EmailComposeDrawerProps) {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmails = (emailString: string): boolean => {
    if (!emailString.trim()) return true; // Empty is valid for optional fields

    const emails = emailString.split(",").map((e) => e.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emails.every((email) => emailRegex.test(email));
  };

  const parseEmails = (emailString: string): string[] => {
    return emailString
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.to.trim()) {
      notify("error", "Erreur", "Veuillez saisir au moins un destinataire");
      return;
    }

    if (!validateEmails(formData.to)) {
      notify("error", "Erreur", "Une ou plusieurs adresses email dans 'À' sont invalides");
      return;
    }

    if (formData.cc && !validateEmails(formData.cc)) {
      notify("error", "Erreur", "Une ou plusieurs adresses email dans 'CC' sont invalides");
      return;
    }

    if (formData.bcc && !validateEmails(formData.bcc)) {
      notify("error", "Erreur", "Une ou plusieurs adresses email dans 'BCC' sont invalides");
      return;
    }

    if (!formData.subject.trim()) {
      notify("error", "Erreur", "Veuillez saisir un objet");
      return;
    }

    if (!formData.body.trim()) {
      notify("error", "Erreur", "Veuillez saisir un message");
      return;
    }

    setLoading(true);

    try {
      await EmailsAPI.send({
        to: parseEmails(formData.to),
        cc: formData.cc ? parseEmails(formData.cc) : undefined,
        bcc: formData.bcc ? parseEmails(formData.bcc) : undefined,
        subject: formData.subject,
        body: formData.body,
        isHtml: false, // Pour l'instant on envoie du texte brut
      });

      notify("success", "Email envoyé", "Votre email a été envoyé avec succès");

      // Reset form
      setFormData({
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        body: "",
      });

      onClose();

      // Callback pour rafraîchir la liste si nécessaire
      if (onEmailSent) {
        onEmailSent();
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      notify("error", "Erreur", "Impossible d'envoyer l'email. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Demander confirmation si le formulaire contient des données
    if (formData.to || formData.subject || formData.body) {
      if (window.confirm("Voulez-vous vraiment annuler ? Vos modifications seront perdues.")) {
        setFormData({
          to: "",
          cc: "",
          bcc: "",
          subject: "",
          body: "",
        });
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={handleCancel}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg">
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M17.0911 3.03206C16.2124 2.15338 14.7878 2.15338 13.9091 3.03206L5.6074 11.3337C5.29899 11.6421 5.08687 12.0335 4.99684 12.4603L4.26177 15.945C4.20943 16.1931 4.286 16.4508 4.46529 16.6301C4.64458 16.8094 4.90232 16.8859 5.15042 16.8336L8.63507 16.0985C9.06184 16.0085 9.45324 15.7964 9.76165 15.488L18.0633 7.18631C18.942 6.30763 18.942 4.88301 18.0633 4.00433L17.0911 3.03206ZM14.9697 4.09272C15.2626 3.79982 15.7375 3.79982 16.0304 4.09272L17.0027 5.06499C17.2956 5.35788 17.2956 5.83276 17.0027 6.12565L16.1043 7.02402L14.0714 4.99109L14.9697 4.09272ZM13.0107 6.05175L6.66806 12.3944C6.56526 12.4972 6.49455 12.6277 6.46454 12.7699L5.96704 15.1283L8.32547 14.6308C8.46772 14.6008 8.59819 14.5301 8.70099 14.4273L15.0436 8.08468L13.0107 6.05175Z"
                    fill=""
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nouveau message</h2>
            </div>
            <button
              onClick={handleCancel}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <SimpleBar className="custom-scrollbar flex-1">
              <div className="p-6 space-y-5">
                {/* To with autocomplete */}
                <div>
                  <EmailRecipientInput
                    value={formData.to}
                    onChange={(value) => setFormData((prev) => ({ ...prev, to: value }))}
                    label="À"
                    placeholder="Saisissez un nom, prénom, téléphone ou email..."
                    required
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Séparez plusieurs adresses par des virgules
                  </p>
                </div>

                {/* CC with autocomplete */}
                <EmailRecipientInput
                  value={formData.cc}
                  onChange={(value) => setFormData((prev) => ({ ...prev, cc: value }))}
                  label="CC"
                  placeholder="Saisissez un nom, prénom, téléphone ou email..."
                  disabled={loading}
                />

                {/* BCC with autocomplete */}
                <EmailRecipientInput
                  value={formData.bcc}
                  onChange={(value) => setFormData((prev) => ({ ...prev, bcc: value }))}
                  label="Cci"
                  placeholder="Saisissez un nom, prénom, téléphone ou email..."
                  disabled={loading}
                />

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Objet <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Objet de votre message"
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    disabled={loading}
                  />
                </div>

                {/* Body */}
                <div>
                  <label htmlFor="body" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message <span className="text-error-500">*</span>
                  </label>
                  <textarea
                    id="body"
                    name="body"
                    value={formData.body}
                    onChange={handleChange}
                    placeholder="Votre message..."
                    rows={16}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 resize-none focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    disabled={loading}
                  />
                </div>
              </div>
            </SimpleBar>

            {/* Footer with actions */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-[#171f2f]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 shadow-theme-xs hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 transition-colors"
                  disabled={loading}
                  title="Ajouter une pièce jointe (bientôt disponible)"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10.6685 12.035C10.6685 12.044 10.6686 12.0529 10.6689 12.0617V13.4533C10.6689 13.8224 10.3697 14.1216 10.0006 14.1216C9.63155 14.1216 9.33235 13.8224 9.33235 13.4533V5.12807C9.33235 4.71385 8.99657 4.37807 8.58235 4.37807C8.16814 4.37807 7.83235 4.71385 7.83235 5.12807V13.4533C7.83235 14.6508 8.80313 15.6216 10.0006 15.6216C11.1981 15.6216 12.1689 14.6508 12.1689 13.4533V5.12807C12.1689 5.11803 12.1687 5.10804 12.1683 5.09811C12.1522 3.1311 10.5527 1.5415 8.58189 1.5415C6.60108 1.5415 4.99532 3.14727 4.99532 5.12807L4.99532 12.035C4.99532 12.0414 4.9954 12.0477 4.99556 12.0539V13.4533C4.99556 16.2174 7.2363 18.4582 10.0004 18.4582C12.7645 18.4582 15.0053 16.2174 15.0053 13.4533V7.96463C15.0053 7.55042 14.6695 7.21463 14.2553 7.21463C13.841 7.21463 13.5053 7.55042 13.5053 7.96463V13.4533C13.5053 15.389 11.9361 16.9582 10.0004 16.9582C8.06473 16.9582 6.49556 15.389 6.49556 13.4533V7.96463C6.49556 7.95832 6.49548 7.95202 6.49532 7.94574L6.49532 5.12807C6.49532 3.97569 7.42951 3.0415 8.58189 3.0415C9.73427 3.0415 10.6685 3.97569 10.6685 5.12807L10.6685 12.035Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
