import { supabase } from './src/lib/supabase.ts';
async function testHostPush() {
  const { error } = await supabase.from('hosts').upsert([{
    id: "00000000-0000-4000-8000-000000000000",
    nom: "Test",
    capacity: 2
  }]);
  console.log("Upsert error:", error);
}
testHostPush();
