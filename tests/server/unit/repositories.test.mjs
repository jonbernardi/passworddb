import {test, expect, onTestFinished} from 'vitest';
import {encryptionKey, fields, siteInput} from '../../support/fixtures.mjs';
import {SiteRepository} from '../../../src/server/services/site.ts';
import {SectionRepository} from '../../../src/server/services/section.ts';
import {DataRepository} from '../../../src/server/services/data.ts';
import {encrypt, decrypt} from '../../../src/server/services/crypto.ts';

// Script the database boundary rather than reproducing SQL or repository logic.
function database(responses) {
    const queue = [...responses];
    const calls = [];
    onTestFinished(() => expect(queue.length, 'All expected database operations ran').toBe(0));
    const db = {prepare(sql) {
        const call = {sql, values: [], operation: null};
        calls.push(call);
        const execute = async operation => {
            call.operation = operation;
            expect(queue.length, 'Unexpected database operation').toBeTruthy();
            const response = queue.shift();
            if (response instanceof Error) throw response;
            return response;
        };
        return {
            bind(...values) {call.values = values; return this;},
            first: () => execute('first'), all: () => execute('all'), run: () => execute('run'),
        };
    }};
    return {db, calls};
}
const site = {id: 1, ...siteInput, created_at: '2026-01-01', updated_at: '2026-01-01'};
const section = {id: 2, site_id: 1, name: 'Login', sort: 0};
const stored = async (id = 3, section_id = 2) => ({id, section_id, name: 'Credentials', sort: 0, data: await encrypt(fields, encryptionKey)});
const notFound = message => ({status: 404, message});

for (const [name, Repository, entity, missing] of [
    ['site', SiteRepository, site, 'Site not found.'],
    ['section', SectionRepository, section, 'Section not found.'],
]) {
    test(`${name} service: get returns an entity or a meaningful 404`, async () => {
        const {db, calls} = database([entity, null]);
        const repo = new Repository(db, encryptionKey);
        expect(await repo.get(entity.id)).toEqual(entity);
        await expect(repo.get(999)).rejects.toMatchObject(notFound(missing));
        expect(calls.map(call => call.values)).toEqual([[entity.id], [999]]);
    });
    test(`${name} service: update returns saved data and rejects missing entities`, async () => {
        const input = name === 'site' ? {...siteInput, name: 'Updated'} : {name: 'Updated'};
        const updated = {...entity, ...input};
        const {db, calls} = database([updated, null]);
        const repo = new Repository(db, encryptionKey);
        expect(await repo.update(entity.id, input)).toEqual(updated);
        await expect(repo.update(999, input)).rejects.toMatchObject(notFound(missing));
        expect(calls[0].values[0]).toBe('Updated');
        expect(calls[1].values.at(-1)).toBe(999);
    });
}

for (const [name, Repository] of [['site', SiteRepository], ['section', SectionRepository], ['data', DataRepository]]) {
    test(`${name} service: delete binds the ID and propagates database failures`, async () => {
        const failure = new Error('Database unavailable');
        const {db, calls} = database([{success: true}, failure]);
        const repo = new Repository(db, encryptionKey);
        await repo.delete(12);
        await expect(repo.delete(13)).rejects.toBe(failure);
        expect(calls.map(call => [call.operation, call.values])).toEqual([['run', [12]], ['run', [13]]]);
    });
}

test('site service: list returns database summaries, including an empty list', async () => {
    const summaries = [{id: 1, name: 'Example', domain: null, url: null}];
    const {db} = database([{results: summaries}, {results: []}]);
    const repo = new SiteRepository(db, encryptionKey);
    expect(await repo.list()).toEqual(summaries);
    expect(await repo.list()).toEqual([]);
});

test('site service: add binds values and handles unsuccessful inserts', async () => {
    const {db, calls} = database([site, null]);
    const repo = new SiteRepository(db, encryptionKey);
    expect(await repo.add(siteInput)).toEqual(site);
    expect(calls[0].values).toEqual(Object.values(siteInput));
    await expect(repo.add(siteInput)).rejects.toThrow(/Failed to create site/);
});

test('site service: details assembles site, sections, and decrypted records', async () => {
    const item = await stored();
    const {db} = database([site, {results: [section]}, {results: [item]}]);
    const repo = new SiteRepository(db, encryptionKey);
    expect(await repo.details(1)).toEqual({...site, sections: [{...section, data: [{...item, data: fields}]}]});
});

test('section service: list groups records correctly and retains empty sections and database order', async () => {
    const first = await stored(3, 2);
    const second = await stored(4, 5);
    const empty = {...section, id: 6};
    const {db, calls} = database([
        {results: [{...section, id: 5}, section, empty]}, {results: [first, second]},
        {results: []}, {results: []},
    ]);
    const repo = new SectionRepository(db, encryptionKey);
    expect(await repo.list(1)).toEqual([
        {...section, id: 5, data: [{...second, data: fields}]},
        {...section, data: [{...first, data: fields}]}, {...empty, data: []},
    ]);
    expect(await repo.list(999)).toEqual([]);
    expect(calls.map(call => call.values)).toEqual([[1], [1], [999], [999]]);
});

test('section service: details loads decrypted children', async () => {
    const item = await stored();
    const {db} = database([section, {results: [item]}]);
    expect(await new SectionRepository(db, encryptionKey).details(2)).toEqual({...section, data: [{...item, data: fields}]});
});

test('section service: add returns an entity or rejects a missing site', async () => {
    const {db, calls} = database([section, null]);
    const repo = new SectionRepository(db, encryptionKey);
    expect(await repo.add(1, {name: 'Login'})).toEqual(section);
    expect(calls[0].values).toEqual(['Login', 1, 1]);
    await expect(repo.add(999, {name: 'Login'})).rejects.toMatchObject(notFound('Site not found.'));
});

test('data service: list and get decrypt D1 byte arrays, handle null data and missing records', async () => {
    const item = await stored();
    item.data = Array.from(new Uint8Array(item.data));
    const empty = {...item, id: 4, data: null};
    const {db} = database([{results: [item, empty]}, item, {results: []}, null]);
    const repo = new DataRepository(db, encryptionKey);
    expect(await repo.list(2)).toEqual([{...item, data: fields}, {...empty, data: []}]);
    expect(await repo.get(3)).toEqual({...item, data: fields});
    expect(await repo.list(999)).toEqual([]);
    await expect(repo.get(999)).rejects.toMatchObject(notFound('Data item not found.'));
});

for (const operation of ['add', 'update']) {
    test(`data service: ${operation} encrypts fields before binding and returns decrypted values`, async () => {
        const item = await stored();
        const {db, calls} = database([item, null]);
        const repo = new DataRepository(db, encryptionKey);
        const input = {name: 'Credentials', data: fields};
        expect(await repo[operation](operation === 'add' ? 2 : 3, input)).toEqual({...item, data: fields});
        expect(calls[0].values[0]).toBe(input.name);
        expect(calls[0].values[1] instanceof ArrayBuffer).toBeTruthy();
        expect(await decrypt(calls[0].values[1], encryptionKey)).toEqual(fields);
        expect(Buffer.from(calls[0].values[1]).includes(Buffer.from('alice@example.com'))).toBe(false);
        await expect(repo[operation](999, input)).rejects.toMatchObject(notFound(operation === 'add' ? 'Section not found.' : 'Data item not found.'));
    });
}

test('data service: encryption failures occur before any database access', async () => {
    const repo = new DataRepository({prepare() {expect.fail('Database must not be touched');}}, 'invalid');
    await expect(repo.add(1, {name: 'Record', data: fields})).rejects.toThrow(/32-byte key/);
    await expect(repo.update(1, {name: 'Record', data: fields})).rejects.toThrow(/32-byte key/);
});

test('data and section services propagate corrupt stored payload errors', async () => {
    const item = {...await stored(), data: [1, 2, 3]};
    const {db} = database([item, {results: [item]}, {results: [section]}, {results: [item]}]);
    const data = new DataRepository(db, encryptionKey);
    await expect(data.get(3)).rejects.toThrow(/Unsupported encrypted data/);
    await expect(data.list(2)).rejects.toThrow(/Unsupported encrypted data/);
    await expect(new SectionRepository(db, encryptionKey).list(1)).rejects.toThrow(/Unsupported encrypted data/);
});

for (const [name, Repository, directions] of [
    ['section', SectionRepository, ['up', 'down']], ['data', DataRepository, ['left', 'right']],
]) {
    test(`${name} service: move scopes the operation to its parent and binds both directions`, async () => {
        const {db, calls} = database([{success: true}, {success: true}]);
        const repo = new Repository(db, encryptionKey);
        for (const direction of directions) await repo.move(10, 20, direction);
        expect(calls.map(call => call.values)).toEqual([[10, -1, 20, 10], [10, 1, 20, 10]]);
        expect(calls.every(call => call.operation === 'run')).toBeTruthy();
    });
}
