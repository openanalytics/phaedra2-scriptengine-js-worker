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
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

const identifyCmd = process.env.IM_IDENTIFY_EXEC;

exports.identify = async (filePath) => {
    let output = await exec(identifyCmd + ' ' + filePath);
    let pattern = /.* \w+ (\d+)x(\d+) .* (\d+)\-bit .*/i;
    let matchInfo = pattern.exec(output.stdout);
    if (!matchInfo) throw "Failed to identify image " + filePath;

    output = await exec(identifyCmd + ' -format "%k" ' + filePath);

    return {
        width: matchInfo[1],
        height: matchInfo[2],
        depth: matchInfo[3],
        colors: parseInt(output.stdout)
    };
};