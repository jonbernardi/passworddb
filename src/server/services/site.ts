import {HTTPException} from "hono/http-exception";
import type {Site, SiteDetail, SiteForm, SiteSummary} from "../../shared/types";
import {SectionRepository} from "./section";


export class SiteRepository {
    constructor(
        private readonly db: D1Database,
        private readonly encryptionKey: string,
    ) {}

    async list(): Promise<SiteSummary[]> {
        return (
            await this.db
                .prepare(
                    "SELECT id, name, domain, url FROM sites ORDER BY name COLLATE NOCASE, id",
                )
                .all<SiteSummary>()
        ).results;
    }

    async add(site: SiteForm): Promise<Site> {
        const created = await this.db
            .prepare(
                `INSERT INTO sites (name, domain, url, notes, created_at, updated_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id, name, domain, url, notes, created_at, updated_at`,
            )
            .bind(site.name, site.domain, site.url, site.notes)
            .first<Site>();

        if (!created) {
            throw new Error('Failed to create site.');
        }

        return created;
    }

    async get(id: number): Promise<Site> {
        const site = await this.db
            .prepare("SELECT id, name, domain, url, notes, created_at, updated_at FROM sites WHERE id = ?")
            .bind(id)
            .first<Site>();

        if (!site) {
            throw new HTTPException(404, {message: 'Site not found.'});
        }
        return site;
    }

    async details(id: number): Promise<SiteDetail> {
        const site = await this.get(id);
        const sections = await new SectionRepository(this.db, this.encryptionKey).list(id);
        return {...site, sections};
    }

    async update(id: number, site: SiteForm): Promise<Site> {
        const updated = await this.db
            .prepare(
                `UPDATE sites SET name = ?, domain = ?, url = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?
                 RETURNING id, name, domain, url, notes, created_at, updated_at`,
            )
            .bind(site.name, site.domain, site.url, site.notes, id)
            .first<Site>();

        if (!updated) {
            throw new HTTPException(404, {message: 'Site not found.'});
        }
        return updated;
    }

    async delete(id: number): Promise<void> {
        await this.db.prepare("DELETE FROM sites WHERE id = ?").bind(id).run();
    }
}
