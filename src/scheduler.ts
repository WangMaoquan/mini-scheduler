// job 类型
export interface SchedulerJob extends Function {
  id?: number;
}

export type SchedulerJobs = SchedulerJob | SchedulerJob[];

// 全局保存的队列
const queue: SchedulerJob[] = [];

let isFlushing = false; // queue 是否正在执行的 标记
let isFlushPending = false; // queue 是否准备执行 的标记 可以理解为 resolve 之前 都是 true

let flushIndex = 0;

/**
 * 传入一个的 cb
 * @param job
 */
export function queueJob(job: SchedulerJob) {
  if (!queue.length || !queue.includes(job)) {
    queue.push(job);
    queueFlush();
  }
}

/**
 * flush 意为冲洗 开始冲洗 queue,就是 将 flashPending 置为 true
 */
export function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true;
    Promise.resolve().then(flushJobs);
  }
}

const comparator = (a: SchedulerJob, b: SchedulerJob): number => {
  const aId = a.id == null ? Infinity : a.id;
  const bId = b.id == null ? Infinity : b.id;
  return aId - bId;
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
    flushIndex = 0;
    queue.length = 0;
    isFlushing = false;
  }
}
