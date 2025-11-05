import { useState } from "react";
import { IoAddSharp } from "react-icons/io5";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router";

export default function QuickActionsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  const triggerQuickAction = (
    eventName: string,
    path: string,
    detail?: Record<string, unknown>
  ) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    closeDropdown();

    if (location.pathname !== path) {
      const state = detail ? { quickAction: eventName, ...detail } : { quickAction: eventName };
      navigate(path, { state });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="dropdown-toggle flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.06]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <IoAddSharp className="size-4" />
        <span>Plus</span>
      </button>

      <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-56">
        <div className="py-2">
          <DropdownItem
            onItemClick={() => triggerQuickAction("open-create-customer", "/customers")}
            baseClassName="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.08]"
          >
            Ajouter un client
          </DropdownItem>
          <DropdownItem
            onItemClick={() => triggerQuickAction("open-contract-drawer", "/catalogue", { mode: "daily" })}
            baseClassName="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.08]"
          >
            Ajouter un contrat
          </DropdownItem>
          {hasRole("ADMIN", "MANAGER") && (
            <DropdownItem
              onItemClick={() => triggerQuickAction("open-create-dress", "/catalogue")}
              baseClassName="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.08]"
            >
              Ajouter une robe
            </DropdownItem>
          )}
        </div>
      </Dropdown>
    </div>
  );
}