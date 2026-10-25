import { describe, expect, it } from "vitest"
import {
  emptySnapshot,
  parseSnapshot,
  planDeliveries,
  recordDelivery,
  type MonitorSnapshot,
} from "@/lib/live-monitor-events"

const events = [{ id: "e1" }, { id: "e2" }]
const subscriptions = ["sub-a", "sub-b"]

function snapshotWith(
  eventsMap: MonitorSnapshot["events"]
): MonitorSnapshot {
  return { events: eventsMap, updatedAt: "2026-10-25T12:00:00.000Z" }
}

describe("parseSnapshot", () => {
  it("devolve snapshot vazio para valores inválidos", () => {
    expect(parseSnapshot(null).events).toEqual({})
    expect(parseSnapshot("não é json").events).toEqual({})
    expect(parseSnapshot("[]").events).toEqual({})
  })

  it("lê o formato atual", () => {
    const raw = JSON.stringify({
      events: {
        e1: { delivered: ["sub-a"], attempts: 2, confirmed: false },
        e2: { delivered: [], attempts: 0, confirmed: true },
      },
      updatedAt: "2026-10-25T12:00:00.000Z",
    })

    const snapshot = parseSnapshot(raw)
    expect(snapshot.events.e1).toEqual({
      delivered: ["sub-a"],
      attempts: 2,
      confirmed: false,
    })
    expect(snapshot.events.e2?.confirmed).toBe(true)
  })

  it("migra o formato antigo (eventIds + attempts)", () => {
    const raw = JSON.stringify({
      eventIds: ["confirmado"],
      attempts: { pendente: 2, invalido: "x" },
    })

    const snapshot = parseSnapshot(raw)
    expect(snapshot.events.confirmado).toEqual({
      delivered: [],
      attempts: 0,
      confirmed: true,
    })
    expect(snapshot.events.pendente).toEqual({
      delivered: [],
      attempts: 2,
      confirmed: false,
    })
    expect(snapshot.events.invalido?.attempts).toBe(0)
  })
})

describe("planDeliveries", () => {
  it("agrupa eventos com os mesmos destinatários em um único envio", () => {
    const plan = planDeliveries(events, emptySnapshot(), subscriptions)

    expect(plan.groups).toEqual([
      { recipients: ["sub-a", "sub-b"], eventIds: ["e1", "e2"] },
    ])
    expect(plan.settledEventIds).toEqual([])
  })

  it("não reenvia evento já confirmado, nem para novas assinaturas", () => {
    const plan = planDeliveries(
      events,
      snapshotWith({
        e1: { delivered: ["sub-a"], attempts: 0, confirmed: true },
      }),
      [...subscriptions, "sub-nova"]
    )

    expect(plan.groups).toEqual([
      { recipients: ["sub-a", "sub-b", "sub-nova"], eventIds: ["e2"] },
    ])
  })

  it("reenvia só para quem falhou, sem duplicar para quem recebeu", () => {
    const plan = planDeliveries(
      [{ id: "e1" }],
      snapshotWith({
        e1: { delivered: ["sub-a"], attempts: 1, confirmed: false },
      }),
      subscriptions
    )

    expect(plan.groups).toEqual([{ recipients: ["sub-b"], eventIds: ["e1"] }])
  })

  it("separa eventos com conjuntos de destinatários diferentes", () => {
    const plan = planDeliveries(
      events,
      snapshotWith({
        e1: { delivered: ["sub-a"], attempts: 1, confirmed: false },
        e2: { delivered: [], attempts: 1, confirmed: false },
      }),
      subscriptions
    )

    expect(plan.groups).toHaveLength(2)
    expect(plan.groups).toContainEqual({
      recipients: ["sub-b"],
      eventIds: ["e1"],
    })
    expect(plan.groups).toContainEqual({
      recipients: ["sub-a", "sub-b"],
      eventIds: ["e2"],
    })
  })

  it("confirma eventos sem assinantes ou com tentativas esgotadas", () => {
    const plan = planDeliveries(
      events,
      snapshotWith({
        e2: { delivered: [], attempts: 3, confirmed: false },
      }),
      []
    )

    expect(plan.groups).toEqual([])
    expect(plan.settledEventIds).toEqual(["e1", "e2"])
  })

  it("confirma o evento quando todas as assinaturas pendentes desapareceram", () => {
    const plan = planDeliveries(
      [{ id: "e1" }],
      snapshotWith({
        e1: { delivered: ["sub-a"], attempts: 1, confirmed: false },
      }),
      ["sub-a"]
    )

    expect(plan.groups).toEqual([])
    expect(plan.settledEventIds).toEqual(["e1"])
  })
})

describe("recordDelivery", () => {
  it("confirma o evento quando não há falhas", () => {
    const snapshot = recordDelivery(emptySnapshot(), ["e1"], {
      sentIds: ["sub-a"],
      removedIds: ["sub-b"],
      failedIds: [],
    })

    expect(snapshot.events.e1).toEqual({
      delivered: ["sub-a", "sub-b"],
      attempts: 0,
      confirmed: true,
    })
  })

  it("incrementa tentativas e mantém pendente quando alguma falha", () => {
    const first = recordDelivery(emptySnapshot(), ["e1"], {
      sentIds: ["sub-a"],
      removedIds: [],
      failedIds: ["sub-b"],
    })
    const second = recordDelivery(first, ["e1"], {
      sentIds: ["sub-b"],
      removedIds: [],
      failedIds: [],
    })

    expect(first.events.e1).toMatchObject({
      delivered: ["sub-a"],
      attempts: 1,
      confirmed: false,
    })
    expect(second.events.e1).toMatchObject({
      delivered: ["sub-a", "sub-b"],
      attempts: 1,
      confirmed: true,
    })
  })

  it("não duplica IDs já entregues", () => {
    const snapshot = recordDelivery(
      snapshotWith({
        e1: { delivered: ["sub-a"], attempts: 0, confirmed: false },
      }),
      ["e1"],
      { sentIds: ["sub-a"], removedIds: [], failedIds: [] }
    )

    expect(snapshot.events.e1?.delivered).toEqual(["sub-a"])
  })

  it("confirma sem alterar tentativas quando só há eventos assentados", () => {
    const snapshot = recordDelivery(
      snapshotWith({
        e1: { delivered: ["sub-a"], attempts: 2, confirmed: false },
      }),
      ["e1"],
      { sentIds: [], removedIds: [], failedIds: [] }
    )

    expect(snapshot.events.e1).toEqual({
      delivered: ["sub-a"],
      attempts: 2,
      confirmed: true,
    })
  })
})
