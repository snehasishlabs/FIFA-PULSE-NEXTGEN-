import { Request, Response } from 'express';
import { TransportService } from '../services/transport.service';
import { sendSuccess, sendError, parseIntParam } from '../utils/helpers';

export class TransportController {
  /**
   * Retrieves all transport route statuses.
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseIntParam(req.query.limit, 50);
      const page = parseIntParam(req.query.page, 1);
      const offset = (page - 1) * limit;

      const { transport, total } = await TransportService.getAllTransport(limit, offset);
      
      sendSuccess(res, { transport }, 200, { page, limit, total });
    } catch (err: any) {
      sendError(res, err.message || "Failed to retrieve transport updates.", 500);
    }
  }

  /**
   * Retrieves transit updates for a specific stadium venue.
   */
  static async getByStadium(req: Request, res: Response): Promise<void> {
    try {
      const { stadiumId } = req.params;
      if (!stadiumId) {
        return sendError(res, "Stadium ID parameter is required.", 400);
      }

      const transport = await TransportService.getTransportByStadium(stadiumId);
      sendSuccess(res, { transport });
    } catch (err: any) {
      sendError(res, err.message || "Failed to retrieve stadium transport updates.", 500);
    }
  }
}
