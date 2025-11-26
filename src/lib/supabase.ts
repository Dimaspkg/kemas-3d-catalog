
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth as firebaseAuth } from '@/lib/firebase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anonymous key are required. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.");
}

let supabase: SupabaseClient;

// Caching the client to avoid re-creating it on every request.
if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable to preserve the value across module reloads caused by HMR.
    if (!(global as any)._supabase) {
        (global as any)._supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    supabase = (global as any)._supabase;
} else {
    // In production, create a new client
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}


// This is the key part: we set the auth token for Supabase requests.
// We get the token from Firebase Auth and pass it to Supabase.
firebaseAuth.onIdTokenChanged(async (user) => {
    if (user) {
        const token = await user.getIdToken();
        supabase.auth.setSession({ access_token: token, refresh_token: '' });
    } else {
        // If the user logs out, we clear the session.
        supabase.auth.setSession({ access_token: '', refresh_token: '' });
    }
});


export { supabase };
