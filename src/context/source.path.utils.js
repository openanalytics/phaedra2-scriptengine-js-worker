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
'use strict';

const fs = require('fs');
const crypto = require('crypto');
const nPath = require('path');
const s3 = require('./s3.api');

exports.listContents = async (path) => {
    if (exports.isS3Path(path)) {
        let contents = await s3.list(path);
        return contents;
    } else {
        let contents = fs.readdirSync(path).map(f => `${path}${path.endsWith('/') ? '':'/'}${f}`);
        return contents;
    }
}

exports.getAsString = async (path) => {
    let data = null;
    if (exports.isS3Path(path)) {
        data = await s3.getBytes(path);
        data = await data.transformToString();
    } else {
        data = fs.readFileSync(path, "utf-8");
    }
    return data;
}

exports.getAsFile = async (path, tmpDir) => {
    if (exports.isS3Path(path)) {
        const dlPath = `${tmpDir}/dl-${crypto.randomUUID()}-${nPath.basename(path)}`;
        await s3.download(path, dlPath);
        return dlPath;
    } else {
        return path;
    }
}

exports.isS3Path = (path) => {
    return path.toLowerCase().startsWith("s3://");
}