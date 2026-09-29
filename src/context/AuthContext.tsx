import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, MessMembership, AuthResponse, PendingJoinRequest } from '../types';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../api/client';

interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  studentId?: string;
  department?: string;
  university?: string;
  roomNumber: string;
}

interface AuthContextType {
  user: User | null;
  activeMembership: MessMembership | null;
  pendingJoinRequest: PendingJoinRequest | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (fullName: string, email: string, password?: string, phone?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  clearPendingRequest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeMembership, setActiveMembership] = useState<MessMembership | null>(null);
  const [pendingJoinRequest, setPendingJoinRequest] = useState<PendingJoinRequest | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /** Normalises user fields, ensuring isProfileComplete is robust across Jackson field names */
  const normaliseUser = (u: any): User => {
    const isComplete = Boolean(
      u.isProfileComplete ||
      u.profileComplete ||
      (u.roomNumber && String(u.roomNumber).trim().length > 0)
    );
    return {
      ...u,
      isProfileComplete: isComplete,
      profileComplete: isComplete,
    };
  };

  /** Normalises the response from backend — handles both mealId and messId field names */
  const normalise = (res: AuthResponse) => {
    if (res.user) {
      setUser(normaliseUser(res.user));
    } else {
      setUser(null);
    }
    if (res.activeMembership) {
      const m = res.activeMembership;
      setActiveMembership({
        ...m,
        // Backend may return `messId` or `mealId` — normalise to both
        messId: m.messId || (m as any).mealId || '',
        mealId: (m as any).mealId || m.messId || '',
        messName: m.messName || (m as any).mealName || '',
        mealName: (m as any).mealName || m.messName || '',
        mealCode: (m as any).mealCode || (m as any).code || '',
        code: (m as any).code || (m as any).mealCode || '',
      });
      setPendingJoinRequest(null);
    } else {
      setActiveMembership(null);
      setPendingJoinRequest(res.pendingJoinRequest || null);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      const data = await api.get<AuthResponse>('/auth/me');
      normalise(data);
    } catch {
      clearAuthToken();
      setTokenState(null);
      setUser(null);
      setActiveMembership(null);
      setPendingJoinRequest(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      clearAuthToken();
      setTokenState(null);
      setUser(null);
      setActiveMembership(null);
      setPendingJoinRequest(null);
    };

    window.addEventListener('messmate_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('messmate_unauthorized', handleUnauthorized);
  }, [refreshUser]);

  const login = async (email: string, password: string = 'password123') => {
    setIsLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      setAuthToken(res.token);
      setTokenState(res.token);
      normalise(res);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string = 'password123',
    phone?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/register', {
        fullName,
        email,
        password,
        phone,
      });
      setAuthToken(res.token);
      setTokenState(res.token);
      normalise(res);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    const updated = await api.put<any>('/auth/profile', data);
    setUser(normaliseUser(updated));
  };

  const clearPendingRequest = () => setPendingJoinRequest(null);

  const logout = () => {
    clearAuthToken();
    setTokenState(null);
    setUser(null);
    setActiveMembership(null);
    setPendingJoinRequest(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeMembership,
        pendingJoinRequest,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        clearPendingRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
