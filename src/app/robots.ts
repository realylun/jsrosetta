import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { buildRobots } from "@/lib/robots";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return buildRobots((await headers()).get("host"));
}
