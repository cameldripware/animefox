import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzcgenxbcvkikfbhfjyy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Y2dlbnhiY3ZraWtmYmhmanl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzAwNDgsImV4cCI6MjA5NDEwNjA0OH0.66ipmUxNPpH3db72_3L2LvciK6MgSktHkpe_mr2lxX8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);