import type {DataItem, DataInput} from "../../shared/types";
import {BaseApi} from "./base";

export class DataApi extends BaseApi {
    protected resource: string = 'data';

    public async get(data_id: number): Promise<DataItem> {
        return this.sendRequest<DataItem>(data_id.toString());
    }

    public async add(section_id: number, data: DataInput): Promise<DataItem> {
        return this.sendRequest<DataItem>(section_id.toString(), {
            method: "POST",
            body: JSON.stringify(data)
        });
    }

    public async update(data_id: number, data: DataInput): Promise<DataItem> {
        return this.sendRequest<DataItem>(data_id.toString(), {
            method: "PATCH",
            body: JSON.stringify(data)
        });
    }

    public async delete(data_id: number): Promise<void> {
        return this.sendRequest<void>(data_id.toString(), {
            method: "DELETE"
        });
    }

    public async move(section_id: number, data_id: number, direction: 'left' | 'right'): Promise<void> {
        return this.sendRequest<void>(`${section_id}/${data_id}/${direction}`, {
            method: "POST"
        });
    }
}
