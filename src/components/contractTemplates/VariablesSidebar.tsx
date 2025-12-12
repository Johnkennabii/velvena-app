import { useState } from "react";
import { TEMPLATE_VARIABLE_CATEGORIES } from "../../types/contractTemplate";

interface VariablesSidebarProps {
  onVariableClick?: (variablePath: string) => void;
}

/**
 * Sidebar affichant toutes les variables disponibles dans les templates
 * Organisé par catégories pour faciliter la navigation
 */
export function VariablesSidebar({ onVariableClick }: VariablesSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Client", "Organisation", "Contrat"]) // Catégories ouvertes par défaut
  );

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const handleVariableClick = (variablePath: string) => {
    // Copier dans le presse-papiers
    navigator.clipboard.writeText(`{{${variablePath}}}`);

    // Notification visuelle
    const notification = document.createElement("div");
    notification.textContent = "Copié !";
    notification.className =
      "fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50";
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 2000);

    // Callback optionnel
    if (onVariableClick) {
      onVariableClick(variablePath);
    }
  };

  return (
    <aside className="w-80 border-l border-gray-200 bg-gray-50 overflow-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <h3 className="font-semibold text-gray-900">Variables disponibles</h3>
        <p className="text-xs text-gray-500 mt-1">
          Cliquez pour copier dans le presse-papiers
        </p>
      </div>

      <div className="p-4 space-y-3">
        {TEMPLATE_VARIABLE_CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.has(category.name);

          return (
            <div key={category.name} className="border border-gray-200 rounded-lg bg-white">
              {/* En-tête de catégorie */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {category.name}
                  </h4>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    isExpanded ? "rotate-180" : ""
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

              {/* Liste des variables */}
              {isExpanded && (
                <div className="border-t border-gray-200">
                  {category.variables.map((variable, index) => (
                    <button
                      key={index}
                      onClick={() => handleVariableClick(variable.path)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      title="Cliquer pour copier"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <code className="text-xs font-mono text-blue-600 break-all">
                          {"{{"}{variable.path}{"}}"}
                        </code>
                        <svg
                          className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {variable.description}
                      </p>
                      {variable.example && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Ex: {variable.example}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer avec documentation */}
      <div className="border-t border-gray-200 bg-white p-4 mt-4">
        <h4 className="font-medium text-gray-900 text-sm mb-2">
          Syntaxe Handlebars
        </h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div>
            <code className="bg-gray-100 px-1 py-0.5 rounded">
              {"{{variable}}"}
            </code>
            <span className="ml-2">Variable simple</span>
          </div>
          <div>
            <code className="bg-gray-100 px-1 py-0.5 rounded">
              {"{{#if condition}}...{{/if}}"}
            </code>
            <span className="ml-2">Condition</span>
          </div>
          <div>
            <code className="bg-gray-100 px-1 py-0.5 rounded">
              {"{{#each list}}...{{/each}}"}
            </code>
            <span className="ml-2">Boucle</span>
          </div>
        </div>
        <a
          href="https://handlebarsjs.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline mt-3 inline-block"
        >
          Documentation Handlebars →
        </a>
      </div>
    </aside>
  );
}
