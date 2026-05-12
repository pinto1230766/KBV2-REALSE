import { describe, it, expect, beforeEach, vi } from "vitest";
import { runDataCleanups } from "./cleanup";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import { useVisitStore } from "../store/useVisitStore";

describe("runDataCleanups", () => {
  beforeEach(() => {
    localStorage.clear();
    useSpeakerStore.getState().setSpeakers([]);
    useHostStore.getState().setHosts([]);
    useVisitStore.getState().setVisits([]);
    vi.clearAllMocks();
  });

  it("should migrate photo paths only once", async () => {
    // Setup state with old paths
    useSpeakerStore.getState().addSpeaker({
      id: "s1",
      nom: "Speaker 1",
      congregation: "Paris",
      photoUrl: "/images/old.jpg"
    });

    await runDataCleanups();

    // Check migration
    expect(useSpeakerStore.getState().speakers[0].photoUrl).toBe("./images/old.jpg");
    expect(localStorage.getItem("kbv-photo-paths-migrated-v1")).toBe("true");

    // Second run should not change anything if paths were manually updated differently
    useSpeakerStore.getState().updateSpeaker("s1", { photoUrl: "custom.jpg" });
    await runDataCleanups();
    expect(useSpeakerStore.getState().speakers[0].photoUrl).toBe("custom.jpg");
  });

  it("should remove example data and set the flag", async () => {
    useSpeakerStore.getState().addSpeaker({
      id: "ex-1",
      nom: "Jean Dupont (Exemple)",
      congregation: "Test"
    });
    
    useSpeakerStore.getState().addSpeaker({
      id: "real-1",
      nom: "Vrai Orateur",
      congregation: "Test"
    });

    await runDataCleanups();

    const speakers = useSpeakerStore.getState().speakers;
    expect(speakers).toHaveLength(1);
    expect(speakers[0].nom).toBe("Vrai Orateur");
    expect(localStorage.getItem("kbv-examples-cleaned-v4")).toBe("true");
  });
});
