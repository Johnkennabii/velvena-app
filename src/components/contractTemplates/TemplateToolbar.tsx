import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface TemplateToolbarProps {
  onInsert: (text: string) => void;
}

/**
 * Toolbar simplifiée pour insérer facilement des variables dans le template
 */
export function TemplateToolbar({ onInsert }: TemplateToolbarProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const categories = [
    {
      name: "Client",
      icon: "👤",
      items: [
        { label: "Nom complet", value: "{{client.fullName}}" },
        { label: "Prénom", value: "{{client.firstName}}" },
        { label: "Nom", value: "{{client.lastName}}" },
        { label: "Email", value: "{{client.email}}" },
        { label: "Téléphone", value: "{{client.phone}}" },
        { label: "Adresse", value: "{{client.address}}" },
        { label: "Ville", value: "{{client.city}}" },
        { label: "Code postal", value: "{{client.zipCode}}" },
      ],
    },
    {
      name: "Organisation",
      icon: "🏢",
      items: [
        { label: "Nom entreprise", value: "{{org.name}}" },
        { label: "Ville", value: "{{org.city}}" },
        { label: "Adresse", value: "{{org.address}}" },
        { label: "Téléphone", value: "{{org.phone}}" },
        { label: "Email", value: "{{org.email}}" },
        { label: "SIRET", value: "{{org.siret}}" },
        { label: "Nom gérant", value: "{{org.managerFullName}}" },
      ],
    },
    {
      name: "Contrat",
      icon: "📄",
      items: [
        { label: "Numéro", value: "{{contract.number}}" },
        { label: "Type", value: "{{contract.type}}" },
        { label: "Total TTC", value: "{{currency contract.totalTTC}}" },
        { label: "Total HT", value: "{{currency contract.totalHT}}" },
        { label: "Acompte", value: "{{currency contract.totalDeposit}}" },
        { label: "Date début", value: "{{date contract.startDate}}" },
        { label: "Date fin", value: "{{date contract.endDate}}" },
      ],
    },
    {
      name: "Listes",
      icon: "📋",
      items: [
        {
          label: "Liste des robes",
          value: `{{#each dresses}}
  <li>{{this.name}} - {{currency this.pricePerDay}}</li>
{{/each}}`,
        },
        {
          label: "Liste des options",
          value: `{{#each addons}}
  <li>{{this.name}} - {{currency this.price}}</li>
{{/each}}`,
        },
        {
          label: "Tableau des robes",
          value: `<table>
  <thead>
    <tr>
      <th>Article</th>
      <th>Quantité</th>
      <th>Prix unitaire</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    {{#each dresses}}
    <tr>
      <td>{{this.name}}</td>
      <td>{{this.quantity}}</td>
      <td>{{currency this.pricePerDay}}</td>
      <td>{{currency this.subtotal}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>`,
        },
      ],
    },
    {
      name: "Mise en forme",
      icon: "✨",
      items: [
        { label: "Titre (H1)", value: "<h1>Mon titre</h1>" },
        { label: "Sous-titre (H2)", value: "<h2>Mon sous-titre</h2>" },
        { label: "Paragraphe", value: "<p>Mon paragraphe</p>" },
        { label: "Gras", value: "<strong>Texte en gras</strong>" },
        { label: "Saut de ligne", value: "<br>" },
        { label: "Ligne horizontale", value: "<hr>" },
      ],
    },
  ];

  const handleInsert = (value: string) => {
    onInsert(value);
    setOpenCategory(null);
  };

  const toggleCategory = (categoryName: string) => {
    const newOpen = openCategory === categoryName ? null : categoryName;
    setOpenCategory(newOpen);

    if (newOpen && buttonRefs.current[categoryName]) {
      const button = buttonRefs.current[categoryName]!;
      const rect = button.getBoundingClientRect();
      const position = {
        top: rect.bottom + 4,
        left: rect.left,
      };
      setDropdownPosition(position);
    }
  };

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        openCategory &&
        !target.closest(".dropdown-toggle") &&
        !target.closest(".dropdown-portal")
      ) {
        setOpenCategory(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openCategory]);

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* Toolbar principale */}
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        {categories.map((category) => (
          <div key={category.name}>
            <button
              ref={(el) => (buttonRefs.current[category.name] = el)}
              onClick={() => toggleCategory(category.name)}
              className={`dropdown-toggle flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                openCategory === category.name
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  openCategory === category.name ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Dropdown rendu via Portal */}
      {openCategory && (() => {
        const currentCategory = categories.find((c) => c.name === openCategory);

        return createPortal(
          <div
            className="dropdown-portal fixed min-w-[280px] max-h-[400px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-dark"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              zIndex: 999999,
            }}
          >
            <div className="py-1">
              {currentCategory?.items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleInsert(item.value)}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{item.label}</div>
                  <code className="text-xs text-gray-500 dark:text-gray-400 font-mono block mt-1 truncate">
                    {item.value.split("\n")[0]}...
                  </code>
                </button>
              ))}
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Message d'aide */}
      <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
        <p className="text-xs text-blue-800">
          💡 <strong>Astuce :</strong> Cliquez sur les boutons ci-dessus pour
          insérer automatiquement des variables et du contenu dans votre template.
        </p>
      </div>
    </div>
  );
}
