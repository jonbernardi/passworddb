import { Hono } from 'hono'
import {zValidator} from "@hono/zod-validator";
import {z} from "zod";
import {SiteRepository} from "../services/site";
import {siteInput} from "../../shared/types";
import type {ApiProblem, SiteForm} from "../../shared/types";
import type {AppEnv} from "../types";

const app = new Hono<AppEnv>()

const validateSite = zValidator('json', siteInput, (result, c) => {
    if (!result.success) {
        return c.json({
            error: 'Invalid site data.',
            fields: z.flattenError(result.error).fieldErrors,
        } satisfies ApiProblem, 400);
    }

});

const validateId = zValidator('param', z.object({
    id: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}), (result, c) => {
    if (!result.success) {
        return c.json({
            error: 'Invalid site ID.',
            fields: z.flattenError(result.error).fieldErrors,
        } satisfies ApiProblem, 400);
    }
});

app.get('/', async (c) => {
    const repository = new SiteRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.list());
})

app.post('/', validateSite, async (c) => {
    const site: SiteForm = c.req.valid('json');
    const repository = new SiteRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.add(site), 201);
})

app.get('/:id', validateId, async (c) => {
    const {id} = c.req.valid('param');
    const repository = new SiteRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.get(id));
})

app.get('/:id/details', validateId, async (c) => {
    const {id} = c.req.valid('param');
    const repository = new SiteRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.details(id));
})

app.patch('/:id', validateId, validateSite, async (c) => {
    const {id} = c.req.valid('param');
    const site: SiteForm = c.req.valid('json');
    const repository = new SiteRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    return c.json(await repository.update(id, site));
})

app.delete('/:id', validateId, async (c) => {
    const {id} = c.req.valid('param');
    const repository = new SiteRepository(c.env.DB, c.env.ENCRYPTION_KEY);

    await repository.delete(id);
    return c.body(null, 204);
})


export default app;
