import type { Request, Response } from 'express';
import { POSITIONS } from '../../domain/candidate.js';
import type { CandidateService } from '../../services/candidate.service.js';
import { parse } from '../middleware/validate.js';
import { CandidateSearchSchema, FeedbackSchema, IdParamSchema, UpdateNotesSchema } from '../schemas.js';

export class CandidateController {
  constructor(private readonly candidates: CandidateService) {}

  positions = (_req: Request, res: Response) => {
    res.json({ data: POSITIONS });
  };

  search = async (req: Request, res: Response) => {
    const { search, limit } = parse(CandidateSearchSchema, req.query);
    res.json({ data: await this.candidates.search(search, limit) });
  };

  get = async (req: Request, res: Response) => {
    const { id } = parse(IdParamSchema, req.params);
    res.json(await this.candidates.getProfile(id));
  };

  updateNotes = async (req: Request, res: Response) => {
    const { id } = parse(IdParamSchema, req.params);
    const { interviewNotes } = parse(UpdateNotesSchema, req.body);
    res.json(await this.candidates.updateNotes(id, interviewNotes));
  };

  addFeedback = async (req: Request, res: Response) => {
    const { id } = parse(IdParamSchema, req.params);
    const input = parse(FeedbackSchema, req.body);
    res.status(201).json(await this.candidates.addFeedback(id, input, req.user!.name));
  };
}
