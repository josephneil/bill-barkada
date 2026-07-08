import { ZodError } from "zod";
import { getBillApiError } from "@/lib/bills/errors";
import { createOnlineBill } from "@/lib/bills/db";
import { formatZodError } from "@/lib/bills/validation";

export async function POST(request: Request) {
  try {
    const result = await createOnlineBill(await request.json());
    const origin = new URL(request.url).origin;

    return Response.json({
      bill: result.bill,
      shareId: result.shareId,
      editToken: result.editToken,
      viewLink: `${origin}/b/${result.shareId}`,
      editLink: `${origin}/b/${result.shareId}/edit?token=${result.editToken}`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: formatZodError(error) },
        { status: 400 },
      );
    }

    const apiError = getBillApiError(error);

    return Response.json(
      { error: apiError.message },
      { status: apiError.status },
    );
  }
}
