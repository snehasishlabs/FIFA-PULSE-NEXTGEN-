import { Request, Response } from 'express';
import { AccessibilityServiceClass } from '../services/accessibility.service';
import { sendSuccess, sendError, parseIntParam } from '../utils/helpers';

export class AccessibilityController {
  /**
   * Lists all accessibility service structures.
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseIntParam(req.query.limit, 50);
      const page = parseIntParam(req.query.page, 1);
      const offset = (page - 1) * limit;

      const { services, total } = await AccessibilityServiceClass.getAllServices(limit, offset);
      
      sendSuccess(res, { services }, 200, { page, limit, total });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retrieve accessibility services.";
      sendError(res, msg, 500);
    }
  }

  /**
   * Retrieves accessibility conditions for a specific stadium venue.
   */
  static async getByStadium(req: Request, res: Response): Promise<void> {
    try {
      const { stadiumId } = req.params;
      if (!stadiumId) {
        return sendError(res, "Stadium ID parameter is required.", 400);
      }

      const services = await AccessibilityServiceClass.getServicesByStadium(stadiumId);
      sendSuccess(res, { services });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retrieve stadium accessibility services.";
      sendError(res, msg, 500);
    }
  }
}
