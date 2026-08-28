export type Room = {
  id: string;
  creatorId: string;
  creatorName: string;
  mode: "1v1" | "2v2" | "4v4";
  entryFee: number;
  prize: number;
  status: "waiting" | "in_progress" | "completed";
  code?: string;
  createdAt: string;
};

export const INITIAL_ROOMS: Room[] = [
  {
    id: "room-1",
    creatorId: "user-1",
    creatorName: "RaptorFF",
    mode: "1v1",
    entryFee: 10,
    prize: 18,
    status: "waiting",
    code: "FF-98231",
    createdAt: new Date().toISOString(),
  },
  {
    id: "room-2",
    creatorId: "user-2",
    creatorName: "NexoPro",
    mode: "2v2",
    entryFee: 25,
    prize: 45,
    status: "waiting",
    code: "FF-44102",
    createdAt: new Date().toISOString(),
  },
  {
    id: "room-3",
    creatorId: "user-3",
    creatorName: "MayaShot",
    mode: "4v4",
    entryFee: 50,
    prize: 90,
    status: "waiting",
    code: "FF-77391",
    createdAt: new Date().toISOString(),
  },
];
