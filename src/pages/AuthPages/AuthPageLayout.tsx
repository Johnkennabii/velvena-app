import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
<div className="relative flex items-center justify-center z-1">
  {/* <!-- ===== Common Grid Shape Start ===== --> */}
  <GridShape />

  <div className="flex flex-col items-center max-w-xs">
    <Link to="/" className="block mb-4 select-none">
      <span
        className="
          text-4xl 
          font-[400]
          text-gray-900 
          dark:text-white 
        "
        style={{
          fontFamily: '"Great Vibes", cursive',
        }}
      >
        Allure Creation
      </span>
    </Link>

    <p className="text-center text-gray-400 dark:text-white/60">
      Bienvenue sur Allure Creation App, votre solution complète pour gérer
      vos clients, devis, factures et emails en toute simplicité.
    </p>
  </div>
</div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
