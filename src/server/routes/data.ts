import { Hono } from 'hono'
import {zValidator} from "@hono/zod-validator";
import {z} from "zod";
import {DataRepository} from "../services/data";
import {dataInput} from "../../shared/types";
import type {ApiProblem, DataInput} from "../../shared/types";
import type {AppEnv} from "../types";

const app = new Hono<AppEnv>()

const identifier = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const validateId = zValidator('param', z.object({id: identifier}), (result, c) => {
    if (!result.success) {
        return c.json({
            error: 'Invalid data ID.',
            fields: z.flattenError(result.error).fieldErrors,
        } satisfies ApiProblem, 400);
    }
});

const validateSectionId = zValidator('param', z.object({section_id: identifier}), (result, c) => {
    if (!result.success) {
        return c.json({
            error: 'Invalid section ID.',
            fields: z.flattenError(result.error).fieldErrors,
        } satisfies ApiProblem, 400);
    }
});

const validateMove = zValidator('param', z.object({
    section_id: identifier,
    id: identifier,
    direction: z.enum(['left', 'right']),
}), (result, c) => {
    if (!result.success) {
        return c.json({
            error: 'Invalid data move parameters.',
            fields: z.flattenError(result.error).fieldErrors,
        } satisfies ApiProblem, 400);
    }
});

const validateData = zValidator('json', dataInput, (result, c) => {
    if (!result.success) {
        const fields: Record<string, string[]> = {};
        for (const issue of result.error.issues) {
            const path = issue.path.join('.');
            if (path) {
                (fields[path] ??= []).push(issue.message);
            }
        }
        return c.json({
            error: 'Invalid data item.',
            fields,
        } satisfies ApiProblem, 400);
    }
});

app.get('/:id', validateId, async (c) => {
    const {id} = c.req.valid('param');
    const repository = new DataRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.get(id));
})

app.post('/:section_id', validateSectionId, validateData, async (c) => {
    const {section_id} = c.req.valid('param');
    const data: DataInput = c.req.valid('json');
    const repository = new DataRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.add(section_id, data), 201);
})

app.patch('/:id', validateId, validateData, async (c) => {
    const {id} = c.req.valid('param');
    const data: DataInput = c.req.valid('json');
    const repository = new DataRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.update(id, data));
})

app.delete('/:id', validateId, async (c) => {
    const {id} = c.req.valid('param');
    const repository = new DataRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    await repository.delete(id);
    return c.body(null, 204);
})

app.post('/:section_id/:id/:direction', validateMove, async (c) => {
    const {section_id, id, direction} = c.req.valid('param');
    const repository = new DataRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    await repository.move(section_id, id, direction);
    return c.body(null, 204);
})

export default app;
