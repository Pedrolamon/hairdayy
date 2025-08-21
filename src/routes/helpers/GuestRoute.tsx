import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { useAuth } from "../../hooks/use-auth";

type GuestRouteProps = {
  children: React.ReactNode;
};

export function GuestRoute({ children }: GuestRouteProps) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage size="lg" />;
  }

  return <>{children}</>;
}