import { z } from "zod";
import { createRider, findRiderById, updateRider, deleteRider } from "@/lib/db";
import { requireApiSession } from "@/lib/auth/guard";
import { zodFields } from "@/lib/admin/helpers";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { riderInputSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const patchSchema = riderInputSchema.partial().extend({
  status: z.enum(["active", "busy", "offline"]).optional(),
  lastLocation: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      updatedAt: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const parsed = riderInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Invalid rider details", 422, { fields: zodFields(parsed.error) });
    }
    const rider = await createRider({
      ...parsed.data,
      passwordHash: "",
      
      vehicleType: parsed.data.vehicleType,
      licensePlate: parsed.data.licensePlate,
      mobile: parsed.data.mobile,
      email: parsed.data.email || "",
      name: parsed.data.name,
      active: parsed.data.status === "active",
      lastLocation: null,
    });
    return jsonOk(rider);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Invalid update", 422, { fields: zodFields(parsed.error) });
    }
    const rider = await updateRider(id, {
      ...parsed.data,
      active: parsed.data.status ? parsed.data.status === "active" : undefined,
    });
    if (!rider) return jsonError("Rider not found", 404);
    return jsonOk(rider);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiSession();
  if (response) return response;
  try {
    const { id } = await params;
    const ok = await deleteRider(id);
    if (!ok) return jsonError("Rider not found", 404);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
