import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess, sendError, parseIntParam } from '../utils/helpers';
import { NotificationSchema } from '../validators/schemas';

export class NotificationController {
  /**
   * Subscribes a client to the real-time SSE notification stream.
   */
  static subscribeSSE(req: Request, res: Response): void {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    NotificationService.addSSEClient(res);
    console.log(`SSE Subscriber connected. Total subscribers: ${NotificationService.addSSEClient ? "active" : "N/A"}`);

    // Initial handshake packet
    res.write(`data: ${JSON.stringify({ type: "INITIAL_HANDSHAKE", data: { status: "connected" } })}\n\n`);

    req.on("close", () => {
      NotificationService.removeSSEClient(res);
      console.log("SSE Subscriber disconnected.");
    });
  }

  /**
   * Retrieves historical or active notifications with optional filters.
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const stadiumId = req.query.stadiumId ? String(req.query.stadiumId) : undefined;
      const limit = parseIntParam(req.query.limit, 20);
      const page = parseIntParam(req.query.page, 1);
      const offset = (page - 1) * limit;

      const { notifications, total } = await NotificationService.getNotifications(stadiumId, limit, offset);
      
      sendSuccess(res, { notifications }, 200, { page, limit, total });
    } catch (err: any) {
      sendError(res, err.message || "Failed to retrieve notifications.", 500);
    }
  }

  /**
   * Publishes an operational notification or AI alarm.
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = NotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }

      const { stadiumId, title, message, priority, type, escalationWorkflow } = parsed.data;
      const notification = await NotificationService.createNotification(
        stadiumId,
        title,
        message,
        priority,
        type,
        escalationWorkflow
      );

      sendSuccess(res, { notification }, 201);
    } catch (err: any) {
      sendError(res, err.message || "Failed to dispatch notification.", 500);
    }
  }
}
