"use server";

import { prisma } from "@/lib/prisma";
import type { Tag } from "@/lib/types";

export async function getTags(): Promise<Tag[]> {
  try {
    return await prisma.tag.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return [];
  }
}

export async function createTag(name: string, color: string): Promise<Tag> {
  const tag = await prisma.tag.create({
    data: { name, color },
  });
  return tag;
}
