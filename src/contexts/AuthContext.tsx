import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export type UserRole = 'gestor' | 'vendedor' | 'producao';

interface UserProfile {
  id: string;
  loja_id: string;
  role: UserRole;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  clinicName: string;
  userRole: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState('');

  useEffect(() => {
    // Listen for auth changes (handles login, logout, token refresh, initial session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('AuthContext: Auth event:', event);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Pass the token directly to avoid deadlocking getSession on reload
        await fetchProfile(newSession.user.id, newSession.access_token);
      } else {
        setProfile(null);
        setClinicName('');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, token: string) {
    console.log('AuthContext: Fetching profile for:', userId);
    
    // SAFEGUARD: Force stop loading after 5 seconds if Supabase hangs
    const timeoutId = setTimeout(() => {
      console.warn('AuthContext: fetchProfile took too long, forcing load stop.');
      setLoading(false);
    }, 5000);

    try {
      // BULLETPROOF FETCH: Bypass supabase-js query queue which sometimes hangs in Dev Mode
      if (!token) throw new Error("No token for profile fetch");

      const response = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      const userData = rawData && rawData.length > 0 ? rawData[0] : null;
      const userError = null;

      if (userError) {
        console.error('AuthContext: User fetch error:', userError);
        return;
      }

      if (userData) {
        console.log('AuthContext: Profile found:', userData.full_name);
        setProfile({
          id: userData.id,
          loja_id: userData.loja_id,
          role: userData.role as UserRole,
          full_name: userData.full_name
        });

        const clinicResponse = await fetch(`${supabaseUrl}/rest/v1/lojas?id=eq.${userData.loja_id}&select=name`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`
          }
        });
        
        let clinicNameParsed = 'Metaltres';
        if (clinicResponse.ok) {
          const clinicRawData = await clinicResponse.json();
          if (clinicRawData && clinicRawData.length > 0 && clinicRawData[0].name) {
            clinicNameParsed = clinicRawData[0].name;
          }
        }
        
        setClinicName(clinicNameParsed);
      } else {
        console.warn('AuthContext: No profile found in users table');
      }
    } catch (error) {
      console.error('AuthContext: Profile error:', error);
    } finally {
      clearTimeout(timeoutId);
      console.log('AuthContext: Done loading');
      setLoading(false);
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {
      // token inválido — força limpeza manual
    }
    localStorage.clear();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      clinicName: clinicName || 'Metaltres',
      userRole: profile?.role || 'vendedor',
      loading,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
