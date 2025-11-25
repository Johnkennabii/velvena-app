import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import UserProfileDrawer from "./UserProfileDrawer";

export default function UserInfoCard() {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const profile = user?.profile || {};
  const firstname = profile.firstname || profile.firstName || "—";
  const lastname = profile.lastname || profile.lastName || "—";
  const email = user?.email || "—";

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
              <svg className="text-brand-600 dark:text-brand-400" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.0838 17.5C17.0838 14.5016 13.9252 12.0833 10.0005 12.0833C6.0758 12.0833 2.91716 14.5016 2.91716 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations personnelles
            </h3>
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill="currentColor"/>
            </svg>
            Modifier
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Prénom */}
            <div className="group">
              <div className="mb-2 flex items-center gap-2">
                <svg className="text-gray-400 dark:text-gray-600" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.0838 17.5C17.0838 14.5016 13.9252 12.0833 10.0005 12.0833C6.0758 12.0833 2.91716 14.5016 2.91716 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Prénom
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {firstname}
              </p>
            </div>

            {/* Nom */}
            <div className="group">
              <div className="mb-2 flex items-center gap-2">
                <svg className="text-gray-400 dark:text-gray-600" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.0838 17.5C17.0838 14.5016 13.9252 12.0833 10.0005 12.0833C6.0758 12.0833 2.91716 14.5016 2.91716 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Nom
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {lastname}
              </p>
            </div>

            {/* Email */}
            <div className="group sm:col-span-2 lg:col-span-1">
              <div className="mb-2 flex items-center gap-2">
                <svg className="text-gray-400 dark:text-gray-600" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 6.66667L9.0755 11.0504C9.63533 11.4236 10.3647 11.4236 10.9245 11.0504L17.5 6.66667M4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Email
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <UserProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
