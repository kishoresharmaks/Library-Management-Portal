import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfmozizzbvzoaiwmeikb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbW96aXp6YnZ6b2Fpd21laWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NzAyMTAsImV4cCI6MjA1NzM0NjIxMH0.2csiwcy2KbtayNbyl8HdbeF2emMUxVSJG9QvHuu6ghA';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);