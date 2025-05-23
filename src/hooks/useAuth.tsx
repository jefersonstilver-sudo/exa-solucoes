
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile from users table (source of truth for role)
          setTimeout(async () => {
            try {
              const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (userData && !error) {
                setUserProfile({
                  id: userData.id,
                  email: userData.email,
                  role: userData.role as UserRole, // Type cast para UserRole
                  data_criacao: userData.data_criacao
                });
              }
            } catch (err) {
              console.error('Error fetching user profile:', err);
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setUserProfile(null);
      localStorage.clear();
    }
    return { success: !error, error };
  };

  const hasRole = (requiredRole: string): boolean => {
    if (!userProfile?.role) return false;
    
    // Super admins can access everything
    if (userProfile.role === 'super_admin') return true;
    
    // Direct role match
    return userProfile.role === requiredRole;
  };

  return {
    user,
    session,
    userProfile,
    isLoading,
    isLoggedIn: !!user && !!session,
    logout,
    hasRole
  };
};
