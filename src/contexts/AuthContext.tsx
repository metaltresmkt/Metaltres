import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
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
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
        setClinicName('');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    console.log('AuthContext: Fetching profile for:', userId);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('AuthContext: User fetch error:', userError);
        setLoading(false);
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

        const { data: clinicData } = await supabase
          .from('lojas')
          .select('name')
          .eq('id', userData.loja_id)
          .maybeSingle();

        if (clinicData?.name) {
          setClinicName(clinicData.name);
        } else {
          setClinicName('Metaltres');
        }
      } else {
        console.warn('AuthContext: No profile found in users table');
      }
    } catch (error) {
      console.error('AuthContext: Profile error:', error);
    } finally {
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
