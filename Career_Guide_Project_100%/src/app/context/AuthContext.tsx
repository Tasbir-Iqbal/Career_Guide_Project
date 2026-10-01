import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Role = "guest" | "student" | "counselor" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Exclude<Role, "guest">;
  avatar?: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: "student" | "counselor";
  major?: string;
  specialization?: string;
  bio?: string;
  availability?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
  role: Exclude<Role, "guest">;
}

interface CounselorSignupResponse {
  message: string;
  user_id: number;
  name: string;
  role: "counselor";
  approval_status: "pending";
}

type SignupResponse = TokenResponse | CounselorSignupResponse;

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string,
    loginRole?: Role
  ) => Promise<Exclude<Role, "guest">>;
  signup: (data: SignupData) => Promise<SignupResponse>;
  logout: () => void;
}

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const AUTH_STORAGE_KEY = "careerguide_auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredSession(): { token: string | null; user: User | null } {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!stored) {
      return { token: null, user: null };
    }

    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { token: null, user: null };
  }
}

async function getApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.detail || "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

function isTokenResponse(response: SignupResponse): response is TokenResponse {
  return "access_token" in response;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedSession = getStoredSession();

  const [token, setToken] = useState<string | null>(storedSession.token);
  const [user, setUser] = useState<User | null>(storedSession.user);

  const role: Role = user?.role ?? "guest";

  function saveSession(newToken: string, newUser: User) {
    setToken(newToken);
    setUser(newUser);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: newToken,
        user: newUser,
      })
    );
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  useEffect(() => {
    async function verifyStoredToken() {
      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          logout();
          return;
        }

        const data = await response.json();

        saveSession(token, {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
        });
      } catch {
        // Keep the saved session if the backend is temporarily unavailable.
      }
    }

    verifyStoredToken();
  }, []);

  async function signup(data: SignupData): Promise<SignupResponse> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: data.role,
        specialization: data.specialization?.trim() || null,
        bio: data.bio?.trim() || null,
        availability: data.availability?.trim() || "Available",
      }),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    const result: SignupResponse = await response.json();

    if (isTokenResponse(result)) {
      saveSession(result.access_token, {
        id: result.user_id,
        name: result.name,
        email: data.email.trim().toLowerCase(),
        role: result.role,
      });
    }

    return result;
  }

  async function login(
    email: string,
    password: string,
    _loginRole?: Role
  ): Promise<Exclude<Role, "guest">> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    const result: TokenResponse = await response.json();

    saveSession(result.access_token, {
      id: result.user_id,
      name: result.name,
      email: email.trim().toLowerCase(),
      role: result.role,
    });

    return result.role;
  }

  function handleSetRole(newRole: Role) {
    if (newRole === "guest") {
      logout();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole: handleSetRole,
        user,
        token,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}