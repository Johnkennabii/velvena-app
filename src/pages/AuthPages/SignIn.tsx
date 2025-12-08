import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Connexion - Velvena App"
        description="Connez-vous à votre compte Velvena pour accéder à vos fonctionnalités personnalisées et gérer vos préférences."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
