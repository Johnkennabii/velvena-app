import { FiCheck, FiX } from "react-icons/fi";

interface PasswordValidatorProps {
  password: string;
  className?: string;
}

interface ValidationRule {
  label: string;
  isValid: boolean;
}

export function PasswordValidator({ password, className = "" }: PasswordValidatorProps) {
  const rules: ValidationRule[] = [
    {
      label: "Au moins 10 caractères",
      isValid: password.length >= 10,
    },
    {
      label: "Au moins 1 majuscule",
      isValid: /[A-Z]/.test(password),
    },
    {
      label: "Au moins 2 chiffres",
      isValid: (password.match(/\d/g) || []).length >= 2,
    },
    {
      label: "Au moins 1 caractère spécial (!@#$%^&*)",
      isValid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
  ];

  const allValid = rules.every((rule) => rule.isValid);

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Exigences du mot de passe:
      </p>
      <ul className="space-y-1.5">
        {rules.map((rule, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            {rule.isValid ? (
              <FiCheck className="size-4 text-success-500 flex-shrink-0" />
            ) : (
              <FiX className="size-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
            )}
            <span
              className={
                rule.isValid
                  ? "text-success-600 dark:text-success-400"
                  : "text-gray-500 dark:text-gray-400"
              }
            >
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
      {password.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  allValid
                    ? "bg-success-500 w-full"
                    : rules.filter((r) => r.isValid).length >= 3
                    ? "bg-orange-500 w-3/4"
                    : rules.filter((r) => r.isValid).length >= 2
                    ? "bg-orange-400 w-1/2"
                    : "bg-red-500 w-1/4"
                }`}
              />
            </div>
            <span
              className={`text-xs font-medium ${
                allValid
                  ? "text-success-600 dark:text-success-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {allValid ? "Fort" : "Faible"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function validatePassword(password: string): boolean {
  return (
    password.length >= 10 &&
    /[A-Z]/.test(password) &&
    (password.match(/\d/g) || []).length >= 2 &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  );
}
