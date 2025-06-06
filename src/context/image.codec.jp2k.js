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