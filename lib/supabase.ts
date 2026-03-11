import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://pfzhhmxzzgvtlddrbpws.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmemhobXh6emd2dGxkZHJicHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDMyNjMsImV4cCI6MjA4ODgxOTI2M30.dktTc54719J7e8vZHFa1VdD5VkfzESeWmdTaLOw-YBo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
