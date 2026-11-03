import type {SiteSummary, SiteForm, SiteDetail} from "../../shared/types";
import {BaseApi} from "./base";

export class SiteApi extends BaseApi {
    protected resource: string = 'site';

    public async list(): Promise<SiteSummary[]> {
        return this.sendRequest<SiteSummary[]>();
    }

    public async get(site_id: number): Promise<SiteForm> {
        return this.sendRequest<SiteForm>(site_id.toString());
    }

    public async details(site_id: number): Promise<SiteDetail> {
        return this.sendRequest<SiteDetail>(`/${site_id}/details`);
    }

    public async add(site: SiteForm): Promise<SiteSummary> {
        return this.sendRequest<SiteSummary>('/', {
            method: "POST",
            body: JSON.stringify(site)
        });
    }


    public async update(id: number, site: SiteForm): Promise<SiteSummary> {
        return this.sendRequest<SiteSummary>(id.toString(), {
            method: "PATCH",
            body: JSON.stringify(site)
        });
    }

    public async delete(site_id: number): Promise<void> {
        return this.sendRequest<void>(site_id.toString(), {
            method: "DELETE"
        });
    }
}
