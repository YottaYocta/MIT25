import { useAuth } from "~/context/authContext";
import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";

interface RouteGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: RouteGuardProps) => {
  const { userInfo } = useAuth();

  return userInfo ? (
    <>
      <Outlet></Outlet>
    </>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default AuthGuard;
