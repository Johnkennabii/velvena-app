import { useEffect, useRef, useState } from "react";

export interface DressComboboxOption {
  id: string;
  name: string;
  reference: string;
  isAvailable: boolean;
}

interface DressComboboxProps {
  options: DressComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
}

const DressCombobox: React.FC<DressComboboxProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Rechercher une robe...",
  disabled = false,
  emptyMessage = "Aucune robe trouvée",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Trouver la robe sélectionnée
  const selectedDress = options.find((opt) => opt.id === value);

  // Filtrer les robes selon la recherche (nom ou référence)
  const filteredOptions = options.filter((dress) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      dress.name.toLowerCase().includes(query) ||
      dress.reference.toLowerCase().includes(query)
    );
  });

  // Réinitialiser l'index surligné quand les options filtrées changent
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Fermer au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Gérer les touches clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].id);
          setIsOpen(false);
          setSearchQuery("");
          inputRef.current?.blur();
        } else {
          setIsOpen(true);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll automatique vers l'élément surligné
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (dressId: string) => {
    onChange(dressId);
    setIsOpen(false);
    setSearchQuery("");
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Input de recherche */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : selectedDress ? `${selectedDress.name} • ${selectedDress.reference}` : ""}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearchQuery("");
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          }`}
        />

        {/* Icône de recherche/flèche */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isOpen ? (
            <svg
              className="text-gray-700 dark:text-gray-400"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.2084 11.9792L10.0001 6.77087L4.79175 11.9792"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              className="text-gray-700 dark:text-gray-400"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.79175 8.02075L10.0001 13.2291L15.2084 8.02075"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Liste déroulante */}
      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <ul
            ref={listRef}
            className="max-h-64 overflow-y-auto py-1"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((dress, index) => (
                <li
                  key={dress.id}
                  onClick={() => handleSelect(dress.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex items-start gap-3 cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                    index === highlightedIndex
                      ? "bg-brand-50 dark:bg-brand-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  } ${
                    dress.id === value
                      ? "bg-brand-100 dark:bg-brand-500/20"
                      : ""
                  }`}
                  role="option"
                  aria-selected={dress.id === value}
                >
                  {/* Icône de disponibilité */}
                  <div className="flex-shrink-0">
                    {dress.isAvailable ? (
                      <svg
                        className="text-success-600 dark:text-success-400"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.6663 5L7.49967 14.1667L3.33301 10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="text-error-600 dark:text-error-400"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 5L5 15M5 5L15 15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Nom et référence */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white break-words">
                      {dress.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Réf: {dress.reference}
                    </p>
                  </div>

                  {/* Checkmark si sélectionné */}
                  {dress.id === value && (
                    <div className="flex-shrink-0">
                      <svg
                        className="text-brand-600 dark:text-brand-400"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.6663 5L7.49967 14.1667L3.33301 10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DressCombobox;
