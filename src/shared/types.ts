import { z } from "zod";
const name = z.string().trim().min(1, "Name is required.").max(191);
const optionalText = z
    .string()
    .trim()
    .max(191)
    .nullish()
    .transform((v) => v || null);
export const siteInput = z
    .object({
        name,
        domain: optionalText,
        url: z
            .union([
                z.url({ protocol: /^https?$/ }).max(191),
                z.literal(""),
                z.null(),
            ])
            .optional()
            .transform((v) => v || null),
        notes: z
            .string()
            .trim()
            .max(100_000)
            .nullish()
            .transform((v) => v || null),
    })
    .strict();
export const sectionInput = z.object({ name }).strict();
export const fieldInput = z.discriminatedUnion("type", [
    z.object({
        name,
        type: z.literal("text"),
        value: z
            .string()
            .max(100_000)
            .nullable()
            .transform((v) => v?.trim() || null),
    }),
    z.object({
        name,
        type: z.literal("textarea"),
        value: z
            .string()
            .max(100_000)
            .nullable()
            .transform((v) => v?.trim() || null),
    }),
    z.object({ name, type: z.literal("boolean"), value: z.boolean() }),
]);
export const dataInput = z
    .object({ name, data: z.array(fieldInput).min(1).max(200) })
    .strict();
export type Field = z.infer<typeof fieldInput>;
export type SiteInput = z.infer<typeof siteInput>;
export type SectionInput = z.infer<typeof sectionInput>;
export type DataInput = z.infer<typeof dataInput>;
export interface Site extends SiteInput {
    id: number;
    created_at: string;
    updated_at: string;
}
export interface Section {
    id: number;
    site_id: number;
    name: string;
    sort: number;
    created_at: string;
    updated_at: string;
}
export interface DataItem {
    id: number;
    section_id: number;
    name: string;
    sort: number;
    data: Field[];
    created_at: string;
    updated_at: string;
}
export interface SectionDetail extends Section {
    data: DataItem[];
}
export interface SiteDetail extends Site {
    sections: SectionDetail[];
}
export type SiteSummary = Pick<Site, "id" | "name" | "domain" | "url" | "notes">;
export type SiteForm = Pick<Site, "name" | "domain" | "url" | "notes">;
export interface ApiProblem {
    error: string;
    /** Field paths use dot notation, including array indices (e.g. data.0.name). */
    fields?: Record<string, string[]>;
}
export interface SortedSite extends SiteSummary {
    score: number;
}

export type OrderUpdate = number[];
