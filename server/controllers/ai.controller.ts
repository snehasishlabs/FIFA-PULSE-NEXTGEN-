import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { sendSuccess, sendError } from '../utils/helpers';
import { z } from 'zod';

export class AIController {
  /**
   * Triggers the server-side Gemini system to generate a stadium operational recommendation.
   */
  static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        stadiumId: z.string().min(1, "Stadium ID is required")
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }

      const { stadiumId } = parsed.data;
      const recommendation = await AIService.generateRecommendations(stadiumId);
      
      sendSuccess(res, { recommendation });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate AI recommendations.";
      sendError(res, msg, 500);
    }
  }

  /**
   * Synthesizes a deep flow simulation and logistics analysis of venue parameters.
   */
  static async getOperationalAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        stadiumId: z.string().min(1, "Stadium ID is required"),
        parameters: z.record(z.string(), z.unknown()).default({})
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }

      const { stadiumId, parameters } = parsed.data;
      const analysisResult = await AIService.performOperationalAnalysis(stadiumId, parameters as Record<string, string | number | boolean>);
      
      sendSuccess(res, analysisResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to perform AI operational analysis.";
      sendError(res, msg, 500);
    }
  }

  /**
   * Generates urgent, tactical field-warden instructions for an active critical incident.
   */
  static async getEmergencyResponse(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        incidentId: z.string().min(1, "Incident ID or reference is required"),
        details: z.string().min(5, "Incident details must be descriptive")
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }

      const { incidentId, details } = parsed.data;
      const emergencyProtocol = await AIService.synthesizeEmergencyResponse(incidentId, details);
      
      sendSuccess(res, emergencyProtocol);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to synthesize emergency response protocol.";
      sendError(res, msg, 500);
    }
  }
}
