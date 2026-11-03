declare module 'fuzzy-tools' {
    export interface MatchRange {
        begin: number;
        end: number;
    }

    interface FieldMatch {
        score: number;
        wrapped?: string;
        ranges?: MatchRange[];
    }

    interface FilterOptions<TItem, TKey extends keyof TItem, TResult> {
        extract: TKey[];
        withWrapper?: string | ((match: string) => string);
        withScore?: boolean;
        withRanges?: boolean;
        itemWrapper: (
            item: TItem,
            match: {
                score: number;
                matches: Partial<Record<TKey, FieldMatch>>;
            },
            context: {index: number; result: TResult[]},
        ) => TResult;
    }

    export function filter<TItem, TKey extends keyof TItem, TResult>(
        query: string,
        items: TItem[],
        options: FilterOptions<TItem, TKey, TResult>,
    ): TResult[];
}
