import {test, expect, vi} from 'vitest';
import {createDatabase} from '../../support/database.mjs';
import {fields, siteInput} from '../../support/fixtures.mjs';
import app from '../../../src/server/index.ts';

function fixture() {
    const {sqlite, env} = createDatabase();
    const request = (path, method = 'GET', body, headers = {}) => app.request(`http://localhost/api${path}`, {
        method, headers: {'Content-Type': 'application/json', ...headers},
        ...(body === undefined || method === 'GET' || method === 'HEAD' ? {} : {body: JSON.stringify(body)}),
    }, env);
    const json = async (path, method, body, expected = 200) => {
        const response = await request(path, method, body);
        expect(response.status, await response.clone().text()).toBe(expected);
        return response.json();
    };
    const site = (input = siteInput) => json('/site', 'POST', input, 201);
    const section = (site_id, name = 'Login') => json(`/section/${site_id}`, 'POST', {name}, 201);
    const record = (section_id, name = 'Credentials', data = fields) => json(`/data/${section_id}`, 'POST', {name, data}, 201);
    const counts = () => ['sites', 'sections', 'data'].map(table => sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count);
    return {sqlite, env, request, json, site, section, record, counts};
}
const assertEmpty = async response => {
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
};

test('API: root, unknown routes, and cache/security headers', async () => {
    const {request} = fixture();
    const root = await request('');
    expect(root.status).toBe(200);
    expect(await root.text()).toBe('Hello Hono!');
    for (const path of ['/site', '/site/999', '/unknown']) {
        const response = await request(path);
        expect(response.status).toBe(path === '/site' ? 200 : 404);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    }
});

test('API: site CRUD, alphabetical summaries, normalization, and empty details', async () => {
    const {json, site, request, counts} = fixture();
    expect(await json('/site')).toEqual([]);
    const zulu = await site({...siteInput, name: ' zulu ', domain: ' ', url: '', notes: '  '});
    expect(zulu.name).toBe('zulu');
    expect(zulu.domain).toBe(null);
    expect(zulu.url).toBe(null);
    expect(zulu.notes).toBe(null);
    expect(zulu.created_at && zulu.updated_at).toBeTruthy();
    const alpha = await site({...siteInput, name: 'Alpha'});
    expect((await json('/site')).map(item => item.id)).toEqual([alpha.id, zulu.id]);
    expect(Object.keys((await json('/site'))[0]).sort()).toEqual(['domain', 'id', 'name', 'url']);
    expect(await json(`/site/${zulu.id}`)).toEqual(zulu);
    expect(await json(`/site/${zulu.id}/details`)).toEqual({...zulu, sections: []});
    const input = {name: 'Updated', domain: 'new.example.com', url: 'https://new.example.com', notes: 'Some notes'};
    const updated = await json(`/site/${zulu.id}`, 'PATCH', input);
    for (const [key, value] of Object.entries(input)) expect(updated[key]).toBe(value);
    expect(updated.id).toBe(zulu.id);
    expect(updated.created_at).toBe(zulu.created_at);
    expect(await json(`/site/${zulu.id}`)).toEqual(updated);
    await assertEmpty(await request(`/site/${zulu.id}`, 'DELETE'));
    expect((await request(`/site/${zulu.id}`)).status).toBe(404);
    expect(counts()).toEqual([1, 0, 0]);
});

test('API: section CRUD maintains parent and appends sort positions', async () => {
    const {site, section, json, request} = fixture();
    const parent = await site();
    const first = await section(parent.id, '  First  ');
    const second = await section(parent.id, 'Second');
    expect(first.name).toBe('First');
    expect(first.site_id).toBe(parent.id);
    expect(first.sort).toBe(0);
    expect(second.sort).toBe(1);
    expect(await json(`/section/${first.id}`)).toEqual(first);
    const updated = await json(`/section/${first.id}`, 'PATCH', {name: 'Updated'});
    expect(updated.name).toBe('Updated');
    expect(updated.site_id).toBe(parent.id);
    expect(updated.sort).toBe(first.sort);
    await assertEmpty(await request(`/section/${first.id}`, 'DELETE'));
    const third = await section(parent.id, 'Third');
    expect(third.sort).toBe(second.sort + 1);
    expect((await json(`/site/${parent.id}/details`)).sections.map(item => item.id)).toEqual([second.id, third.id]);
});

test('API: record CRUD encrypts persisted fields and decrypts responses, preserving booleans and multiline text', async () => {
    const {site, section, record, json, request, sqlite} = fixture();
    const parent = await site();
    const group = await section(parent.id);
    const created = await record(group.id);
    expect(created.section_id).toBe(group.id);
    expect(created.sort).toBe(0);
    expect(created.data).toEqual(fields);
    const stored = sqlite.prepare('SELECT data FROM data WHERE id = ?').get(created.id).data;
    expect(stored instanceof Uint8Array).toBeTruthy();
    expect(Buffer.from(stored).includes(Buffer.from('alice@example.com'))).toBe(false);
    expect(await json(`/data/${created.id}`)).toEqual(created);
    const input = {name: 'Updated', data: [{name: 'Notes', type: 'textarea', value: '  Revised\nNotes  '}]};
    const updated = await json(`/data/${created.id}`, 'PATCH', input);
    expect(updated.name).toBe('Updated');
    expect(updated.data).toEqual([{name: 'Notes', type: 'textarea', value: 'Revised\nNotes'}]);
    expect(updated.section_id).toBe(group.id);
    expect(updated.sort).toBe(created.sort);
    expect(await json(`/data/${created.id}`)).toEqual(updated);
    const fresh = sqlite.prepare('SELECT data FROM data WHERE id = ?').get(created.id).data;
    expect(fresh).not.toEqual(stored);
    await assertEmpty(await request(`/data/${created.id}`, 'DELETE'));
    expect((await request(`/data/${created.id}`)).status).toBe(404);
});

test('API: site details groups ordered records, keeps empty sections, and excludes other sites', async () => {
    const {site, section, record, json} = fixture();
    const firstSite = await site();
    const secondSite = await site({...siteInput, name: 'Other'});
    const first = await section(firstSite.id, 'First');
    const empty = await section(firstSite.id, 'Empty');
    const other = await section(secondSite.id, 'Other');
    const item1 = await record(first.id, 'First item');
    const item2 = await record(first.id, 'Second item');
    await record(other.id, 'Excluded');
    const details = await json(`/site/${firstSite.id}/details`);
    expect(details.sections.map(item => item.id)).toEqual([first.id, empty.id]);
    expect(details.sections[0].data).toEqual([item1, item2]);
    expect(details.sections[1].data).toEqual([]);
});

for (const kind of ['section', 'data']) {
    test(`API: ${kind} ordering handles both directions, boundaries, sort gaps, ties, and parent scoping`, async () => {
        const {site, section, record, json, request, sqlite} = fixture();
        const s1 = await site();
        const s2 = await site({...siteInput, name: 'Other'});
        const parent = kind === 'section' ? s1 : await section(s1.id);
        const otherParent = kind === 'section' ? s2 : await section(s2.id);
        const create = kind === 'section' ? section : record;
        const a = await create(parent.id, 'A');
        const b = await create(parent.id, 'B');
        const c = await create(parent.id, 'C');
        const other = await create(otherParent.id, 'Other');
        const table = kind === 'section' ? 'sections' : 'data';
        const foreignKey = kind === 'section' ? 'site_id' : 'section_id';
        const order = () => sqlite.prepare(`SELECT id FROM ${table} WHERE ${foreignKey} = ? ORDER BY sort, id`).all(parent.id).map(item => item.id);
        const move = async (id, direction, parentId = parent.id) => assertEmpty(await request(`/${kind}/${parentId}/${id}/${direction}`, 'POST'));
        const backward = kind === 'section' ? 'up' : 'left';
        const forward = kind === 'section' ? 'down' : 'right';
        await move(b.id, backward);
        expect(order()).toEqual([b.id, a.id, c.id]);
        await move(b.id, forward);
        expect(order()).toEqual([a.id, b.id, c.id]);
        for (const [id, dir, parentId] of [[a.id, backward], [c.id, forward], [other.id, backward], [999, forward], [a.id, forward, 999]]) {
            await move(id, dir, parentId);
            expect(order()).toEqual([a.id, b.id, c.id]);
        }
        sqlite.prepare(`UPDATE ${table} SET sort = 10 WHERE id IN (?, ?)`).run(a.id, b.id);
        sqlite.prepare(`UPDATE ${table} SET sort = 30 WHERE id = ?`).run(c.id);
        await move(c.id, backward);
        expect(order()).toEqual([a.id, c.id, b.id]);
        const sorted = sqlite.prepare(`SELECT sort FROM ${table} WHERE ${foreignKey} = ? ORDER BY sort, id`).all(parent.id);
        expect(sorted.map(item => item.sort)).toEqual([0, 1, 2]);
        await assertEmpty(await request(`/${kind}/${c.id}`, 'DELETE'));
        const appended = await create(parent.id, 'Appended');
        expect(appended.sort).toBe(3);
        expect(order()).toEqual([a.id, b.id, appended.id]);
        const details = await json(`/site/${s1.id}/details`);
        const visible = kind === 'section' ? details.sections : details.sections[0].data;
        expect(visible.map(item => item.id)).toEqual(order());
        expect(sqlite.prepare(`SELECT sort FROM ${table} WHERE id = ?`).get(other.id).sort).toBe(0);
    });
}

test('API: section and site deletion cascade without deleting unrelated records', async () => {
    const {site, section, record, request, counts, json} = fixture();
    const first = await site();
    const second = await site({...siteInput, name: 'Other'});
    const a = await section(first.id);
    const b = await section(first.id, 'Second');
    const other = await section(second.id);
    const doomed = await record(a.id);
    await record(b.id);
    const retained = await record(other.id);
    await assertEmpty(await request(`/section/${a.id}`, 'DELETE'));
    expect((await request(`/data/${doomed.id}`)).status).toBe(404);
    expect(counts()).toEqual([2, 2, 2]);
    await assertEmpty(await request(`/site/${first.id}`, 'DELETE'));
    expect(counts()).toEqual([1, 1, 1]);
    expect(await json(`/data/${retained.id}`)).toEqual(retained);
    for (const resource of ['site', 'section', 'data']) {
        await assertEmpty(await request(`/${resource}/999`, 'DELETE')); // Deletes are idempotent.
    }
});

test('API: missing entities and parents return 404 without creating records', async () => {
    const {request, counts} = fixture();
    for (const path of ['/site/999', '/site/999/details', '/section/999', '/data/999']) {
        expect((await request(path)).status).toBe(404);
    }
    for (const [path, method, body] of [
        ['/site/999', 'PATCH', siteInput], ['/section/999', 'POST', {name: 'Section'}],
        ['/section/999', 'PATCH', {name: 'Section'}], ['/data/999', 'POST', {name: 'Record', data: fields}],
        ['/data/999', 'PATCH', {name: 'Record', data: fields}],
    ]) expect((await request(path, method, body)).status).toBe(404);
    expect(counts()).toEqual([0, 0, 0]);
});

test('API: invalid IDs and move parameters are rejected before database operations', async () => {
    const {request, counts} = fixture();
    for (const id of ['0', '-1', '1.5', 'abc', '9007199254740992']) {
        for (const resource of ['site', 'section', 'data']) {
            for (const method of ['GET', 'PATCH', 'DELETE']) {
                const response = await request(`/${resource}/${id}`, method, {});
                expect(response.status, `${method} ${resource}/${id}`).toBe(400);
                expect((await response.json()).fields.id).toBeTruthy();
            }
        }
        for (const resource of ['section', 'data']) {
            expect((await request(`/${resource}/${id}`, 'POST', {name: 'Name', data: fields})).status).toBe(400);
            expect((await request(`/${resource}/${id}/1/up`, 'POST')).status).toBe(400);
            expect((await request(`/${resource}/1/${id}/left`, 'POST')).status).toBe(400);
        }
    }
    for (const path of ['/section/1/1/left', '/data/1/1/up', '/section/1/1/invalid', '/data/1/1/invalid']) {
        const response = await request(path, 'POST');
        expect(response.status).toBe(400);
        expect((await response.json()).fields.direction).toBeTruthy();
    }
    expect(counts()).toEqual([0, 0, 0]);
});

test('API: invalid form payloads expose field errors and do not mutate existing data', async () => {
    const {site, section, record, request, counts, json} = fixture();
    const parent = await site();
    const group = await section(parent.id);
    const item = await record(group.id);
    for (const method of ['POST', 'PATCH']) {
        for (const [path, body, keys] of [
            [`/site${method === 'PATCH' ? `/${parent.id}` : ''}`, {name: '', url: 'javascript:alert(1)', domain: 'x'.repeat(192), notes: 'x'.repeat(100001)}, ['domain', 'name', 'notes', 'url']],
            [`/section/${method === 'POST' ? parent.id : group.id}`, {name: ' ', extra: true}, ['name']],
            [`/data/${method === 'POST' ? group.id : item.id}`, {name: '', data: [{name: '', type: 'text', value: 'x'.repeat(100001)}, {name: 'Enabled', type: 'boolean', value: 'yes'}]}, ['data.0.name', 'data.0.value', 'data.1.value', 'name']],
        ]) {
            const response = await request(path, method, body);
            expect(response.status).toBe(400);
            const problem = await response.json();
            expect(problem.error).toBeTruthy();
            expect(Object.keys(problem.fields).sort()).toEqual(keys);
        }
    }
    for (const data of [[], Array.from({length: 201}, () => fields[0])]) {
        const response = await request(`/data/${group.id}`, 'POST', {name: 'Invalid', data});
        expect(response.status).toBe(400);
        expect((await response.json()).fields.data).toBeTruthy();
    }
    expect(counts()).toEqual([1, 1, 1]);
    expect(await json(`/site/${parent.id}`)).toEqual(parent);
    expect(await json(`/data/${item.id}`)).toEqual(item);
});

test('API: malformed JSON and missing bodies cannot write data', async () => {
    const {env, counts} = fixture();
    for (const path of ['/api/site', '/api/section/1', '/api/data/1']) {
        for (const body of ['{invalid', '']) {
            const response = await app.request(`http://localhost${path}`, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body,
            }, env);
            expect(response.status).toBe(400);
        }
    }
    expect(counts()).toEqual([0, 0, 0]);
});

test('API: cross-origin writes are blocked while same-origin and origin-less writes work', async () => {
    const {request, site, section, record, counts, json} = fixture();
    const parent = await site();
    const group = await section(parent.id);
    const item = await record(group.id);
    for (const [path, method, body] of [
        ['/site', 'POST', siteInput], [`/site/${parent.id}`, 'PATCH', {...siteInput, name: 'Blocked'}],
        [`/site/${parent.id}`, 'DELETE'], [`/section/${parent.id}`, 'POST', {name: 'Blocked'}],
        [`/section/${group.id}`, 'DELETE'], [`/section/${parent.id}/${group.id}/up`, 'POST'],
        [`/data/${group.id}`, 'POST', {name: 'Blocked', data: fields}], [`/data/${item.id}`, 'DELETE'],
        [`/data/${group.id}/${item.id}/right`, 'POST'],
    ]) {
        const response = await request(path, method, body, {Origin: 'https://untrusted.example'});
        expect(response.status).toBe(403);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    }
    expect(counts()).toEqual([1, 1, 1]);
    expect((await json(`/site/${parent.id}`)).name).toBe(siteInput.name);
    expect((await request('/site', 'POST', {...siteInput, name: 'Same origin'}, {Origin: 'http://localhost'})).status).toBe(201);
    expect((await request('/site', 'GET', undefined, {Origin: 'https://untrusted.example'})).status).toBe(200);
});


test('API: accepted field limits and empty optional values persist correctly', async () => {
    const {site, section, record, json} = fixture();
    const parent = await site({name: 'n'.repeat(191), domain: 'd'.repeat(191), url: null, notes: 'n'.repeat(100000)});
    const group = await section(parent.id, 's'.repeat(191));
    const data = Array.from({length: 200}, (_, index) => ({
        name: index === 0 ? 'n'.repeat(191) : `Field ${index}`,
        type: 'text', value: index === 0 ? 'v'.repeat(100000) : '',
    }));
    const created = await record(group.id, 'r'.repeat(191), data);
    expect(created.data.length).toBe(200);
    expect(created.data[0].value.length).toBe(100000);
    expect(created.data[1].value).toBe(null);
    expect((await json(`/site/${parent.id}/details`)).sections[0].data[0]).toEqual(created);
});

test('API: quoted and SQL-like text is stored as data', async () => {
    const {site, section, record, json, counts} = fixture();
    const text = "O'Reilly'); DROP TABLE sites; --";
    const parent = await site({...siteInput, name: text, notes: text});
    const group = await section(parent.id, text);
    const item = await record(group.id, text, [{name: text, type: 'text', value: text}]);
    expect((await json(`/site/${parent.id}`)).name).toBe(text);
    expect((await json(`/section/${group.id}`)).name).toBe(text);
    expect((await json(`/data/${item.id}`)).data[0].value).toBe(text);
    expect(counts()).toEqual([1, 1, 1]);
});

test('API: encryption and stored-data failures return generic 500 responses without persisting bad writes', async () => {
    const {site, section, record, sqlite, env, counts, request} = fixture();
    const parent = await site();
    const group = await section(parent.id);
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await app.request(`http://localhost/api/data/${group.id}`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: 'Record', data: fields}),
    }, {...env, ENCRYPTION_KEY: 'invalid'});
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(counts()).toEqual([1, 1, 0]);
    const item = await record(group.id);
    sqlite.prepare('UPDATE data SET data = ? WHERE id = ?').run(new Uint8Array([1, 2, 3]), item.id);
    for (const path of [`/data/${item.id}`, `/site/${parent.id}/details`]) {
        const failedRead = await request(path);
        expect(failedRead.status).toBe(500);
        expect(await failedRead.text()).toBe('Internal Server Error');
    }
    expect(logged.mock.calls.length).toBe(3);
});
