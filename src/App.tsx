import { Routes, Route } from "react-router-dom";
import Ecommerce from "./pages/Dashboard/Ecommerce";
import Analytics from "./pages/Dashboard/Analytics";
import Crm from "./pages/Dashboard/Crm";
import Stocks from "./pages/Dashboard/Stocks";
import Saas from "./pages/Dashboard/Saas";
import Logistics from "./pages/Dashboard/Logistics";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import TwoStepVerification from "./pages/AuthPages/TwoStepVerification";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import AlternativeLayout from "./layout/AlternativeLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { FeatureGuard } from "./components/guards/FeatureGuard";
import UserProfiles from "./pages/UserProfiles";
import UserList from "./pages/Users/UserList";
import ContractAddons from "./pages/Gestion/ContractAddons";
import ContractPackages from "./pages/Gestion/ContractPackages";
import ContractTypes from "./pages/Gestion/ContractTypes";
import DressTypes from "./pages/Gestion/DressTypes";
import DressSizes from "./pages/Gestion/DressSizes";
import DressConditions from "./pages/Gestion/DressConditions";
import DressColors from "./pages/Gestion/DressColors";
import Customers from "./pages/Customers/Customers";
import Prospects from "./pages/Prospects/Prospects";
import Catalogue from "./pages/Catalogue/Catalogue";
import ContractBuilder from "./pages/ContractBuilder/ContractBuilder";
import ContractSignPage from "./pages/Public/ContractSignPage";
import Calendar from "./pages/Calendar";
import Changelog from "./pages/Changelog";
import Inbox from "./pages/Email/EmailInbox";
import OrganizationSettings from "./pages/Settings/OrganizationSettings";
import BillingSettings from "./pages/Settings/BillingSettings";
import ServiceTypes from "./pages/Settings/ServiceTypes";
import PricingRules from "./pages/Settings/PricingRules";
import Pricing from "./pages/Public/Pricing";
import SubscriptionSuccess from "./pages/Subscription/SubscriptionSuccess";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* --- Public Pages --- */}
        <Route path="/pricing" element={<Pricing />} />

        {/* --- Auth Pages --- */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/two-step-verification" element={<TwoStepVerification />} />

        <Route path="/sign-links/:token" element={<ContractSignPage />} />

        {/* --- Subscription Success (Protected) --- */}
        <Route
          path="/subscription/success"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"]}>
              <SubscriptionSuccess />
            </ProtectedRoute>
          }
        />

        {/* --- Dashboard Protected Layout --- */}
        <Route element={<AppLayout />}>
          <Route
            index
            path="/"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <FeatureGuard feature="dashboard" fallback="/catalogue">
                  <Ecommerce />
                </FeatureGuard>
              </ProtectedRoute>
            }
          />
          <Route
            index
            path="/changelog"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <Changelog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
                <Inbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <Crm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stocks"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <Stocks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saas"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
                <Saas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistics"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <Logistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"]}>
                <UserProfiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/list"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"]}>
                <FeatureGuard feature="customer_portal" fallback="/catalogue">
                  <Customers />
                </FeatureGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/prospects"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"]}>
                <FeatureGuard feature="prospect_management" fallback="/catalogue">
                  <Prospects />
                </FeatureGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogue"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"]}>
                <FeatureGuard feature="inventory_management" fallback="/">
                  <Catalogue />
                </FeatureGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contract-builder"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"]}>
                <FeatureGuard feature="contract_generation" fallback="/catalogue">
                  <ContractBuilder />
                </FeatureGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"]}>
                <FeatureGuard feature="planning" fallback="/catalogue">
                  <Calendar />
                </FeatureGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/contract-addons"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <ContractAddons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/contract-package"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <ContractPackages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/contract-types"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]}>
                <ContractTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/dress-types"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <DressTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/dress-sizes"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <DressSizes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/dress-conditions"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <DressConditions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/dress-colors"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <DressColors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/organization"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN","MANAGER"]}>
                <OrganizationSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/billing"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER", "COLLABORATOR"]}>
                <BillingSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/service-types"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <ServiceTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/pricing-rules"
            element={
              <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "MANAGER"]}>
                <PricingRules />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* --- Alternative Layout --- */}
        <Route element={<AlternativeLayout />}>
          <Route path="/coming-soon" element={<div>Prochainement...</div>} />
        </Route>

        {/* --- Fallback --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
