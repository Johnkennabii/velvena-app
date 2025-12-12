/**
 * Types pour le système de templates de contrats personnalisables
 */

export interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  contract_type_id: string;
  organization_id?: string;
  content: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  contract_type?: {
    id: string;
    name: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface CreateContractTemplateRequest {
  name: string;
  description?: string;
  contract_type_id: string;
  content: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface UpdateContractTemplateRequest {
  name?: string;
  description?: string;
  content?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface ContractTemplatePreview {
  html: string;
  variables: Record<string, any>;
}

export interface ValidateTemplateRequest {
  content: string;
}

export interface ValidateTemplateResponse {
  valid: boolean;
  errors?: string[];
}

/**
 * Variables disponibles dans les templates Handlebars
 */
export interface TemplateVariables {
  // Client
  client: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zipCode?: string;
  };

  // Organisation
  org: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    siret?: string;
    managerFullName?: string;
    managerInitials?: string;
  };

  // Contrat
  contract: {
    id: string;
    number: string;
    type: string;
    status: string;
    totalTTC: number;
    totalHT: number;
    totalDeposit: number;
    startDate: string;
    endDate: string;
    createdAt: string;
    notes?: string;
  };

  // Signature électronique
  signature?: {
    method: string;
    date: string;
    ipAddress?: string;
    userAgent?: string;
  };

  // Robes (liste)
  dresses?: Array<{
    id: string;
    name: string;
    reference: string;
    size?: string;
    color?: string;
    pricePerDay: number;
    quantity: number;
    days: number;
    subtotal: number;
  }>;

  // Options/Addons (liste)
  addons?: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;

  // Packages (liste)
  packages?: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    subtotal: number;
  }>;

  // Dates importantes
  dates?: {
    eventDate?: string;
    pickupDate?: string;
    returnDate?: string;
  };
}

/**
 * Catégories de variables pour l'aide dans l'éditeur
 */
export interface VariableCategory {
  name: string;
  description: string;
  variables: Array<{
    path: string;
    description: string;
    example?: string;
  }>;
}

export const TEMPLATE_VARIABLE_CATEGORIES: VariableCategory[] = [
  {
    name: "Client",
    description: "Informations du client",
    variables: [
      { path: "client.fullName", description: "Nom complet", example: "Marie Dupont" },
      { path: "client.firstName", description: "Prénom", example: "Marie" },
      { path: "client.lastName", description: "Nom de famille", example: "Dupont" },
      { path: "client.email", description: "Email", example: "marie@example.com" },
      { path: "client.phone", description: "Téléphone", example: "06 12 34 56 78" },
      { path: "client.address", description: "Adresse", example: "15 rue de la Paix" },
      { path: "client.city", description: "Ville", example: "Paris" },
      { path: "client.zipCode", description: "Code postal", example: "75001" },
    ],
  },
  {
    name: "Organisation",
    description: "Informations de votre entreprise",
    variables: [
      { path: "org.name", description: "Nom de l'entreprise", example: "Velvena" },
      { path: "org.city", description: "Ville", example: "Lyon" },
      { path: "org.address", description: "Adresse", example: "10 avenue..." },
      { path: "org.phone", description: "Téléphone", example: "04 12 34 56 78" },
      { path: "org.email", description: "Email", example: "contact@velvena.fr" },
      { path: "org.siret", description: "SIRET", example: "123 456 789 00012" },
      { path: "org.managerFullName", description: "Nom du gérant", example: "Sophie Martin" },
      { path: "org.managerInitials", description: "Initiales du gérant", example: "SM" },
    ],
  },
  {
    name: "Contrat",
    description: "Détails du contrat",
    variables: [
      { path: "contract.number", description: "Numéro du contrat", example: "CTR-2025-001" },
      { path: "contract.type", description: "Type de contrat", example: "Location Négafa" },
      { path: "contract.totalTTC", description: "Montant total TTC", example: "2500.00" },
      { path: "contract.totalHT", description: "Montant total HT", example: "2083.33" },
      { path: "contract.totalDeposit", description: "Montant de l'acompte", example: "500.00" },
      { path: "contract.startDate", description: "Date de début", example: "2025-06-15" },
      { path: "contract.endDate", description: "Date de fin", example: "2025-06-20" },
      { path: "contract.createdAt", description: "Date de création", example: "2025-12-11" },
      { path: "contract.notes", description: "Notes du contrat" },
    ],
  },
  {
    name: "Signature",
    description: "Informations de signature électronique",
    variables: [
      { path: "signature.method", description: "Méthode de signature", example: "electronic" },
      { path: "signature.date", description: "Date de signature", example: "2025-12-11 14:30" },
      { path: "signature.ipAddress", description: "Adresse IP", example: "192.168.1.1" },
    ],
  },
  {
    name: "Listes (Loops)",
    description: "Boucles pour afficher des listes",
    variables: [
      {
        path: "{{#each dresses}}...{{/each}}",
        description: "Boucle sur les robes",
        example: "{{#each dresses}}<li>{{this.name}} - {{currency this.pricePerDay}}</li>{{/each}}",
      },
      {
        path: "{{#each addons}}...{{/each}}",
        description: "Boucle sur les options",
        example: "{{#each addons}}<li>{{this.name}} - {{currency this.price}}</li>{{/each}}",
      },
      {
        path: "{{#each packages}}...{{/each}}",
        description: "Boucle sur les packages",
        example: "{{#each packages}}<li>{{this.name}} - {{currency this.price}}</li>{{/each}}",
      },
    ],
  },
  {
    name: "Helpers",
    description: "Fonctions de formatage disponibles",
    variables: [
      {
        path: "{{currency value}}",
        description: "Format monétaire",
        example: "{{currency contract.totalTTC}} → 2 500,00 €",
      },
      {
        path: "{{date value}}",
        description: "Format date",
        example: "{{date contract.startDate}} → 15/06/2025",
      },
      {
        path: "{{datetime value}}",
        description: "Format date + heure",
        example: "{{datetime signature.date}} → 11/12/2025 14:30",
      },
      {
        path: "{{#if condition}}...{{/if}}",
        description: "Condition",
        example: "{{#if signature}}Signé électroniquement{{/if}}",
      },
      {
        path: "{{#ifEquals a b}}...{{/ifEquals}}",
        description: "Comparaison",
        example: "{{#ifEquals contract.status 'signed'}}✓ Signé{{/ifEquals}}",
      },
    ],
  },
];
