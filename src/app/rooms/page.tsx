"use client";

import { Construction, UsersRound } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { ComingSoonCard } from "@/components/layout/ComingSoonCard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function RoomsPage() {
  return (
    <AuthenticatedLayout>
      {(auth) => (
        <AppLayout auth={auth}>
          <div className="arena-page">
            <PageHeader
              badge="Salas"
              title="Duelos privados"
              description="1v1, 2v2, 3v3 y 4v4 van a validarse solos. En este MVP la revisión era manual, así que la sección queda en construcción."
            />
            <ComingSoonCard
              icon={UsersRound}
              title="Salas en construcción"
              description="El dueño pidió validación automática de resultados. Hasta que eso esté, el juego competitivo del MVP es por desafíos y torneos de Battle Royale: te inscribís, jugás partidas normales de Free Fire y la app suma kills, puntos o la métrica del evento."
              tone="orange"
              action={{ href: "/challenges", label: "Ir a desafíos" }}
            />
            <p className="flex items-center gap-2 text-sm text-neutral-500">
              <Construction className="size-4 text-arena" />
              Mientras tanto, usá Desafíos para probar el flujo completo.
            </p>
          </div>
        </AppLayout>
      )}
    </AuthenticatedLayout>
  );
}
