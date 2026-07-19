import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabase';
import { ProfileSchema } from '../validators/schemas';
import { sendSuccess, sendError } from '../utils/helpers';

interface DatabaseProfile {
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
}

export class AuthController {
  /**
   * Retrieves the authenticated user profile details.
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      return sendError(res, "Unauthorized. Authentication session is required.", 401);
    }

    const { id, email, role } = req.user;
    const supabase = getSupabaseAdmin();
    
    let fullName = req.user.role === 'admin' ? 'Operations Director' : 'Fifa Pulse Spectator';
    let phone = '';
    let avatarUrl = '';

    if (supabase) {
      try {
        const { data, error } = await (supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single() as unknown as Promise<{ data: DatabaseProfile | null; error: { message: string } | null }>);

        if (!error && data) {
          fullName = data.full_name;
          phone = data.phone || '';
          avatarUrl = data.avatar_url || '';
        }
      } catch (err) {
        console.warn("Could not load user profile details from database:", err);
      }
    }

    sendSuccess(res, {
      user: { id, email, role },
      profile: { fullName, phone, avatarUrl }
    });
  }

  /**
   * Updates demographic profile properties for the logged-in user.
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      return sendError(res, "Unauthorized. Authentication session is required.", 401);
    }

    // Validate body structure with Zod
    const parsed = ProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0].message, 400);
    }

    const { fullName, phone, avatarUrl } = parsed.data;
    const { id } = req.user;
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        interface DbProfileUpsert {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          updated_at: string;
        }

        const upsertPayload: DbProfileUpsert = {
          id,
          full_name: fullName,
          phone: phone || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        };

        const { error } = await (supabase
          .from('profiles')
          .upsert(upsertPayload as unknown as never) as unknown as Promise<{ error: { message: string } | null }>);

        if (error) {
          return sendError(res, `Failed to update profile: ${error.message}`, 500);
        }
      } catch (err: any) {
        return sendError(res, err.message || "Failed to update profile.", 500);
      }
    }

    sendSuccess(res, {
      message: "Profile updated successfully.",
      profile: { fullName, phone, avatarUrl }
    });
  }
}
