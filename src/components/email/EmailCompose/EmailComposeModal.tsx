import { useState } from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { EmailsAPI } from "../../../api/endpoints/emails";
import { useNotification } from "../../../context/NotificationContext";

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSent?: () => void;
}

export default function EmailComposeModal({ isOpen, onClose, onEmailSent }: EmailComposeModalProps) {
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

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-xl font-semibold text-gray-900">Nouveau message</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            {/* To */}
            <div>
              <label htmlFor="to" className="block mb-2 text-sm font-medium text-gray-700">
                À <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="to"
                name="to"
                value={formData.to}
                onChange={handleChange}
                placeholder="destinataire@example.com, autre@example.com"
                className="w-full px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Séparez plusieurs adresses par des virgules
              </p>
            </div>

            {/* CC */}
            <div>
              <label htmlFor="cc" className="block mb-2 text-sm font-medium text-gray-700">
                CC
              </label>
              <input
                type="text"
                id="cc"
                name="cc"
                value={formData.cc}
                onChange={handleChange}
                placeholder="copie@example.com"
                className="w-full px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={loading}
              />
            </div>

            {/* BCC */}
            <div>
              <label htmlFor="bcc" className="block mb-2 text-sm font-medium text-gray-700">
                BCC
              </label>
              <input
                type="text"
                id="bcc"
                name="bcc"
                value={formData.bcc}
                onChange={handleChange}
                placeholder="copie.cachee@example.com"
                className="w-full px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={loading}
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-700">
                Objet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Objet de votre message"
                className="w-full px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={loading}
              />
            </div>

            {/* Body */}
            <div>
              <label htmlFor="body" className="block mb-2 text-sm font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Votre message..."
                rows={12}
                className="w-full px-4 py-2 border border-stroke rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-stroke bg-gray-50">
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
        </form>
      </div>
    </Modal>
  );
}
