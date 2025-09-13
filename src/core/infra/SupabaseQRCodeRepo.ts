import type { QRCodeRepo } from "@/core/repositories/QRCodeRepo";
import type { QRCode } from "@/shared/types/domain";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

export const supabaseQRCodeRepo: QRCodeRepo = {
  async create(userId): Promise<QRCode> {
    // Generate a unique code
    const code = nanoid(10);

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from("qr_codes")
      .insert([
        {
          user_id: userId,
          code,
          scans: 0,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Error creating QR code:", error);
      throw new Error("Failed to create QR code");
    }

    return {
      id: data.id,
      userId: data.user_id,
      code: data.code,
      scans: data.scans,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    };
  },

  async getByCode(code): Promise<QRCode | null> {
    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("code", code)
      .single();

    if (error) {
      console.error("Error fetching QR code:", error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      code: data.code,
      scans: data.scans,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    };
  },

  async getByUserId(userId): Promise<QRCode | null> {
    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No QR code found
        return null;
      }
      console.error("Error fetching QR code by user ID:", error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      code: data.code,
      scans: data.scans,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    };
  },

  async incrementScans(codeId): Promise<void> {
    const { error } = await supabase
      .from("qr_codes")
      .update({
        scans: supabase.rpc("increment", { x: 1, row_id: codeId }),
      })
      .eq("id", codeId);

    if (error) {
      console.error("Error incrementing QR code scans:", error);
      throw new Error("Failed to increment QR code scans");
    }
  },
};
