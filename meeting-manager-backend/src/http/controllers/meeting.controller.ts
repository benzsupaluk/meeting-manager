import type { Request, Response } from 'express';
import type { MeetingService } from '../../services/meeting.service.js';
import { parse } from '../middleware/validate.js';
import {
  CreateMeetingSchema,
  IdParamSchema,
  MeetingListQuerySchema,
  UpdateMeetingSchema,
} from '../schemas.js';

export class MeetingController {
  constructor(private readonly meetings: MeetingService) {}

  list = async (req: Request, res: Response) => {
    const { status, ...query } = parse(MeetingListQuerySchema, req.query);
    res.json(await this.meetings.list({ ...query, statuses: status }));
  };

  get = async (req: Request, res: Response) => {
    const { id } = parse(IdParamSchema, req.params);
    res.json(await this.meetings.get(id));
  };

  create = async (req: Request, res: Response) => {
    const input = parse(CreateMeetingSchema, req.body);
    res.status(201).json(await this.meetings.create(input));
  };

  update = async (req: Request, res: Response) => {
    const { id } = parse(IdParamSchema, req.params);
    const patch = parse(UpdateMeetingSchema, req.body);
    res.json(await this.meetings.update(id, patch));
  };

  delete = async (req: Request, res: Response) => {
    const { id } = parse(IdParamSchema, req.params);
    await this.meetings.delete(id);
    res.status(204).end();
  };
}
