import { findZoneByPincode, listZones } from "@/lib/db";
import type { DeliveryZoneDoc } from "@/types";

export interface DeliveryQuote {
  supported: boolean;
  zone: DeliveryZoneDoc | null;
  deliveryCharge: number;
  freeDeliveryApplied: boolean;
  etaText: string;
  reason?:
    | "unknown_pincode"
    | "below_minimum"
    | "zone_inactive"
    | "no_pincode";
  minOrderValue?: number | null;
}

export async function quoteDelivery(
  pincode: string,
  subtotal: number
): Promise<DeliveryQuote> {
  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return {
      supported: false,
      zone: null,
      deliveryCharge: 0,
      freeDeliveryApplied: false,
      etaText: "",
      reason: "no_pincode",
    };
  }

  const zone = await findZoneByPincode(pincode);
  if (!zone) {
    return {
      supported: false,
      zone: null,
      deliveryCharge: 0,
      freeDeliveryApplied: false,
      etaText: "",
      reason: "unknown_pincode",
    };
  }

  if (zone.minOrderValue && subtotal < zone.minOrderValue) {
    return {
      supported: false,
      zone,
      deliveryCharge: 0,
      freeDeliveryApplied: false,
      etaText: zone.etaText || "",
      reason: "below_minimum",
      minOrderValue: zone.minOrderValue,
    };
  }

  const freeDeliveryApplied = Boolean(
    zone.freeDeliveryThreshold && subtotal >= zone.freeDeliveryThreshold
  );

  return {
    supported: true,
    zone,
    deliveryCharge: freeDeliveryApplied ? 0 : zone.deliveryCharge,
    freeDeliveryApplied,
    etaText: zone.etaText || "",
  };
}

export async function activeZones() {
  return listZones({ active: true });
}
