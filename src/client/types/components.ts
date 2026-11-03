import type {AnchorHTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes} from 'vue';
import type {RouteLocationRaw} from 'vue-router';

export type ButtonColor = 'primary' | 'secondary' | 'danger' | 'success' | 'info' | 'quiet';

export type FormInputType = 'text' | 'textarea' | 'select' | 'switch' | 'checkbox'
    | 'search' | 'url' | 'email' | 'password' | 'number' | 'tel' | 'date'
    | 'datetime-local' | 'time' | 'month' | 'week' | 'range' | 'color'
    | 'hidden' | 'radio' | 'file' | 'button' | 'submit' | 'reset' | 'image';

// These attributes remain fallthrough attributes so wrappers can forward them
// to their native control without duplicating Vue's DOM prop definitions.
// Keep autocomplete as a string to avoid expanding Vue's large token union
// inside the defineProps macro's boolean-prop inference.
export type FormControlAttributes = Omit<InputHTMLAttributes, 'type' | 'value' | 'checked' | 'autocomplete'>
    & Pick<TextareaHTMLAttributes, 'rows' | 'cols' | 'wrap'>
    & {autocomplete?: string};

export type ButtonAttributes = Omit<ButtonHTMLAttributes, 'type' | 'color'>
    & Pick<AnchorHTMLAttributes, 'href' | 'target' | 'rel' | 'download'>
    & {to?: RouteLocationRaw};
