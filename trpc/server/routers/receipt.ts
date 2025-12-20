import { GoogleGenerativeAI } from "@google/generative-ai";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { category, wallet } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "../init";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const receiptScanResultSchema = z.object({
  name: z.string(),
  amount: z.number(),
  date: z.string().nullable(),
  type: z.enum(["income", "expense"]),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
      }),
    )
    .optional(),
  merchant: z.string().optional(),
  categoryId: z.string().nullable(),
  walletId: z.string().nullable(),
  isRecurring: z.boolean(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).nullable(),
});

export type ReceiptScanResult = z.infer<typeof receiptScanResultSchema>;

export const receiptRouter = createTRPCRouter({
  scan: protectedProcedure
    .input(
      z.object({
        image: z.string().min(1, "Gambar tidak ditemukan"),
        mimeType: z.string().default("image/jpeg"),
      }),
    )
    .output(receiptScanResultSchema)
    .mutation(async ({ ctx, input }) => {
      if (!process.env.GEMINI_API_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "API key Gemini tidak dikonfigurasi",
        });
      }

      try {
        // Fetch categories and wallets for the current user
        const [categories, wallets] = await Promise.all([
          ctx.db.query.category.findMany({
            where: eq(category.userId, ctx.user.id),
            columns: { id: true, name: true, type: true },
          }),
          ctx.db.query.wallet.findMany({
            where: eq(wallet.userId, ctx.user.id),
            columns: { id: true, name: true },
          }),
        ]);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Build categories list for prompt
        const categoriesList = categories
          .map((c) => `  - ID: "${c.id}", Name: "${c.name}", Type: "${c.type}"`)
          .join("\n");

        // Build wallets list for prompt
        const walletsList = wallets
          .map((w) => `  - ID: "${w.id}", Name: "${w.name}"`)
          .join("\n");

        const prompt = `Analyze this receipt/invoice image and extract the following information in JSON format.

IMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks.

The JSON must have this exact structure:
{
  "name": "Brief transaction name/title based on merchant or main items",
  "amount": <total amount as number without currency symbol>,
  "date": "YYYY-MM-DD format or null if not visible",
  "type": "expense" or "income" (most receipts are expenses),
  "description": "Brief description of the transaction",
  "items": [
    {
      "name": "item name",
      "quantity": <number>,
      "price": <price as number>
    }
  ],
  "merchant": "Store/merchant name if visible",
  "categoryId": "matched category ID or null",
  "walletId": "matched wallet ID or null",
  "isRecurring": true or false,
  "frequency": "daily" | "weekly" | "monthly" | "yearly" | null
}

AVAILABLE CATEGORIES (match based on merchant/items):
${categoriesList || "  No categories available"}

AVAILABLE WALLETS (match based on payment method on receipt):
${walletsList || "  No wallets available"}

Rules:
- For amount, extract the total/grand total value as a number only
- If the receipt is in Indonesian Rupiah (Rp), just return the number (e.g., 50000 not "Rp 50.000")
- If date is not clearly visible, return null
- For items array, include main items if visible (max 10 items)
- If you cannot extract certain information, use null for that field
- Always return valid JSON

Category Matching Rules:
- Match the category based on merchant name, items purchased, or receipt context
- Only return a categoryId if you're confident it matches (use null if unsure)
- Consider the category type (expense/income) - only match categories that match the transaction type

Wallet Matching Rules:
- Look for payment method hints: card type (VISA, Mastercard), bank names, digital wallets (GoPay, OVO, Dana, ShopeePay, LinkAja)
- Look for card last 4 digits, bank transfer info, or cash payment indicators
- Only return a walletId if you find clear payment method info (use null if not visible or unsure)

Recurring Transaction Detection Rules:
- Set isRecurring to true if this appears to be a recurring/subscription transaction
- Look for keywords: "subscription", "langganan", "monthly", "bulanan", "membership", "tagihan"
- Known recurring services: Netflix, Spotify, YouTube Premium, utilities (PLN, PDAM), internet (IndiHome, Biznet), phone bills
- Bill patterns: electricity, water, gas, internet, phone, insurance premiums
- If isRecurring is true, determine frequency:
  - "daily": daily subscriptions or recurring charges
  - "weekly": weekly subscriptions
  - "monthly": monthly bills, subscriptions (most common for utilities/streaming)
  - "yearly": annual memberships, yearly subscriptions
- If isRecurring is false, set frequency to null`;

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: input.mimeType,
              data: input.image,
            },
          },
          { text: prompt },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean the response - remove markdown code blocks if present
        const cleanedText = text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        // Parse the JSON response
        const parsedData = JSON.parse(cleanedText);

        // Validate categoryId exists in provided categories
        const validCategoryId = categories.some(
          (c) => c.id === parsedData.categoryId,
        )
          ? parsedData.categoryId
          : null;

        // Validate walletId exists in provided wallets
        const validWalletId = wallets.some((w) => w.id === parsedData.walletId)
          ? parsedData.walletId
          : null;

        // Validate frequency value
        const validFrequencies = ["daily", "weekly", "monthly", "yearly"];
        const validFrequency = validFrequencies.includes(parsedData.frequency)
          ? (parsedData.frequency as "daily" | "weekly" | "monthly" | "yearly")
          : null;

        // Validate and sanitize the response
        const sanitizedData: ReceiptScanResult = {
          name: parsedData.name || "Transaksi",
          amount:
            typeof parsedData.amount === "number"
              ? parsedData.amount
              : parseInt(String(parsedData.amount).replace(/[^\d]/g, ""), 10) ||
                0,
          date: parsedData.date || null,
          type: parsedData.type === "income" ? "income" : "expense",
          description: parsedData.description || undefined,
          items: Array.isArray(parsedData.items) ? parsedData.items : undefined,
          merchant: parsedData.merchant || undefined,
          categoryId: validCategoryId,
          walletId: validWalletId,
          isRecurring: Boolean(parsedData.isRecurring),
          frequency: parsedData.isRecurring ? validFrequency : null,
        };

        return sanitizedData;
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message:
              "Gagal memproses data struk. Coba upload gambar yang lebih jelas.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memindai struk. Silakan coba lagi.",
        });
      }
    }),
});
