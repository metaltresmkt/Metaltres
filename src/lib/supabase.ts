import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://wmtdqunwxldfmnryzxpc.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtdGRxdW53eGxkZm1ucnl6eHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTA1MDksImV4cCI6MjA4OTU4NjUwOX0.LoLzMRfSP7x8-q3qLen3vVeVu9rr8Ej2IsS0KBqMcIo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
