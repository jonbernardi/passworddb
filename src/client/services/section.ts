import {Section, SectionInput} from "../../shared/types";
import {BaseApi} from "./base";

export class SectionApi extends BaseApi {
    protected resource: string = 'section';

    public async get(section_id: number): Promise<Section> {
        return this.sendRequest<Section>(section_id.toString());
    }

    public async add(site_id: number, section: SectionInput): Promise<Section> {
        return this.sendRequest<Section>(site_id.toString(), {
            method: "POST",
            body: JSON.stringify(section)
        });
    }

    public async update(section_id: number, section: SectionInput): Promise<Section> {
        return this.sendRequest<Section>(section_id.toString(), {
            method: "PATCH",
            body: JSON.stringify(section)
        });
    }

    public async delete(section_id: number): Promise<void> {
        return this.sendRequest<void>(section_id.toString(), {
            method: "DELETE"
        });
    }

    public async move(site_id: number, section_id: number, direction: 'up' | 'down'): Promise<void> {
        return this.sendRequest<void>(`${site_id}/${section_id}/${direction}`, {
            method: "POST"
        });
    }
}
