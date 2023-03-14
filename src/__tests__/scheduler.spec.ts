import { describe, test, expect } from 'vitest';
import { queueJob, SchedulerJob } from '../scheduler';

describe('scheduler', () => {
  test('queueJob', async () => {
    const calls: string[] = [];
    const dummyThen = Promise.resolve().then();
    const job1 = () => {
      calls.push('job1');
    };
    const job2 = () => {
      calls.push('job2');
    };
    queueJob(job1);
    job2();

    expect(calls.length).toBe(1);
    await dummyThen;
    expect(calls.length).toBe(2);
    expect(calls).toMatchObject(['job2', 'job1']);
  });

  test('should dedupe queued jobs', async () => {
    const calls: string[] = [];
    const dummyThen = Promise.resolve().then();
    const job1 = () => {
      calls.push('job1');
    };
    const job2 = () => {
      calls.push('job2');
    };
    queueJob(job1);
    queueJob(job2);
    queueJob(job1);
    queueJob(job2);
    expect(calls).toEqual([]);
    await dummyThen;
    expect(calls).toEqual(['job1', 'job2']);
  });

  test('queueJob while flushing', async () => {
    const calls: string[] = [];
    const dummyThen = Promise.resolve().then();
    const job1 = () => {
      calls.push('job1');
      queueJob(job2);
    };
    const job2 = () => {
      calls.push('job2');
    };
    queueJob(job1);

    await dummyThen;
    expect(calls).toEqual(['job1', 'job2']);
  });

  test("should insert jobs in ascending order of job's id when flushing", async () => {
    const calls: string[] = [];
    const dummyThen = Promise.resolve().then();
    const job1: SchedulerJob = () => {
      calls.push('job1');
    };
    const job2 = () => {
      calls.push('job2');
    };

    job2.id = 1;
    queueJob(job1);
    queueJob(job2);

    await dummyThen;
    expect(calls).toMatchObject(['job2', 'job1']);
  });

  test('pre flush jobs', async () => {
    const calls: string[] = [];
    const dummyThen = Promise.resolve().then();
    const job1: SchedulerJob = () => {
      calls.push('job1');
    };
    const job2 = () => {
      calls.push('job2');
    };

    job2.pre = true;
    job2.id = 1;
    queueJob(job1);
    queueJob(job2);

    await dummyThen;
    expect(calls).toMatchObject(['job2', 'job1']);
  });
});
