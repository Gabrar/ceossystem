import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://brtyzzcifhkeltxybfrc.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydHl6emNpZmhrZWx0eHliZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MjE2MzAsImV4cCI6MjEwNTE5NzYzMH0.TCq5wYdhnvbu-lrrH_42DakY4PQArg3ZV23srz-DVfg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
