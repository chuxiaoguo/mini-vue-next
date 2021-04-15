import { effect, track, trigger } from "./effect";

export function computed(getterOrOptions) {
    // 标准化参数
    const getter = getterOrOptions;
    const setter = () => {};

    // 创建computed工厂对象并返回
    return new ComputedRefImpl(getter, setter);
}

class ComputedRefImpl {

    effect;

    _dirty = true;

    _setter;

    _value;

    constructor(getter, setter) {
        this.effect = effect(getter, {
            lazy: true,
            scheduler() {
                // _dirty 为false，说明是缓存的数据
                if (!this._dirty) {
                    this._dirty = true
                    trigger(this, 'value');
                }
            }
        });

        this._setter = setter;
    }

    get value() {
        if (this._dirty) {
            this._value = this.effect();
            this._dirty = false;
        }
        track(this, 'value');
        return this._value;
    }

    set value(newValue) {
        this.setter(newValue);
    }
}