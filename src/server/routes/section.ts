import { Hono } from 'hono'
import {zValidator} from "@hono/zod-validator";
import {z} from "zod";
import {SectionRepository} from "../services/section";
import {sectionInput} from "../../shared/types";
import type {ApiProblem, SectionInput} from "../../shared/types";
import type {AppEnv} from "../types";

const app = new Hono<AppEnv>()

const identifier = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const validateId = zValidator('param', z.object({id: identifier}), (result, c) => {
    if (!result.success) {
        return c.json({
            error: 'Invalid section ID.',
            fields: z.flattenError(result.error).fieldErrors,
        } satisfies ApiProblem, 400);
    }
});

const validateSiteId = zValidator('param', z.object({site_id: identifier}), (result, c) => {
    if (!result.success) {
        return c.json({
            error: 'Invalid site ID.',
            fields: z.flattenError(result.error).fieldErrors,
        } satisfies ApiProblem, 400);
    }
});

const validateMove = zValidator('param', z.object({
    site_id: identifier,
    id: identifier,
    direction: z.enum(['up', 'down']),
}), (result, c) => {
    if (!result.success) {
        return c.json({
            error: 'Invalid section move parameters.',
            fields: z.flattenError(result.error).fieldErrors,
        } satisfies ApiProblem, 400);
    }
});

const validateSection = zValidator('json', sectionInput, (result, c) => {
    if (!result.success) {
        return c.json({
            error: 'Invalid section data.',
            fields: z.flattenError(result.error).fieldErrors,
        } satisfies ApiProblem, 400);
    }
});

app.get('/:id', validateId, async (c) => {
    const {id} = c.req.valid('param');
    const repository = new SectionRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.get(id));
})

app.post('/:site_id', validateSiteId, validateSection, async (c) => {
    const {site_id} = c.req.valid('param');
    const section: SectionInput = c.req.valid('json');
    const repository = new SectionRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.add(site_id, section), 201);
})

app.patch('/:id', validateId, validateSection, async (c) => {
    const {id} = c.req.valid('param');
    const section: SectionInput = c.req.valid('json');
    const repository = new SectionRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.update(id, section));
})

app.delete('/:id', validateId, async (c) => {
    const {id} = c.req.valid('param');
    const repository = new SectionRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    await repository.delete(id);
    return c.body(null, 204);
})

app.post('/:site_id/:id/:direction', validateMove, async (c) => {
    const {site_id, id, direction} = c.req.valid('param');
    const repository = new SectionRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    await repository.move(site_id, id, direction);
    return c.body(null, 204);
})



export default app;
