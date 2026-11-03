export const icons = {
    plus: "M12 4v16m-8-8h16",
    edit: "m16 3 5 5-12 12-6 1 1-6L16 3Zm-1 1 5 5",
    trash: "M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",
    "arrow-up": "m5 12 7-7 7 7M12 5v15",
    "arrow-down": "m5 12 7 7 7-7M12 4v15",
    "arrow-left": "m12 5-7 7 7 7M5 12h15",
    "arrow-right": "m12 5 7 7-7 7M4 12h15",
    check: "m5 12 4 4L19 6",
    close: "m6 6 12 12M6 18 18 6",
    warning: "m12 3 10 18H2L12 3Zm0 6v5m0 3v1",
    search: "M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
    copy: "M8 8h13v13H8zM16 8V3H3v13h5",
};

export type IconName = keyof typeof icons;
