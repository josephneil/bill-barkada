import { ZodError } from "zod";
import { getBillApiError } from "@/lib/bills/errors";
import { updateOnlineBill } from "@/lib/bills/db";
import { formatZodError } from "@/lib/bills/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";

  try {
    const bill = await updateOnlineBill(shareId, token, await request.json());

    if (!bill) {
      return Response.json(
        { error: "Invalid share ID or edit token." },
        { status: 403 },
      );
    }

    return Response.json({ bill });
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
