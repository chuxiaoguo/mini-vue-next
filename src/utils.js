export const hasChanged = (value, oldValue) =>
    value !== oldValue && (value === value || oldValue === oldValue)

export const isFunction = (val) => {
    return typeof val === 'function';
}

export const isObject = (val) => {
    return typeof val === 'object' && val !== null;
}

export const isArray = Array.isArray;