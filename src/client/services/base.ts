import type {ApiProblem} from "../../shared/types";

export class FormValidationError extends Error {
    public readonly fields: Record<string, string[]>;

    constructor(message: string, fields: Record<string, string[]>) {
        super(message);
        this.name = 'FormValidationError';
        this.fields = fields;
    }
}

export abstract class BaseApi {
    protected base: string = '/api/';
    protected abstract resource: string;

    protected async sendRequest<T>(path: string = '', options: RequestInit = {}): Promise<T> {
        const headers = new Headers(options.headers);
        if (!headers.has('Accept')) {
            headers.set('Accept', 'application/json');
        }
        if (options.body != null && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        let url = this.base + this.resource;
        path = path.replace(/^\/+/, '');
        if (path !== '') {
            url += '/' + path;
        }
        const response = await fetch(url, {...options, headers});
        if (!response.ok) {
            if (response.status === 400) {
                const problem: ApiProblem | null = await response.json().catch(() => null);
                if (problem && typeof problem.error === 'string' && problem.fields) {
                    throw new FormValidationError(problem.error, problem.fields);
                }
            }
            throw new Error('Request failed. Please try again.');
        }

        if (response.status === 204) {
            return undefined as T;
        }
        return await response.json();
    }
}