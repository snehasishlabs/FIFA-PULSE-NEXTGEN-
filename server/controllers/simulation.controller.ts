import { Request, Response } from 'express';
import { SimulationService } from '../services/simulation.service';
import { sendSuccess, sendError, parseIntParam } from '../utils/helpers';
import { SimulationSchema } from '../validators/schemas';

export class SimulationController {
  /**
   * Executes a simulated match-day scenario, invoking the AI engine and saving history.
   */
  static async run(req: Request, res: Response): Promise<void> {
    try {
      const parsed = SimulationSchema.safeParse({
        ...req.body,
        operatorId: req.user?.id
      });

      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }

      const { stadiumId, scenarioType, intensity, operatorId } = parsed.data;
      const simulation = await SimulationService.runSimulation(stadiumId, scenarioType, intensity, operatorId);
      
      sendSuccess(res, { simulation }, 201);
    } catch (err: any) {
      sendError(res, err.message || "Failed to execute simulation drill.", 500);
    }
  }

  /**
   * Returns a historical list of all simulations run, supporting optional filters.
   */
  static async listHistory(req: Request, res: Response): Promise<void> {
    try {
      const stadiumId = req.query.stadiumId ? String(req.query.stadiumId) : undefined;
      const limit = parseIntParam(req.query.limit, 20);
      const page = parseIntParam(req.query.page, 1);
      const offset = (page - 1) * limit;

      const { simulations, total } = await SimulationService.getSimulationHistory(stadiumId, limit, offset);
      
      sendSuccess(res, { simulations }, 200, { page, limit, total });
    } catch (err: any) {
      sendError(res, err.message || "Failed to retrieve simulation history logs.", 500);
    }
  }

  /**
   * Retrieves full observations and plans for a specific simulation drill by ID.
   */
  static async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        return sendError(res, "Simulation ID parameter is missing.", 400);
      }

      const simulation = await SimulationService.getSimulationById(id);
      if (!simulation) {
        return sendError(res, "Simulation record not found.", 404);
      }

      sendSuccess(res, { simulation });
    } catch (err: any) {
      sendError(res, err.message || "Failed to retrieve simulation drill details.", 500);
    }
  }
}
