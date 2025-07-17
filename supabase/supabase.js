// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tgftzyihxjojnnbmlecn.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnZnR6eWloeGpvam5uYm1sZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1OTgxNDIsImV4cCI6MjA2MzE3NDE0Mn0.PBG8NhAd1bPPdR8AEfsMBig7RwueDyr-pMYzWWySaEo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
