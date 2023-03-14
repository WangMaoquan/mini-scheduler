// job 类型
export interface SchedulerJob extends Function {
  id?: number;
  pre?: boolean;
}

export type SchedulerJobs = SchedulerJob | SchedulerJob[];

// 全局保存的队列
const queue: SchedulerJob[] = [];

let isFlushing = false; // queue 是否正在执行的 标记
let isFlushPending = false; // queue 是否准备执行 的标记 可以理解为 resolve 之前 都是 true

let flushIndex = 0;

const resolvedPromise = Promise.resolve() as Promise<any>;
let currentFlushPromise: Promise<void> | null = null;

export function nextTick<T = void>(
  this: T,
  fn?: (this: T) => void,
): Promise<void> {
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(this ? fn.bind(this) : fn) : p;
}

function findInsertionIndex(id: number) {
  let start = flushIndex + 1;
  let end = queue.length;

  while (start < end) {
    const middle = (start + end) >>> 1;
    const middleJobId = getId(queue[middle]);
    middleJobId < id ? (start = middle + 1) : (end = middle);
  }

  return start;
}

/**
 * 传入一个的 cb
 * @param job
 */
export function queueJob(job: SchedulerJob) {
  if (!queue.length || !queue.includes(job)) {
    if (job.id == null) {
      queue.push(job);
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job);
    }
    queueFlush();
  }
}

/**
 * flush 意为冲洗 开始冲洗 queue,就是 将 flashPending 置为 true
 */
export function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

const getId = (job: SchedulerJob): number =>
  job.id == null ? Infinity : job.id;

const comparator = (a: SchedulerJob, b: SchedulerJob): number => {
  const diff = getId(a) - getId(b);
  if (diff === 0) {
    if (a.pre && !b.pre) return -1;
    if (b.pre && !a.pre) return 1;
  }
  return diff;
};

/**
 * 开始执行 queue 中的job
 */
function flushJobs() {
  isFlushPending = false; // 结束pending
  isFlushing = true; // 标记开始flash

  queue.sort(comparator);

  try {
    // 遍历执行
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job) {
        job();
      }
    }
  } finally {
    // 重置 状态
    queue.length = 0;
    isFlushing = false;
    flushIndex = 0;
    currentFlushPromise = null;
  }
}
