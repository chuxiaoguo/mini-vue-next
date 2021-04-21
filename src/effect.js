// 激活或当前的副作用
let activeEffect;
// 副作用栈，考虑副作用嵌套的场景
const effectStack = [];

export function effect(fn, options) {
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        effect();
    }
    return effect;
}

function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        if (!effectStack.includes(effect)) {
            // 先清除依赖，这里因为effect上的引用和对象key上的引用是一致的
            cleanup(effect);
            try {
                effectStack.push(effect);
                activeEffect = effect;
                return fn();
            } finally {
                effectStack.pop();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    }
    effect.deps = [];
    effect.options = options;
    effect.active = true;
    return effect;
}

/**
 * 清楚副作用
 */
function cleanup(effect) {
    const { deps } = effect;
    if (deps.length) {
        deps.forEach(dep => {
            dep.delete(effect)
        });
    }
}

export function stop(effect) {
    if (effect.active) {
        cleanup(effect)
        if (effect.options.onStop) {
            effect.options.onStop()
        }
        effect.active = false
    }
}

// 依赖容器
const targetMap = new WeakMap();

export function track(target, key) {
    if (activeEffect === undefined) {
        return;
    }

    // 取得或生成对象的依赖map
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }

    // 取得或生成对象key的set
    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()));
    }

    // key中不包括该活动副作用，添加该活动副作用
    if (!deps.has(activeEffect)) {
        deps.add(activeEffect);
        activeEffect.deps.push(deps);
    }
}

// 触发依赖
export function trigger(target, key) {
    const depsMap = targetMap.get(target);

    // 没有依赖就直接返回
    if (!depsMap) {
        return;
    }

    // 创建副作用集合
    const effects = new Set();
    const add = (effectsToAdd) => {
        if (effectsToAdd) {
            effectsToAdd.forEach(effect => {
                if (effect !== activeEffect) {
                    effects.add(effect);
                }
            });
        }
    }

    // 收集属性下的所有副作用，这里只考虑修改和添加属性
    add(depsMap.get(key));

    // 创建run函数，用来执行每个副作用
    const run = (effect) => {
        if (effect.options.scheduler) {
            effect.options.scheduler(effect);
        } else {
            effect();
        }
    }

    effects.forEach(run);
}