import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncCloud } from "./syncCloud";
import { useVisitStore } from "../store/useVisitStore";

// Mock de Supabase pour éviter les appels réseau
vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: vi.fn().mockResolvedValue({ 
        data: table === "visits" ? [
          { 
            visit_id: "remote-1", 
            nom: "Orateur Distant", 
            congregation: "Lyon Nord", 
            visit_date: "2024-05-20", 
            location_type: "kingdom_hall",
            status: "scheduled",
            updated_at: new Date().toISOString() 
          }
        ] : [], 
        error: null 
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      }))
    })),
  },
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