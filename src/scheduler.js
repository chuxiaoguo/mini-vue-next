let currentFlushPromise = null;
const resolvedPromise = Promise.resolve();

// 队列的冲洗状态
let isFlushing = false;
let isFlushPending = false;

const queue = [];
let flushIndex = 0;

/**
 * nextTick其实很简单就是执行一个异步的promise的回调
 * 1. 如果存在flushPromise队列的话，直接使用队列执行完的回调
 * 2. 如果不存在，则使用Promise.resolve的回调
 */
export function nextTick(fn) {
    const p = currentFlushPromise || resolvedPromise;
    return fn ? p.then(fn) : p;
}

export function queueJob(job) {
    // 如果不存在队列
    // 或者在队列中，从当前的位置开始，后续没有同样的回调函数，则推入等待入队
    // 这里有个小区别（除了允许递归的回调 -- watch），允许递归的回调检查，索引+1，因为其可以再次触发

    // 简单总结，将cb加入等待队列，并开始冲洗队列
    if (!queue.length ||
        !queue.includes(
            job,
            isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex
        )
    ) {
        queue.push(job)
        queueFlush()
    }
}

/**
 * 冲洗队列
 * 设置currentFlushPromise的引用，目的只是为了优化nextTick的性能
 */
function queueFlush() {
    if (!isFlushing && !isFlushPending) {
        isFlushPending = true
        currentFlushPromise = resolvedPromise.then(flushJobs)
    }
}

/**
 * 1. 执行前置队列 -- 比如watch中的options设置为pre
 * 2. 执行队列
 * 3. 执行后置队列 -- 比如render函数，watch中的options设置为post
 */
function flushJobs() {
    // 切换状态
    isFlushPending = false;
    isFlushing = true;

    // 冲洗前置队列
    // flushPreFlushCbs(seen)

    // 对queue队列进行排序，为了达到俩点目的
    // 1. 确保父级组件比子级组件更提前更新（因为父组件的id更小）
    // 2. 如果父组件更新期间，子组件被卸载，可以跳过该子组件的更新
    // queue.sort((a, b) => getId(a!) - getId(b!))

    try {
        for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
            const job = queue[flushIndex]
            if (job) {
                job();
            }
        }
    } finally {
        flushIndex = 0
        queue.length = 0

        // 执行后置队列
        // flushPostFlushCbs(seen)

        isFlushing = false
        currentFlushPromise = null

        // 执行队列期间如果有新的job添加进来，递归冲洗队列，直至没有
        if (queue.length || pendingPostFlushCbs.length) {
            flushJobs()
        }
    }
}