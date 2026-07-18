import { Request, Response } from 'express';
import { NavigationService } from '../services/navigation.service';
import { sendSuccess, sendError } from '../utils/helpers';
import { z } from 'zod';

export class NavigationController {
  /**
   * Calculates optimal navigation route directions taking into account live congestion and accessibility requirements.
   */
  static async getOptimalRoute(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        stadiumId: z.string().min(1, "Stadium ID is required"),
        origin: z.string().min(1, "Origin is required"),
        destination: z.string().min(1, "Destination is required"),
        routeType: z.enum(['standard', 'crowd_avoidance', 'accessible', 'family', 'evacuation']).default('standard'),
        language: z.enum(['en', 'es', 'pt', 'fr']).default('en')
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }

      const { stadiumId, origin, destination, routeType, language } = parsed.data;
      const routePlan = await NavigationService.computeOptimalRoute(
        stadiumId,
        origin,
        destination,
        routeType,
        language
      );

      sendSuccess(res, routePlan);
    } catch (err: any) {
      sendError(res, err.message || "Failed to calculate navigation route.", 500);
    }
  }

  /**
   * Consults the AI Route Advisor chatbot about pathway details, crowd conditions, or walking shortcuts.
   */
  static async askRouteAdvisor(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        stadiumId: z.string().min(1, "Stadium ID is required"),
        message: z.string().min(1, "Message content is required"),
        language: z.enum(['en', 'es', 'pt', 'fr']).default('en')
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }

      const { stadiumId, message, language } = parsed.data;
      const advice = await NavigationService.askRouteAdvisor(stadiumId, message, language);
      
      sendSuccess(res, { advice });
    } catch (err: any) {
      sendError(res, err.message || "Failed to retrieve route advisor response.", 500);
    }
  }
}
