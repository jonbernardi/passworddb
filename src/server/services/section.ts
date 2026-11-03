import {HTTPException} from "hono/http-exception";
import type {DataItem, Section, SectionDetail, SectionInput} from "../../shared/types";
import type {StoredData} from "../types";
import {DataRepository} from "./data";
import {decrypt} from "./crypto";

export class SectionRepository {
    constructor(
        private readonly db: D1Database,
        private readonly encryptionKey: string,
    ) {}

    async list(site_id: number): Promise<SectionDetail[]> {
        const [sections, items] = await Promise.all([
            this.db
                .prepare("SELECT id, site_id, name, sort, created_at, updated_at FROM sections WHERE site_id = ? ORDER BY sort, id")
                .bind(site_id)
                .all<Section>(),
            this.db
                .prepare(
                    `SELECT data.id, data.section_id, data.name, data.data, data.sort, data.created_at, data.updated_at
                     FROM data JOIN sections ON sections.id = data.section_id
                     WHERE sections.site_id = ? ORDER BY data.sort, data.id`,
                )
                .bind(site_id)
                .all<StoredData>(),
        ]);

        const decrypted = await Promise.all(items.results.map(async item => ({
            ...item,
            data: await decrypt(item.data, this.encryptionKey),
        })));
        const bySection = new Map<number, DataItem[]>();
        for (const item of decrypted) {
            const group = bySection.get(item.section_id) ?? [];
            group.push(item);
            bySection.set(item.section_id, group);
        }

        return sections.results.map(section => ({
            ...section,
            data: bySection.get(section.id) ?? [],
        }));
    }

    async get(id: number): Promise<Section> {
        const section = await this.db
            .prepare("SELECT id, site_id, name, sort, created_at, updated_at FROM sections WHERE id = ?")
            .bind(id)
            .first<Section>();

        if (!section) {
            throw new HTTPException(404, {message: 'Section not found.'});
        }
        return section;
    }

    async details(id: number): Promise<SectionDetail> {
        const section = await this.get(id);
        const data = await new DataRepository(this.db, this.encryptionKey).list(id);
        return {...section, data};
    }

    async add(site_id: number, section: SectionInput): Promise<Section> {
        const created = await this.db
            .prepare(
                `INSERT INTO sections (site_id, name, sort, created_at, updated_at)
                 SELECT id, ?, (SELECT COALESCE(MAX(sort) + 1, 0) FROM sections WHERE site_id = ?),
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                 FROM sites WHERE id = ?
                 RETURNING id, site_id, name, sort, created_at, updated_at`,
            )
            .bind(section.name, site_id, site_id)
            .first<Section>();

        if (!created) {
            throw new HTTPException(404, {message: 'Site not found.'});
        }
        return created;
    }

    async update(id: number, section: SectionInput): Promise<Section> {
        const updated = await this.db
            .prepare(
                `UPDATE sections SET name = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?
                 RETURNING id, site_id, name, sort, created_at, updated_at`,
            )
            .bind(section.name, id)
            .first<Section>();

        if (!updated) {
            throw new HTTPException(404, {message: 'Section not found.'});
        }
        return updated;
    }

    async delete(id: number): Promise<void> {
        await this.db.prepare("DELETE FROM sections WHERE id = ?").bind(id).run();
    }

    async move(site_id: number, id: number, direction: 'up'|'down'): Promise<void> {
        const offset = direction === 'up' ? -1 : 1;
        await this.db.prepare(
                `WITH ordered AS MATERIALIZED (
                     SELECT id, ROW_NUMBER() OVER (ORDER BY sort, id) - 1 AS position
                     FROM sections WHERE site_id = ?
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
                 UPDATE sections
                 SET sort = (SELECT position FROM new_order WHERE new_order.id = sections.id),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE site_id = ? AND id IN (SELECT id FROM new_order)
                   AND sort <> (SELECT position FROM new_order WHERE new_order.id = sections.id)`,
        ).bind(site_id, offset, id, site_id).run();
    }
}
