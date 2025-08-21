import { Navigate } from "react-router-dom";

import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { useAuth } from "../../hooks/use-auth";

type GuestRouteProps = {
  children: React.ReactNode;
};

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuth, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage size="lg" />;
  }

  if (isAuth) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}