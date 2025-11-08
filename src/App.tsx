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
import Catalogue from "./pages/Catalogue/Catalogue";
import ContractSignPage from "./pages/Public/ContractSignPage";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* --- Auth Pages --- */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/two-step-verification" element={<TwoStepVerification />} />

        <Route path="/sign-links/:token" element={<ContractSignPage />} />
        

        {/* --- Dashboard Protected Layout --- */}
        <Route element={<AppLayout />}>
          <Route
            index
            path="/"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <Ecommerce />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <Crm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stocks"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <Stocks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saas"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <Saas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistics"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <Logistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER", "COLLABORATOR"]}>
                <UserProfiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/list"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER", "COLLABORATOR"]}>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogue"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER", "COLLABORATOR"]}>
                <Catalogue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/contract-addons"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <ContractAddons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/contract-package"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <ContractPackages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/contract-types"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <ContractTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/dress-types"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <DressTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/dress-sizes"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <DressSizes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/dress-conditions"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <DressConditions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion/dress-colors"
            element={
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <DressColors />
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
