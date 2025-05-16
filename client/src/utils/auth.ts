import jwt_decode from "jwt-decode";

export interface User {
  number: string;
  id: string;
  email: string;
  isAdmin: boolean;
  name: string;
  exp?: number; // JWT expiration timestamp (added for validation)
  // Add other fields from your JWT payload
}

export const getCurrentUser = (): User | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwt_decode<User>(token);

    // Check token expiration
    if (decoded.exp && isTokenExpired(decoded.exp)) {
      console.warn("Token expired");
      localStorage.removeItem("token"); // Clean up expired token
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Invalid token", error);
    localStorage.removeItem("token"); // Clean up invalid token
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (expirationTimestamp: number): boolean => {
  return Date.now() >= expirationTimestamp * 1000; // Convert to milliseconds
};

export const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  // Only return auth header if token exists AND isn't expired
  if (token) {
    try {
      const decoded = jwt_decode<{ exp?: number }>(token);
      if (!decoded.exp || !isTokenExpired(decoded.exp)) {
        return { Authorization: `Bearer ${token}` };
      }
    } catch (error) {
      console.error("Invalid token", error);
    }
  }
  return {};
};
