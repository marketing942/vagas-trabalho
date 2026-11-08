"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import PipelineBoard from "@/components/admin/rh/PipelineBoard";
import type { Pipeline } from "@/lib/types";

function Board() {
  const params = useSearchParams();
  const router = useRouter();
  const pipeline: Pipeline = params.get("funil") === "professor" ? "professor" : "trabalho";
  return (
    <PipelineBoard
      key={pipeline}
      pipeline={pipeline}
      onPipeline={(p) => router.replace(p === "professor" ? "/admin/candidatos?funil=professor" : "/admin/candidatos")}
    />
  );
}

/** Pipeline de candidatos: um quadro por funil (Trabalho e Professores). */
export default function CandidatosPage() {
  return (
    <AdminLayout
      title="Candidatos"
      subtitle="Quem está no processo seletivo. Contratados e reprovados ficam em Finalizados."
      actions={
        <>
          <Link href="/admin/candidatos/finalizados" className="rounded-lg bg-brand-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Finalizados (contratados e reprovados)
          </Link>
          <Link href="/admin/candidatos/importar" className="rounded-lg border border-brand-200 px-3.5 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            Importar do Notion
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-brand-500">Carregando...</p>}>
        <Board />
      </Suspense>
    </AdminLayout>
  );
}
