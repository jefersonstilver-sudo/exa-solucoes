
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

// Emergency Protocol Page
const EmergencyProtocolPage = () => {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();

  // Query emergency mode status
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['emergencyStatus'],
    queryFn: async () => {
      const response = await fetch('/api/emergency-protocol', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch emergency status');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds (was 10s)
  });

  // Mutation for toggling emergency mode
  const toggleEmergencyMode = useMutation({
    mutationFn: async (seed: string) => {
      if (attemptCount >= 3) {
        setIsBlocked(true);
        throw new Error('Too many invalid attempts');
      }
      
      const response = await fetch('/api/emergency-protocol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ seedPhrase: seed })
      });
      
      if (!response.ok) {
        setAttemptCount(prev => prev + 1);
        throw new Error('Invalid seed phrase');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAttemptCount(0);
      setSeedPhrase('');
      toast({
        title: data.modo_emergencia ? 'Emergency Mode Activated' : 'Emergency Mode Deactivated',
        description: data.message,
        variant: data.modo_emergencia ? 'destructive' : 'default',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      
      if (attemptCount >= 3) {
        // Block for 30 minutes
        setTimeout(() => {
          setIsBlocked(false);
          setAttemptCount(0);
        }, 30 * 60 * 1000);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (seedPhrase.trim()) {
      toggleEmergencyMode.mutate(seedPhrase);
    }
  };

  const isEmergencyMode = data?.modo_emergencia;

  // Page style based on emergency mode
  const pageStyle = {
    backgroundColor: isEmergencyMode ? '#300' : '#111',
    color: 'white',
    minHeight: '100vh',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 1s',
  };

  // Pulsing animation for emergency mode
  const pulsingStyle = isEmergencyMode ? {
    animation: 'pulse 2s infinite',
    boxShadow: '0 0 20px rgba(255,0,0,0.5)',
  } : {};

  return (
    <div style={pageStyle}>
      <style jsx global>{`
        @keyframes pulse {
          0% { background-color: #400; }
          50% { background-color: #700; }
          100% { background-color: #400; }
        }
      `}</style>

      <div 
        className="p-8 rounded-lg max-w-md w-full" 
        style={{
          backgroundColor: isEmergencyMode ? '#400' : '#222',
          ...pulsingStyle
        }}
      >
        <h1 className="text-2xl font-bold text-center mb-6">
          {isEmergencyMode ? '🚨 EMERGENCY PROTOCOL ACTIVATED' : 'Emergency Security Protocol'}
        </h1>
        
        {isEmergencyMode && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              All systems are currently in lockdown mode. Access to data, logins, and APIs is restricted.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="seedPhrase" className="block text-sm font-medium">
                24-Word Seed Phrase
              </label>
              <Input
                id="seedPhrase"
                type="password"
                value={seedPhrase}
                onChange={(e) => setSeedPhrase(e.target.value)}
                className="bg-gray-800 text-white"
                placeholder="Enter seed phrase to authenticate"
                disabled={isBlocked || toggleEmergencyMode.isPending}
              />
              {isBlocked && (
                <p className="text-red-400 text-sm mt-1">
                  Too many invalid attempts. Please try again later.
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className={`w-full ${isEmergencyMode ? 'bg-green-700 hover:bg-green-600' : 'bg-red-700 hover:bg-red-600'}`}
              disabled={!seedPhrase || isBlocked || toggleEmergencyMode.isPending}
            >
              {toggleEmergencyMode.isPending ? 'Processing...' : isEmergencyMode ? 'Deactivate Emergency Mode' : 'Activate Emergency Mode'}
            </Button>
          </form>
        )}

        {isLoading && <p className="text-center">Loading status...</p>}
      </div>
    </div>
  );
};

export default EmergencyProtocolPage;
