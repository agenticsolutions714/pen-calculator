import { generateText, Output } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

export const maxDuration = 60;

const schema = z.object({
  rows: z.array(
    z.object({
      qty: z.number().describe("The order quantity for this line item"),
      sku: z.string().describe("The SKU / item code, exactly as written"),
      product: z.string().describe("The product / item name"),
      exitPerPack: z
        .number()
        .nullish()
        .describe(
          "The per-pack price / exit / sell price for this line if a price column is present, otherwise null",
        ),
    }),
  ),
});

const SYSTEM_PROMPT = `You extract purchase-order line items from an uploaded document (an image/screenshot of a spreadsheet, or a PDF).
Return every line item you can read. For each row capture:
- qty: the order quantity as a number (0 if blank or unreadable)
- sku: the SKU / item code exactly as written (e.g. "RT10", "HCG10,000", "MT2-10"). Keep it verbatim.
- product: the product name as written.
- exitPerPack: if the document has a per-unit price / sell price / exit price column, capture it as a number (no currency symbols). If there is no such column, set it to null.
Ignore header rows, totals, and empty rows. Do not invent items or prices that are not present.`;

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENROUTER_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: { data?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { data, mediaType } = body;
  if (!data || !mediaType) {
    return Response.json(
      { error: "Missing file data or media type." },
      { status: 400 },
    );
  }

  const openrouter = createOpenRouter({ apiKey });
  const isPdf = mediaType === "application/pdf";

  const filePart = isPdf
    ? ({ type: "file", mediaType, data } as const)
    : ({ type: "image", image: data, mediaType } as const);

  try {
    const { output } = await generateText({
      model: openrouter("openai/gpt-4o"),
      output: Output.object({ schema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SYSTEM_PROMPT },
            filePart,
          ],
        },
      ],
    });

    return Response.json({ rows: output.rows ?? [] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to extract data from file.";
    return Response.json({ error: message }, { status: 502 });
  }
}
