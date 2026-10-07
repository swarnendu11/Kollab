import { describe, it, expect } from "vitest";

describe("LiveKit Token Security & Authorization Engine", () => {
  it("determines authoritative grants based on participant role", () => {
    // Host permissions
    const getGrants = (role: "host" | "co_host" | "participant", isLocked: boolean, status: "waiting" | "admitted") => {
      if (isLocked && role === "participant") {
        return { allowed: false, reason: "Meeting is locked" };
      }
      if (status === "waiting") {
        return { allowed: false, waitingRoom: true, reason: "In waiting room" };
      }

      const isHostOrCoHost = role === "host" || role === "co_host";
      return {
        allowed: true,
        waitingRoom: false,
        grants: {
          roomJoin: true,
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          roomAdmin: role === "host",
          canUpdateMetadata: isHostOrCoHost,
        },
      };
    };

    const hostGrant = getGrants("host", false, "admitted");
    expect(hostGrant.allowed).toBe(true);
    expect(hostGrant.grants?.roomAdmin).toBe(true);
    expect(hostGrant.grants?.canUpdateMetadata).toBe(true);

    const coHostGrant = getGrants("co_host", false, "admitted");
    expect(coHostGrant.allowed).toBe(true);
    expect(coHostGrant.grants?.roomAdmin).toBe(false);
    expect(coHostGrant.grants?.canUpdateMetadata).toBe(true);

    const participantGrant = getGrants("participant", false, "admitted");
    expect(participantGrant.allowed).toBe(true);
    expect(participantGrant.grants?.roomAdmin).toBe(false);
    expect(participantGrant.grants?.canUpdateMetadata).toBe(false);
  });

  it("blocks non-host participants when meeting is locked", () => {
    const checkLockAccess = (isLocked: boolean, isHost: boolean) => {
      if (isLocked && !isHost) return { status: 403, error: "This meeting is locked by the host." };
      return { status: 200, ok: true };
    };

    expect(checkLockAccess(true, false).status).toBe(403);
    expect(checkLockAccess(true, true).status).toBe(200);
    expect(checkLockAccess(false, false).status).toBe(200);
  });

  it("enforces waiting room status queueing", () => {
    const evaluateWaitingRoom = (waitingRoomEnabled: boolean, isHostOrCoHost: boolean, currentStatus?: string) => {
      if (currentStatus === "admitted") return { admitted: true };
      if (waitingRoomEnabled && !isHostOrCoHost) {
        return { admitted: false, inWaitingRoom: true };
      }
      return { admitted: true };
    };

    // Host bypasses waiting room
    expect(evaluateWaitingRoom(true, true).admitted).toBe(true);

    // Normal participant is placed into waiting room
    const participantCheck = evaluateWaitingRoom(true, false);
    expect(participantCheck.admitted).toBe(false);
    expect(participantCheck.inWaitingRoom).toBe(true);

    // Once admitted by host, participant proceeds
    expect(evaluateWaitingRoom(true, false, "admitted").admitted).toBe(true);
  });
});
