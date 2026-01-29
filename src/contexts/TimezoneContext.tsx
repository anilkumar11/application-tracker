import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getUserTimezone } from '../lib/timezone';

interface TimezoneContextType {
  timezone: string;
  setTimezone: (timezone: string) => Promise<void>;
  isLoading: boolean;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezoneState] = useState<string>('UTC');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserTimezone();
  }, []);

  async function loadUserTimezone() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const detectedTimezone = getUserTimezone();
        setTimezoneState(detectedTimezone);
        setIsLoading(false);
        return;
      }

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('timezone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preferences?.timezone) {
        setTimezoneState(preferences.timezone);
      } else {
        const detectedTimezone = getUserTimezone();
        setTimezoneState(detectedTimezone);

        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            timezone: detectedTimezone,
          }, {
            onConflict: 'user_id',
          });
      }
    } catch (error) {
      console.error('Error loading timezone:', error);
      const detectedTimezone = getUserTimezone();
      setTimezoneState(detectedTimezone);
    } finally {
      setIsLoading(false);
    }
  }

  async function setTimezone(newTimezone: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setTimezoneState(newTimezone);
        return;
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          timezone: newTimezone,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setTimezoneState(newTimezone);
    } catch (error) {
      console.error('Error updating timezone:', error);
      throw error;
    }
  }

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone, isLoading }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
}
