import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BaseApi, FormValidationError} from '../../../src/client/services/base';
import {SiteApi} from '../../../src/client/services/site';
import {SectionApi} from '../../../src/client/services/section';
import {DataApi} from '../../../src/client/services/data';

class Api extends BaseApi {
    protected resource = 'example';
    request(path?: string, options?: RequestInit) {return this.sendRequest(path, options);}
}
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {fetcher = vi.fn().mockImplementation(async () => Response.json({ok: true})); vi.stubGlobal('fetch', fetcher);});

describe('BaseApi', () => {
    it.each(['', '/', '///'])('normalizes a root path %j', async path => {
        expect(await new Api().request(path)).toEqual({ok: true});
        expect(fetcher.mock.calls[0][0]).toBe('/api/example');
    });
    it('normalizes leading slashes, supplies JSON headers, and preserves request options', async () => {
        const signal = new AbortController().signal;
        await new Api().request('///12/details', {method: 'PATCH', body: '{}', signal});
        const [url, options] = fetcher.mock.calls[0];
        expect(url).toBe('/api/example/12/details');
        expect(options.method).toBe('PATCH'); expect(options.body).toBe('{}'); expect(options.signal).toBe(signal);
        expect(options.headers.get('Accept')).toBe('application/json');
        expect(options.headers.get('Content-Type')).toBe('application/json');
    });
    it('preserves explicit headers and omits content-type without a body', async () => {
        await new Api().request('', {headers: {Accept: 'text/plain', 'X-Request': 'test'}});
        let headers = fetcher.mock.calls[0][1].headers;
        expect(headers.get('Accept')).toBe('text/plain'); expect(headers.get('X-Request')).toBe('test');
        expect(headers.has('Content-Type')).toBe(false);
        await new Api().request('', {body: '{}', headers: {'Content-Type': 'custom'}});
        headers = fetcher.mock.calls[1][1].headers;
        expect(headers.get('Content-Type')).toBe('custom');
    });
    it('returns undefined for 204 responses without parsing JSON', async () => {
        const response = new Response(null, {status: 204});
        const parse = vi.spyOn(response, 'json'); fetcher.mockResolvedValue(response);
        expect(await new Api().request()).toBeUndefined(); expect(parse).not.toHaveBeenCalled();
    });
    it('preserves nested validation paths in FormValidationError', async () => {
        const fields = {'data.0.name': ['Required'], name: ['Heading required']};
        fetcher.mockResolvedValue(Response.json({error: 'Invalid form', fields}, {status: 400}));
        const failure = await new Api().request().catch(error => error);
        expect(failure).toMatchObject({name: 'FormValidationError', message: 'Invalid form', fields});
        expect(failure).toBeInstanceOf(FormValidationError);
    });
    it.each([400, 403, 404, 500])('handles non-validation HTTP %s without leaking server details', async status => {
        fetcher.mockResolvedValue(new Response('Internal details', {status}));
        await expect(new Api().request()).rejects.toThrow('Request failed. Please try again.');
    });
    it.each([{error: 'Invalid'}, {fields: {}}, {}])('handles incomplete validation response %j', async problem => {
        fetcher.mockResolvedValue(Response.json(problem, {status: 400}));
        await expect(new Api().request()).rejects.not.toBeInstanceOf(FormValidationError);
    });
    it('propagates network failures', async () => {
        const error = new Error('Offline'); fetcher.mockRejectedValue(error);
        await expect(new Api().request()).rejects.toBe(error);
    });
});

for (const [name, ApiClass] of [['SiteApi', SiteApi], ['SectionApi', SectionApi], ['DataApi', DataApi]] as const) {
    describe(name, () => {
        const resource = {SiteApi: 'site', SectionApi: 'section', DataApi: 'data'}[name];
        it('gets an item using its ID', async () => {
            expect(await new ApiClass().get(17)).toEqual({ok: true});
            expect(fetcher.mock.calls[0][0]).toBe(`/api/${resource}/17`);
        });
        it('deletes an item', async () => {
            fetcher.mockResolvedValue(new Response(null, {status: 204}));
            expect(await new ApiClass().delete(17)).toBeUndefined();
            expect(fetcher.mock.calls[0][0]).toBe(`/api/${resource}/17`);
            expect(fetcher.mock.calls[0][1].method).toBe('DELETE');
        });
    });
}
const siteInput = {name: 'Site', domain: null, url: null, notes: null};
const sectionInput = {name: 'Section'};
const dataInput = {name: 'Record', data: [{name: 'Enabled', type: 'boolean' as const, value: false}]};
const writes = [
    ['site create', () => new SiteApi().add(siteInput), '/api/site', 'POST', siteInput],
    ['site update', () => new SiteApi().update(17, siteInput), '/api/site/17', 'PATCH', siteInput],
    ['section create', () => new SectionApi().add(2, sectionInput), '/api/section/2', 'POST', sectionInput],
    ['section update', () => new SectionApi().update(17, sectionInput), '/api/section/17', 'PATCH', sectionInput],
    ['data create', () => new DataApi().add(2, dataInput), '/api/data/2', 'POST', dataInput],
    ['data update', () => new DataApi().update(17, dataInput), '/api/data/17', 'PATCH', dataInput],
] as const;
it.each(writes)('%s serializes the correct payload', async (_, invoke, path, method, body) => {
    expect(await invoke()).toEqual({ok: true});
    expect(fetcher.mock.calls[0][0]).toBe(path);
    expect(fetcher.mock.calls[0][1].method).toBe(method);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(body);
});
it('lists sites and loads nested site details', async () => {
    await new SiteApi().list(); await new SiteApi().details(17);
    expect(fetcher.mock.calls.map(call => call[0])).toEqual(['/api/site', '/api/site/17/details']);
});
it.each(['up', 'down'] as const)('moves sections %s within their site', async direction => {
    await new SectionApi().move(2, 17, direction);
    expect(fetcher.mock.calls[0][0]).toBe(`/api/section/2/17/${direction}`);
    expect(fetcher.mock.calls[0][1].method).toBe('POST');
});
it.each(['left', 'right'] as const)('moves records %s within their section', async direction => {
    await new DataApi().move(2, 17, direction);
    expect(fetcher.mock.calls[0][0]).toBe(`/api/data/2/17/${direction}`);
    expect(fetcher.mock.calls[0][1].method).toBe('POST');
});
