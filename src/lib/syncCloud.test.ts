import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncCloud } from "./syncCloud";
import { useVisitStore } from "../store/useVisitStore";

// Builds the mock chain: .from(table).select("*").order("id", { ascending: true }).range(from, to).limit(size)
function makeMockSupabase(visitsData: unknown[]) {
  // limit() returns the final promise with data
  const limitFn = vi.fn().mockResolvedValue({ data: visitsData, error: null });
  // range() returns the continuation (limit)
  const rangeFn = vi.fn(() => ({ limit: limitFn }));
  // order() returns the continuation (range)
  const orderFn = vi.fn(() => ({ range: rangeFn }));
  // select() returns continuation (order)
  const selectFn = vi.fn(() => ({ order: orderFn }));
  // from() returns an object that has select, upsert, and delete
  const eqFn = vi.fn().mockResolvedValue({ error: null });
  const deleteFn = vi.fn(() => ({ eq: eqFn }));
  const upsertFn = vi.fn().mockResolvedValue({ error: null });
  const fromReturnObj = {
    select: selectFn,
    upsert: upsertFn,
    delete: deleteFn,
  };
  const fromFn = vi.fn(() => fromReturnObj);

  return { from: fromFn };
}

const mockSupabase = makeMockSupabase([
  {
    visit_id: "remote-1",
    nom: "Orateur Distant",
    congregation: "Lyon Nord",
    visit_date: "2024-05-20",
    location_type: "kingdom_hall",
    status: "scheduled",
    updated_at: new Date().toISOString(),
  },
]);

// Mock de Supabase pour éviter les appels réseau
vi.mock("./supabase", () => ({
  getSupabase: vi.fn(() => mockSupabase),
  isSupabaseConfigured: vi.fn(() => true),
}));

describe("syncCloud", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVisitStore.getState().setVisits([]);
  });

  it("devrait fusionner les données distantes dans le store local", async () => {
    const result = await syncCloud();

    expect(result.pulled.visits).toBe(1);
    const localVisits = useVisitStore.getState().visits;
    expect(localVisits).toHaveLength(1);
    expect(localVisits[0].nom).toBe("Orateur Distant");
  });

  it("devrait filtrer les données d'exemple (Jean Dupont) lors de la synchro", async () => {
    useVisitStore.getState().setVisits([{
      visitId: "local-1",
      nom: "Jean Dupont", // Nom réservé aux exemples
      congregation: "Test",
      visitDate: "2024-01-01",
      locationType: "kingdom_hall",
      status: "scheduled",
      talkNoOrType: "",
    }]);

    await syncCloud();
    
    const visits = useVisitStore.getState().visits;
    expect(visits.find(v => v.nom === "Jean Dupont")).toBeUndefined();
  });
});