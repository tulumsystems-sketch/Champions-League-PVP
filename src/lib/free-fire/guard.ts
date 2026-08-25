import { checkFreeFireBan } from "@/app/actions/free-fire";

export async function assertPlayableFreeFireAccount(uid: string | null | undefined) {
  if (!uid?.trim()) {
    throw new Error("Vinculá tu UID de Free Fire en Perfil antes de jugar.");
  }

  const ban = await checkFreeFireBan(uid);
  if (!ban.ok) throw new Error(ban.message);
  if (ban.banned) throw new Error(ban.message);
}
