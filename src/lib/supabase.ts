import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function createSafeFallbackClient() {
  const missingError = new Error(
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
  );

  const reject = async () => {
    return { data: null, error: missingError };
  };

  const queryBuilder = {
    insert: reject,
    update: () => queryBuilder,
    upsert: reject,
    select: () => queryBuilder,
    eq: () => queryBuilder,
    maybeSingle: reject,
    single: reject,
  };

  return {
    auth: {
      signInWithPassword: reject,
      signInWithOAuth: reject,
      signOut: async () => ({ error: missingError }),
      resetPasswordForEmail: reject,
      getUser: async () => ({ data: { user: null }, error: missingError }),
      updateUser: reject,
      signUp: reject,
    },
    from: () => queryBuilder,
  } as unknown as SupabaseClient;
}

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : createSafeFallbackClient();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are missing. The app will render, but auth actions will return a configuration error until .env.local is created.",
  );
}
