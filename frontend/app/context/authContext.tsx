import { createContext, useState, useContext, type ReactNode } from "react";
import type { Option } from "~/utils";

type UserID = "user";

export interface AuthContextType {
  login: () => void;
  logout: () => void;
  userInfo: Option<UserID>;
}

const AuthContext = createContext<AuthContextType>({
  login: () => {},
  logout: () => {},
  userInfo: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<Option<UserID>>(null);

  const login = () => setUserInfo("user");
  const logout = () => setUserInfo(null);

  return (
    <AuthContext.Provider value={{ userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
