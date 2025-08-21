import { Navigate } from "react-router-dom";

import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { useAuth } from "../../hooks/use-auth";

type AuthRouteProps = {
  children: React.ReactNode;
};

export function AuthRoute({ children }: AuthRouteProps) {
  const { isAuth, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage size="lg" />;
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}