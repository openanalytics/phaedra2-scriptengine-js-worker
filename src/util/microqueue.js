/**
 * Simple queue implementation for running async jobs in parallel.
 * Usage:
 * 
 * const microq = require('./util/microqueue');
 * const queue = microq.createQueue(4);
 * queue.add(async () => { ... });
 * queue.add(async () => { ... });
 * ...
 * await queue.run();
 * 
 * This would execute all added jobs with parallellism 4.
 */
function createQueue(parallellism) {

    const queue = {
        parallellism: parallellism || 1,
        jobs: []
    };

    queue.add = (jobFunction) => {
        const jobDef = {
            id: queue.jobs.length,
            fn: jobFunction
        };
        queue.jobs.push(jobDef);
        return jobDef;
    };

    queue.run = async () => {
        queue.nextJobId = 0;
        const tracks = [];
        for (let p=0; p < queue.parallellism; p++) {
            tracks[p] = queue._runTrack();
        }
        await Promise.all(tracks);
    };

    queue._runTrack = async () => {
        while (queue.nextJobId < queue.jobs.length) {
            await queue._runNextJob();
        }
    };

    queue._runNextJob = async () => {
        const jobId = queue.nextJobId;
        queue.nextJobId++;
        queue.jobs[jobId].retVal = await queue.jobs[jobId].fn();
    };

    return queue;
}

module.exports = {createQueue};