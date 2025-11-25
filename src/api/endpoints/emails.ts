import { httpClient } from "../httpClient";

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
}

export interface Email {
  id: string; // UID de l'email
  messageId: string;
  from: EmailAddress[];
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  date: string;
  snippet?: string; // Aperçu du contenu
  body?: {
    html?: string;
    text?: string;
  };
  attachments?: EmailAttachment[];
  flags: string[]; // \Seen, \Flagged, etc.
  folder: string; // INBOX, Sent, Trash, Spam
  size: number;
}

export interface EmailFolder {
  name: string;
  selectable: boolean;
}

export interface FoldersResponse {
  success: boolean;
  data: EmailFolder[];
}

export interface CreateFolderPayload {
  name: string;
}

export interface CreateFolderResponse {
  success: boolean;
  message: string;
  name: string;
}

export interface Mailbox {
  name: string;
  displayName: string;
  total: number;
  new: number;
}

export interface MailboxesResponse {
  success: boolean;
  data: Mailbox[];
}

export interface InboxEmailAddress {
  address: string;
  name?: string;
}

export interface InboxEmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content?: {
    type: string;
    data: number[];
  };
}

export interface InboxEmail {
  id: string;
  uid: number;
  subject: string;
  from: InboxEmailAddress[];
  to: InboxEmailAddress[];
  cc?: InboxEmailAddress[];
  bcc?: InboxEmailAddress[];
  date: string;
  attachments: InboxEmailAttachment[];
  flags: string[];
  hasAttachments: boolean;
  html?: string;
  text?: string;
}

export interface InboxEmailsResponse {
  success: boolean;
  data: InboxEmail[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

export interface EmailListResponse {
  emails: Email[];
  total: number;
  page: number;
  limit: number;
  folder: string;
}

export interface EmailListParams {
  folder?: string; // INBOX, Sent, Trash, Spam
  page?: number;
  limit?: number;
  search?: string;
  unreadOnly?: boolean;
}

export interface SendEmailPayload {
  to: string[]; // Adresses email
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string; // HTML ou texte
  isHtml?: boolean;
  attachments?: File[];
}

export interface EmailConfig {
  email: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
}

export const EmailsAPI = {
  /**
   * Récupère la liste des mailboxes avec leurs statistiques
   */
  async getMailboxes(): Promise<Mailbox[]> {
    const response: MailboxesResponse = await httpClient.get("/mails/mailboxes");
    return response.data;
  },

  /**
   * Récupère les emails d'une mailbox (inbox par défaut)
   */
  async getInboxEmails(params: { mailbox?: string; limit?: number; offset?: number } = {}): Promise<InboxEmailsResponse> {
    const { mailbox = "inbox", limit = 50, offset = 0 } = params;
    return httpClient.get(`/mails/${mailbox}?limit=${limit}&offset=${offset}`);
  },

  /**
   * Récupère la liste des dossiers (Inbox, Sent, Trash, Spam, et sous-dossiers)
   */
  async getFolders(): Promise<EmailFolder[]> {
    const response: FoldersResponse = await httpClient.get("/mails/folders");
    return response.data;
  },

  /**
   * Crée un nouveau dossier
   */
  async createFolder(payload: CreateFolderPayload): Promise<CreateFolderResponse> {
    return httpClient.post("/mails/folders", payload);
  },

  /**
   * Récupère la liste des emails d'un dossier
   */
  async list(params: EmailListParams = {}): Promise<EmailListResponse> {
    const queryParams = new URLSearchParams();

    if (params.folder) queryParams.append("folder", params.folder);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.unreadOnly) queryParams.append("unreadOnly", "true");

    const query = queryParams.toString();
    return httpClient.get(`/emails${query ? `?${query}` : ""}`);
  },

  /**
   * Récupère le contenu complet d'un email
   */
  async get(id: string, folder: string = "INBOX"): Promise<Email> {
    return httpClient.get(`/emails/${id}?folder=${folder}`);
  },

  /**
   * Envoie un nouvel email
   */
  async send(payload: SendEmailPayload): Promise<{ success: boolean; message?: string }> {
    // Le backend attend un JSON simple, pas un FormData
    const body = {
      to: payload.to.length === 1 ? payload.to[0] : payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      subject: payload.subject,
      html: payload.isHtml !== false ? payload.body : undefined,
      text: payload.isHtml === false ? payload.body : undefined,
    };

    // TODO: Les pièces jointes ne sont pas encore supportées par le backend
    // Il faudra utiliser FormData quand le backend le supportera
    if (payload.attachments && payload.attachments.length > 0) {
      console.warn("Les pièces jointes ne sont pas encore supportées");
    }

    return httpClient.post("/mails/send", body);
  },

  /**
   * Marque un email comme lu/non lu
   */
  async markAsRead(uid: number, mailbox: string = "inbox", read: boolean = true): Promise<void> {
    const action = read ? "read" : "unread";
    return httpClient.patch(`/mails/${mailbox}/${uid}/${action}`);
  },

  /**
   * Marque un email avec un flag (starred)
   */
  async toggleFlag(uid: number, mailbox: string = "inbox", flagged: boolean = true): Promise<void> {
    const action = flagged ? "add" : "remove";
    return httpClient.patch(`/mails/${mailbox}/${uid}/flag/${action}`, { flag: "\\Flagged" });
  },

  /**
   * Déplace un email vers un autre dossier
   */
  async move(uid: number, fromMailbox: string, toMailbox: string): Promise<void> {
    return httpClient.patch(`/mails/${fromMailbox}/${uid}/move`, { toMailbox });
  },

  /**
   * Récupère un email individuel
   */
  async getEmail(uid: number, mailbox: string): Promise<InboxEmail> {
    const response = await httpClient.get(`/mails/${mailbox}/${uid}`);
    return response.data;
  },

  /**
   * Supprime un email (déplace vers corbeille ou supprime définitivement)
   */
  async delete(uid: number, mailbox: string, permanent: boolean = false): Promise<void> {
    if (permanent) {
      // Suppression définitive (uniquement depuis trash)
      return httpClient.delete(`/mails/${mailbox}/${uid}/permanent`);
    } else {
      // Déplacement vers corbeille
      return httpClient.delete(`/mails/${mailbox}/${uid}`);
    }
  },

  /**
   * Télécharge une pièce jointe
   */
  async downloadAttachment(emailUid: number, attachmentIndex: number, mailbox: string = "inbox"): Promise<Blob> {
    const response = await fetch(
      `https://api.allure-creation.fr/emails/${emailUid}/attachments/${attachmentIndex}?mailbox=${mailbox}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erreur lors du téléchargement de la pièce jointe");
    }

    return response.blob();
  },

  /**
   * Récupère la configuration email de l'utilisateur
   */
  async getConfig(): Promise<EmailConfig> {
    return httpClient.get("/emails/config");
  },
};
