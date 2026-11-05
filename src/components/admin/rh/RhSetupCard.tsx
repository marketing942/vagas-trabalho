"use client";

import { useEffect, useState } from "react";

interface Status {
  serviceRole: boolean;
  ai: boolean;
  aiModel: string;
  migration: boolean;
}

/** Liga o formulário próprio do site e mostra o que falta configurar. */
export default function RhSetupCard({
  enabled,
  autoAi,
  onEnabled,
  onAutoAi,
}: {
  enabled: boolean;
  autoAi: boolean;
  onEnabled: (v: boolean) => void;
  onAutoAi: (v: boolean) => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/admin/status")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const ready = !!status?.serviceRole && !!status?.migration;
  const item = (ok: boolean | undefined, label: string, help: string) => (
    <li className="flex items-start gap-2">
      <span aria-hidden className={`mt-0.5 font-bold ${ok ? "text-emerald-600" : "text-amber-600"}`}>
        {ok ? "✓" : "!"}
      </span>
      <span>
        <span className="font-semibold text-brand-900">{label}</span>
        {!ok && <span className="block text-brand-600">{help}</span>}
      </span>
    </li>
  );

  return (
    <section className="card space-y-4 p-6">
      <h2 className="font-bold text-brand-950">Candidaturas pelo site</h2>
      <p className="text-sm text-brand-600">
        Ligado, os botões “Candidatar-se” abrem o formulário do próprio site e as candidaturas entram no pipeline. Desligado,
        continuam indo para o formulário do Notion.
      </p>

      <ul className="space-y-2 rounded-xl bg-brand-50 p-4 text-sm">
        {!status ? (
          <li className="text-brand-500">Conferindo a configuração do servidor...</li>
        ) : (
          <>
            {item(status.migration, "Banco de dados pronto (migrações 0010 a 0013)", "Rode no SQL Editor do Supabase os arquivos 0010 a 0013 da pasta supabase/migrations, nessa ordem.")}
            {item(
              status.serviceRole,
              "Chave do servidor do Supabase",
              "Na Vercel, adicione a variável SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API → service_role) e faça um novo deploy."
            )}
            {item(
              status.ai,
              `Inteligência artificial (${status.aiModel})`,
              "Opcional. Na Vercel, adicione DEEPSEEK_API_KEY (platform.deepseek.com → API keys, com saldo na conta) e faça um novo deploy. Sem ela, as candidaturas chegam e ficam aguardando avaliação."
            )}
          </>
        )}
      </ul>

      <label className={`flex items-center gap-3 ${ready || enabled ? "cursor-pointer" : "opacity-60"}`}>
        <input
          type="checkbox"
          checked={enabled}
          disabled={!ready && !enabled}
          onChange={(e) => onEnabled(e.target.checked)}
          className="h-5 w-5 accent-[#122a5c]"
        />
        <span className="font-semibold text-brand-900">Receber candidaturas pelo formulário do site</span>
      </label>
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" checked={autoAi} onChange={(e) => onAutoAi(e.target.checked)} className="h-5 w-5 accent-[#122a5c]" />
        <span className="text-brand-900">Avaliar cada candidatura nova com IA automaticamente</span>
      </label>
      <p className="text-sm text-brand-500">
        Para conferir antes de ligar, abra{" "}
        <a href="/candidatura?teste=1" target="_blank" className="font-semibold text-brand-800 underline">
          o formulário em modo de teste
        </a>
        . Depois de mudar, clique em “Salvar configurações” no fim da página.
      </p>
    </section>
  );
}
