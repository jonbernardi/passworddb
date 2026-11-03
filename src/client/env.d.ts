/// <reference types="vite/client" />

import 'vue';

declare module 'vue' {
    interface DialogHTMLAttributes {
        closedby?: 'any' | 'closerequest' | 'none';
    }
}
