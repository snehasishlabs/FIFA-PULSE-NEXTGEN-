import { Request, Response } from 'express';
import { StadiumService } from '../services/stadium.service';
import { sendSuccess, sendError, parseIntParam } from '../utils/helpers';

export class StadiumController {
  /**
   * Lists all stadiums.
   */
  static async listStadiums(req: Request, res: Response): Promise<void> {
    try {
      const stadiums = await StadiumService.getAllStadiums();
      sendSuccess(res, { stadiums });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retrieve stadiums.";
      sendError(res, msg, 500);
    }
  }

  /**
   * Fetches a specific stadium.
   */
  static async getStadium(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        return sendError(res, "Stadium ID parameter is missing.", 400);
      }

      const stadium = await StadiumService.getStadiumById(id);
      if (!stadium) {
        return sendError(res, "Stadium not found.", 404);
      }

      sendSuccess(res, { stadium });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retrieve stadium.";
      sendError(res, msg, 500);
    }
  }

  /**
   * Fetches latest live metrics for a specific stadium.
   */
  static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        return sendError(res, "Stadium ID parameter is missing.", 400);
      }

      const metrics = await StadiumService.getStadiumMetrics(id);
      if (!metrics) {
        return sendError(res, "Metrics for specified stadium not found.", 404);
      }

      sendSuccess(res, { metrics });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retrieve stadium metrics.";
      sendError(res, msg, 500);
    }
  }

  /**
   * Lists active incidents at a specific stadium with pagination.
   */
  static async getIncidents(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        return sendError(res, "Stadium ID parameter is missing.", 400);
      }

      const limit = parseIntParam(req.query.limit, 10);
      const page = parseIntParam(req.query.page, 1);
      const offset = (page - 1) * limit;

      const { incidents, total } = await StadiumService.getStadiumIncidents(id, limit, offset);

      sendSuccess(res, { incidents }, 200, { page, limit, total });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retrieve stadium incidents.";
      sendError(res, msg, 500);
    }
  }
}
