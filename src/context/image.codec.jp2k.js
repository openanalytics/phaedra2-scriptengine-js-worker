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
const {createProcess} = require('../util/codec.process');

const imagingLib = process.env.PH2_IMAGING_LIB;

const defaultConfig = {
    reversible: false,
    psnr: 70
};

exports.createCodecProcess = () => {
    return createProcess();
};

/**
 * Deprecated: this function has a lot of initialization overhead.
 * For handling large numbers of encodings, use createCodecProcess instead to spawn several processes and reuse them.
 */
exports.encode = async (inPath, outPath, config) => {
    if (!config) config = defaultConfig;

    let cmd = "java"
        + (config.codec ? (" -Dphaedra2.imaging.jp2k.codec=" + config.codec) : "")
        + " -jar " + imagingLib
        + " encode -i " + inPath + " -o " + outPath
        + " -reversible " + (config.reversible || defaultConfig.reversible)
        + (config.depth ? (" -depth " + config.depth) : "");
    
    try {
        const { stdout } = await exec(cmd);
        console.log(stdout);
    } catch (err){ 
        console.log(err.stderr.toString());
    }
};