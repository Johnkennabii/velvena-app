import { useState, useRef, useEffect } from "react";
import { CustomersAPI } from "../../../api/endpoints/customers";

interface EmailRecipientInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
}

interface CustomerSuggestion {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

export default function EmailRecipientInput({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
}: EmailRecipientInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Récupérer la dernière adresse email en cours de saisie
  const getLastEmail = (inputValue: string): string => {
    const emails = inputValue.split(",").map((e) => e.trim());
    return emails[emails.length - 1] || "";
  };

  // Rechercher des clients en fonction du texte saisi
  useEffect(() => {
    const lastEmail = getLastEmail(value);

    if (!lastEmail || lastEmail.includes("@")) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchCustomers = async () => {
      setLoading(true);
      try {
        // Rechercher les clients par nom, prénom ou téléphone
        const response = await CustomersAPI.list({ search: lastEmail, limit: 10 });
        const customerSuggestions = response.data
          .filter((customer) => customer.email) // Uniquement les clients avec email
          .map((customer) => ({
            id: customer.id,
            email: customer.email!,
            name: `${customer.firstname} ${customer.lastname}`.trim(),
            phone: customer.phone || undefined,
          }));

        setSuggestions(customerSuggestions);
        setShowSuggestions(customerSuggestions.length > 0);
        setHighlightedIndex(0);
      } catch (error) {
        console.error("Erreur lors de la recherche de clients:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  // Fermer les suggestions au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (email: string) => {
    const emails = value.split(",").map((e) => e.trim());
    emails[emails.length - 1] = email;
    onChange(emails.join(", ") + ", ");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        if (suggestions[highlightedIndex]) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[highlightedIndex].email);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={label} className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-error-500">*</span>}
      </label>
      <input
        ref={inputRef}
        type="text"
        id={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        disabled={disabled}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 max-h-60 overflow-y-auto">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                onClick={() => handleSelectSuggestion(suggestion.email)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                  index === highlightedIndex
                    ? "bg-brand-50 dark:bg-brand-500/10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-semibold">
                    {suggestion.name[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {suggestion.email}
                      {suggestion.phone && ` • ${suggestion.phone}`}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-11 transform -translate-y-1/2">
          <svg
            className="w-4 h-4 animate-spin text-brand-500"
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
        </div>
      )}
    </div>
  );
}
