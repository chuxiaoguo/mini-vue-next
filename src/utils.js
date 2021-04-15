export const hasChanged = (value, oldValue) =>
    value !== oldValue && (value === value || oldValue === oldValue)

export const isFunction = (val) => {
    return typeof val === 'function';
}