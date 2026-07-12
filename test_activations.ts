import { fetchPendingActivations } from "./lib/supabase/services/activations";
async function test() {
  const data = await fetchPendingActivations();
  console.log(JSON.stringify(data, null, 2));
}
test();