import type { MetadataRoute } from "next";
import { getSitemapJobs } from "@/lib/jobs";
import { getSiteUrl } from "@/lib/site";

// Atualiza a cada hora: vagas novas entram no sitemap sem precisar de deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const jobs = await getSitemapJobs();

  return [
    { url: `${base}/carreiras`, changeFrequency: "daily", priority: 1 },
    ...jobs.map((job) => ({
      url: `${base}/carreiras/${job.slug}`,
      lastModified: new Date(job.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${base}/cultura`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
