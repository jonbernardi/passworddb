import {HTTPException} from "hono/http-exception";
import type {DataInput, DataItem} from "../../shared/types";
import type {StoredData} from "../types";
import {decrypt, encrypt} from "./crypto";

export class DataRepository {
    constructor(
        private readonly db: D1Database,
        private readonly encryptionKey: string,
    ) {}

    async list(section_id: number): Promise<DataItem[]> {
        const {results} = await this.db
            .prepare("SELECT id, section_id, name, data, sort, created_at, updated_at FROM data WHERE section_id = ? ORDER BY sort, id")
            .bind(section_id)
            .all<StoredData>();

        return Promise.all(results.map(async item => ({
            ...item,
            data: await decrypt(item.data, this.encryptionKey),
        })));
    }

    async get(id: number): Promise<DataItem> {
        const item = await this.db
            .prepare("SELECT id, section_id, name, data, sort, created_at, updated_at FROM data WHERE id = ?")
            .bind(id)
            .first<StoredData>();

        if (!item) {
            throw new HTTPException(404, {message: 'Data item not found.'});
        }
        return {...item, data: await decrypt(item.data, this.encryptionKey)};
    }

    async add(section_id: number, item: DataInput): Promise<DataItem> {
        const encrypted = await encrypt(item.data, this.encryptionKey);
        const created = await this.db
            .prepare(
                `INSERT INTO data (section_id, name, data, sort, created_at, updated_at)
                 SELECT id, ?, ?, (SELECT COALESCE(MAX(sort) + 1, 0) FROM data WHERE section_id = ?),
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                 FROM sections WHERE id = ?
                 RETURNING id, section_id, name, data, sort, created_at, updated_at`,
            )
            .bind(item.name, encrypted, section_id, section_id)
            .first<StoredData>();

        if (!created) {
            throw new HTTPException(404, {message: 'Section not found.'});
        }
        return {...created, data: await decrypt(created.data, this.encryptionKey)};
    }

    async update(id: number, item: DataInput): Promise<DataItem> {
        const encrypted = await encrypt(item.data, this.encryptionKey);
        const updated = await this.db
            .prepare(
                `UPDATE data SET name = ?, data = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?
                 RETURNING id, section_id, name, data, sort, created_at, updated_at`,
            )
            .bind(item.name, encrypted, id)
            .first<StoredData>();

        if (!updated) {
            throw new HTTPException(404, {message: 'Data item not found.'});
        }
        return {...updated, data: await decrypt(updated.data, this.encryptionKey)};
    }

    async delete(id: number): Promise<void> {
        await this.db.prepare("DELETE FROM data WHERE id = ?").bind(id).run();
    }

    async move(section_id: number, id: number, direction: 'left'|'right'): Promise<void> {
        const offset = direction === 'left' ? -1 : 1;
        await this.db.prepare(
            `WITH ordered AS MATERIALIZED (
                 SELECT id, ROW_NUMBER() OVER (ORDER BY sort, id) - 1 AS position
                 FROM data WHERE section_id = ?
             ), moved AS (
                 SELECT position, position + ? AS destination FROM ordered WHERE id = ?
             ), new_order AS MATERIALIZED (
                 SELECT ordered.id,
                        CASE WHEN ordered.position = moved.position THEN moved.destination
                             WHEN ordered.position = moved.destination THEN moved.position
                             ELSE ordered.position END AS position
                 FROM ordered CROSS JOIN moved
                 WHERE moved.destination BETWEEN 0 AND (SELECT COUNT(*) - 1 FROM ordered)
             )
             UPDATE data
             SET sort = (SELECT position FROM new_order WHERE new_order.id = data.id),
                 updated_at = CURRENT_TIMESTAMP
             WHERE section_id = ? AND id IN (SELECT id FROM new_order)
               AND sort <> (SELECT position FROM new_order WHERE new_order.id = data.id)`,
        ).bind(section_id, offset, id, section_id).run();
    }
}
