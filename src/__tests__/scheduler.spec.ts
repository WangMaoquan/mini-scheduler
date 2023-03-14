import { describe, test, expect } from 'vitest';
import { queueJob } from '../scheduler';

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
});
