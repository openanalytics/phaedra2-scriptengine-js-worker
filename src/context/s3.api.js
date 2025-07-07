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
const { S3Client, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const fs = require('fs/promises');

const client = new S3Client({ region: process.env.AWS_REGION || "eu-west-1" });

const splitS3URL = (url) => {
    const protocol = "s3://";
    if (!url.toLowerCase().startsWith(protocol)) return { bucket: null, key: url };

    let path = url.substring(protocol.length);
    let offset = path.indexOf('/');
    return {
        bucket: path.substring(0, offset),
        key: path.substring(offset + 1)
    };
}

const makeS3URL = (bucket, key) => {
    return "s3://" + bucket + "/" + key;
}

exports.download = async (inPath, outPath) => {
    let contents = await exports.getBytes(inPath);
    await fs.writeFile(outPath, contents);
}

exports.getBytes = async (inPath) => {
    let urlParts = splitS3URL(inPath);
    let res = await client.send(new GetObjectCommand({Bucket: urlParts.bucket, Key: urlParts.key}));
    return res.Body;
}

exports.getAsString = async (inPath) => {
    let urlParts = splitS3URL(inPath);
    let res = await client.send(new GetObjectCommand({Bucket: urlParts.bucket, Key: urlParts.key}));
    let stringResult = (await res.Body.toArray()).map(buf => buf.toString()).join('');
	return stringResult;
}

exports.list = async (path) => {
    let urlParts = splitS3URL(path);
    let prefix = urlParts.key;
    if (!prefix.endsWith("/")) prefix += "/";

    let allResults = [];
    let res = await client.send(new ListObjectsV2Command({Bucket: urlParts.bucket, Prefix: prefix, Delimiter: "/" }));
    if (res.KeyCount > 0) allResults.push(...res.Contents.map(c => makeS3URL(urlParts.bucket, c.Key)));
    while (res.IsTruncated) {
        res = await client.send(new ListObjectsV2Command({Bucket: urlParts.bucket, Prefix: prefix, Delimiter: "/", ContinuationToken: res.NextContinuationToken }));
        if (res.KeyCount > 0) allResults.push(...res.Contents.map(c => makeS3URL(urlParts.bucket, c.Key)));
    }
    
    return allResults;
}