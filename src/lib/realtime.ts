import { supabase } from "@/lib/supabase";

export function subscribeRealtime(channelName: string, tables: string[], onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const ping = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => onChange(), 350);
  };

  const channel = supabase.channel(channelName);
  for (const table of tables) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, ping);
  }
  channel.subscribe();

  return () => {
    if (timer) clearTimeout(timer);
    void supabase.removeChannel(channel);
  };
}
