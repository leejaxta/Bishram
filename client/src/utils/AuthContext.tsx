import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { getCurrentUser, User } from "./auth"; // Import from your existing auth.ts

// ==================== CONTEXT TYPES ====================
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ==================== AUTH CONTEXT ====================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<{
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
  }>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  // Initialize auth state from existing token
  useEffect(() => {
    const user = getCurrentUser();
    setAuthState({
      user,
      isAuthenticated: !!user,
      loading: false,
    });
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const user = getCurrentUser();
    setAuthState({
      user,
      isAuthenticated: !!user,
      loading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
        login,
        logout,
        loading: authState.loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==================== CUSTOM HOOK ====================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
