import type { CommunityProviderErrorCode } from "@/lib/free-fire/providers/community-api-provider";

const ERROR_MESSAGES: Record<CommunityProviderErrorCode, string> = {
  INVALID_UID: "El UID debe ser numérico y tener entre 5 y 15 dígitos.",
  PLAYER_NOT_FOUND: "No encontramos un jugador con ese UID en la región seleccionada.",
  PROVIDER_UNAVAILABLE: "La API de Free Fire no está disponible en este momento. Intentá de nuevo más tarde.",
  PROVIDER_ERROR: "Ocurrió un error al consultar la API de Free Fire.",
  UNAUTHORIZED: "No pudimos autenticarnos con el proveedor de Free Fire.",
  TIMEOUT: "La consulta tardó demasiado. Verificá tu conexión e intentá otra vez.",
};

export function getFreeFireErrorMessage(errorCode: CommunityProviderErrorCode | "UNAUTHENTICATED" | "DATABASE_ERROR", fallback?: string) {
  if (errorCode === "UNAUTHENTICATED") {
    return "Tenés que iniciar sesión para consultar estadísticas.";
  }

  if (errorCode === "DATABASE_ERROR") {
    return fallback || "No pudimos guardar los datos del jugador.";
  }

  return fallback || ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.PROVIDER_ERROR;
}
