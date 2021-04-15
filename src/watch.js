import { effect, stop } from "./effect";
import { hasChanged, isFunction } from "./utils";

const INITIAL_WATCHER_VALUE = {}

export function watch(source, cb, { immediate, deep, flush } = {}) {
    /**
     * 标准化source，分装为getter函数，目标可以是响应式对象，数组，返回响应对象的方法
     * 
     * 如果为ref，返回.value的值就行了
     * 如果是reactive，返回reactive对象，并将deep设置为tre
     * 如果是方法
     *  存在cb（第二个参数为回调函数），则getter包装cb的执行
     *  不存在cb(那就是watchEffect)，getter包装cb的执行，并多传入onInvalidate(失效监听的回调)作为cb的参数
     * 如果是数组，遍历数组，并判断数组的每一项是否为以上3种的其中一种，唯一特殊处理是判断为reactive，因为此时无法设置deep=true，因为这并不是一个对象，所以需要递归遍历读取每层属性。
     * 
     * 如何优化监听a.b.c.d这种path对象？
     */
    let getter;
    if (isFunction(source)) {
        getter = () => source()
    } else {
        getter = () => source
    }

    // 定义失效函数
    let cleanup;
    const onInvalidate = (fn) => {
        cleanup = runner.options.onStop = () => {
            fn();
        }
    }

    // 定义job，job就是执行用户的回调函数，但是执行回调前，会执行清楚函数
    const oldValue = INITIAL_WATCHER_VALUE;
    const job = () => {
        const newValue = runner();
        if (deep || hasChanged(newValue, oldValue)) {
            if (cleanup) {
                cleanup();
            }
            cb(
                newValue,
                oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
                onInvalidate
            );
            oldValue = newValue;
        }
    }

    // 定义调度器
    let scheduler;
    if (flush === 'sync') {
        // 同步更新，性能较差
        scheduler = job;
    } else if (flush === 'post') {
        // 等到组件更新后执行job
        // scheduler = () => queuePostRenderEffect(job)
    } else {
        // 如果组件未安装，执行前置异步任务（目的在渲染函数更新之前执行），若是组件已经安装，同步执行job
        // if (!instance || instance.isMounted) {
        //     queuePreFlushCb(job)
        // } else {
        //     job()
        // }
    }

    // 定义具备调度执行的副作用，因为lazy为true，所以此时并没有从getter中收集依赖
    const runner = effect(getter, {
        lazy: true,
        scheduler,
    })

    // 如果设置了立即触发选项，执行job，如果未设置，执行runner收集回调
    if (immediate) {
        job();
    } else {
        oldValue = runner();
    }

    // 返回停止监听的函数
    return () => {
        stop(runner);
    }
}