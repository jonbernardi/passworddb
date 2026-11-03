import type { Context } from "hono";
import type { DataItem } from "../shared/types";

export type AppEnv = {
    Bindings: {
        DB: D1Database;
        ENCRYPTION_KEY: string;
    };
};
export type AppContext = Context<AppEnv>;
export type StoredData = Omit<DataItem, "data"> & {
    data: ArrayBuffer | number[] | null;
};
