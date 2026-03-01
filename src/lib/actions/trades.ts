"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { deleteScreenshot } from "@/lib/utils/screenshots";

export async function createTrade(
  formData: FormData
): Promise<{ success: boolean; tradeId?: string; error?: string }> {
  try {
    const instrument = formData.get("instrument") as string;
    const direction = formData.get("direction") as string;
    const entryPrice = parseFloat(formData.get("entryPrice") as string);
    const exitPrice = parseFloat(formData.get("exitPrice") as string);
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const riskReward = parseFloat(formData.get("riskReward") as string);
    const result = formData.get("result") as string;
    const pnl = parseFloat(formData.get("pnl") as string);
    const rating = parseInt(formData.get("rating") as string, 10);
    const notes = (formData.get("notes") as string) || undefined;
    const tradeDate = new Date(formData.get("tradeDate") as string);

    const entryTimeRaw = formData.get("entryTime") as string | null;
    const exitTimeRaw = formData.get("exitTime") as string | null;
    const entryTime = entryTimeRaw ? new Date(entryTimeRaw) : undefined;
    const exitTime = exitTimeRaw ? new Date(exitTimeRaw) : undefined;

    const tagIdsRaw = formData.get("tagIds") as string | null;
    const tagIds: string[] = tagIdsRaw ? JSON.parse(tagIdsRaw) : [];

    const screenshotUrlsRaw = formData.get("screenshotUrls") as string | null;
    const screenshotUrls: string[] = screenshotUrlsRaw
      ? JSON.parse(screenshotUrlsRaw)
      : [];

    const trade = await prisma.trade.create({
      data: {
        instrument,
        direction,
        entryPrice,
        exitPrice,
        quantity,
        riskReward,
        result,
        pnl,
        rating,
        notes,
        tradeDate,
        entryTime,
        exitTime,
        tags: {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        screenshots: {
          create: screenshotUrls.map((url) => ({ url })),
        },
      },
    });

    revalidatePath("/trades");
    revalidatePath("/dashboard");

    return { success: true, tradeId: trade.id };
  } catch (error) {
    console.error("Failed to create trade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create trade",
    };
  }
}

export async function updateTrade(
  tradeId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const instrument = formData.get("instrument") as string;
    const direction = formData.get("direction") as string;
    const entryPrice = parseFloat(formData.get("entryPrice") as string);
    const exitPrice = parseFloat(formData.get("exitPrice") as string);
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const riskReward = parseFloat(formData.get("riskReward") as string);
    const result = formData.get("result") as string;
    const pnl = parseFloat(formData.get("pnl") as string);
    const rating = parseInt(formData.get("rating") as string, 10);
    const notes = (formData.get("notes") as string) || undefined;
    const tradeDate = new Date(formData.get("tradeDate") as string);

    const entryTimeRaw = formData.get("entryTime") as string | null;
    const exitTimeRaw = formData.get("exitTime") as string | null;
    const entryTime = entryTimeRaw ? new Date(entryTimeRaw) : undefined;
    const exitTime = exitTimeRaw ? new Date(exitTimeRaw) : undefined;

    const tagIdsRaw = formData.get("tagIds") as string | null;
    const tagIds: string[] = tagIdsRaw ? JSON.parse(tagIdsRaw) : [];

    const screenshotUrlsRaw = formData.get("screenshotUrls") as string | null;
    const screenshotUrls: string[] = screenshotUrlsRaw
      ? JSON.parse(screenshotUrlsRaw)
      : [];

    // Delete existing tags and screenshots, then recreate
    await prisma.tradeTag.deleteMany({ where: { tradeId } });
    await prisma.screenshot.deleteMany({ where: { tradeId } });

    await prisma.trade.update({
      where: { id: tradeId },
      data: {
        instrument,
        direction,
        entryPrice,
        exitPrice,
        quantity,
        riskReward,
        result,
        pnl,
        rating,
        notes,
        tradeDate,
        entryTime,
        exitTime,
        tags: {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        screenshots: {
          create: screenshotUrls.map((url) => ({ url })),
        },
      },
    });

    revalidatePath("/trades");
    revalidatePath("/dashboard");
    revalidatePath(`/trades/${tradeId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update trade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update trade",
    };
  }
}

export async function deleteTrade(
  tradeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const screenshots = await prisma.screenshot.findMany({
      where: { tradeId },
      select: { url: true },
    });

    for (const screenshot of screenshots) {
      await deleteScreenshot(screenshot.url);
    }

    await prisma.trade.delete({ where: { id: tradeId } });

    revalidatePath("/trades");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete trade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete trade",
    };
  }
}
