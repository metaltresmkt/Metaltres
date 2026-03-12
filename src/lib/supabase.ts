import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yzpclhuifquhfqpiwysh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cGNsaHVpZnF1aGZxcGl3eXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNTUxNDcsImV4cCI6MjA4ODgzMTE0N30.DXuX6KDpEPMoCAVpH2gs6reGTC97RZiNA_IUPT0Inos';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
