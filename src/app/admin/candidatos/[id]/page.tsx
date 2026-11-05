"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import CandidateDetail from "@/components/admin/rh/CandidateDetail";

function Detail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  return <CandidateDetail key={id} id={id} initialApp={params.get("c") ?? undefined} />;
}

/** Ficha do candidato. */
export default function CandidatoPage() {
  return (
    <AdminLayout title="Ficha do candidato">
      <Suspense fallback={<p className="text-brand-500">Carregando...</p>}>
        <Detail />
      </Suspense>
    </AdminLayout>
  );
}
