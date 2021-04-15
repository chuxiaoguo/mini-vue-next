import { track, trigger } from './effect';
import { hasChanged } from './utils';
export function reactive(target) {
    // if (target && target._v_isReadonly) {
    //     return target;
    // }
    const observed = new Proxy(target, {
        get(target, key, receiver) {
            // 这里用reflect是为了保证能返回原本对象属性值
            const res = Reflect.get(target, key, receiver);

            // 收集依赖
            track(target, key);

            return res;
        },
        set(target, key, value, receiver) {
            // 取得旧值
            const oldValue = target[key];

            // 设置新的值
            const result = Reflect.set(target, key, value, receiver);

            // 触发依赖更新
            if (hasChanged(value, oldValue)) {
                trigger(target, key, value);
            }

            return result;
        }
    });

    return observed;
}