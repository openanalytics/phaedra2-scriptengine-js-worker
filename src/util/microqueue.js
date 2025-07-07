/*
 * Phaedra II
 * 
 * Copyright (C) 2016-2025 Open Analytics
 * 
 * ===========================================================================
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Apache License as published by
 * The Apache Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * Apache License for more details.
 * 
 * You should have received a copy of the Apache License
 * along with this program.  If not, see <http://www.apache.org/licenses/>
 */
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
        jobs: [],
        trackContexts: []
    };

    for (let t = 0; t < queue.parallellism; t++) {
        queue.trackContexts[t] = {};
    }

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
            tracks[p] = queue._runTrack(p);
        }
        await Promise.all(tracks);
    };

    queue._runTrack = async (trackNr) => {
        while (queue.nextJobId < queue.jobs.length) {
            await queue._runNextJob(trackNr);
        }
    };

    queue._runNextJob = async (trackNr) => {
        const jobId = queue.nextJobId;
        queue.nextJobId++;
        queue.jobs[jobId].retVal = await queue.jobs[jobId].fn(queue.trackContexts[trackNr] || {});
    };

    return queue;
}

module.exports = {createQueue};