import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_PUBLISHABLE_KEY",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// async function prueba() {
const topic = "table_db_changes";

// Evita reutilizar un canal anterior durante Hot Reload.
const previousChannel = supabase
  .getChannels()
  .find((channel) => channel.topic === `realtime:${topic}`);

if (previousChannel) {
  await supabase.removeChannel(previousChannel);
}

// const channel = supabase
//   .channel(topic)
//   .on(
//     "postgres_changes",
//     {
//       event: "*",
//       schema: "public",
//       table: "exercises",
//     },
//     (payload) => {
//       console.log("Cambio en exercises:", payload);
//     },
//   )
//   .subscribe();

// console.log("channel", channel);
