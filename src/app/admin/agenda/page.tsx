"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AgendaCalendar from "@/components/admin/rh/AgendaCalendar";
import AgendaSettings from "@/components/admin/rh/AgendaSettings";
import { createClient } from "@/lib/supabase/client";
import { agendaConfig } from "@/lib/rh/agenda";
import type { AgendaConfig } from "@/lib/types";
import { useOrigin } from "@/lib/use-origin";

/** Agenda de entrevistas: calendário, link geral de agendamento e disponibilidade. */
export default function AgendaAdminPage() {
  const [cfg, setCfg] = useState<{ id: string; config: AgendaConfig } | null>(null);
  const [version, setVersion] = useState(0);
  const [copied, setCopied] = useState(false);
  const link = `${useOrigin()}/agenda`;

  useEffect(() => {
    createClient()
      .from("site_settings")
      .select("id, agenda_config")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data && setCfg({ id: data.id, config: agendaConfig(data.agenda_config) }));
  }, []);

  return (
    <AdminLayout title="Agenda de entrevistas">
      <div className="space-y-5">
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold text-brand-950">Link geral de agendamento</p>
            <p className="text-sm text-brand-600">
              Qualquer pessoa com o link escolhe um horário livre informando nome e WhatsApp. Para um candidato específico, use o link pessoal na ficha dele.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{link}</code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="rounded-lg bg-brand-900 px-3 py-2 text-sm font-semibold text-white"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
        <AgendaCalendar version={version} />
        {cfg && (
          <AgendaSettings
            initial={cfg.config}
            settingsId={cfg.id}
            onSaved={(c) => {
              setCfg({ ...cfg, config: c });
              setVersion((v) => v + 1);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
