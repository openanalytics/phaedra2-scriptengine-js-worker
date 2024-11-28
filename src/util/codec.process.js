const { spawn } = require('node:child_process');

const imagingLib = process.env.PH2_IMAGING_LIB;
const imagingCodec = process.env.PH2_IMAGING_CODEC || "bioformats";
const jp2kCodec = process.env.PH2_IMAGING_JP2K_CODEC || "openjpeg";

function createProcess() {

    const processHolder = {
        busy: false,
        cmdOK: false,
        cmdError: null,
        promiseResolver: null,
        promiseRejecter: null
    };

    processHolder.process = spawn("java", [
        "-Dphaedra2.imaging.codec=" + imagingCodec,
        "-Dphaedra2.imaging.jp2k.codec=" + jp2kCodec,
        "-jar", imagingLib,
        "server" 
    ]);
    processHolder.process.stdin.setEncoding('utf-8');

    processHolder.process.stdout.on('data', (data) => {
        let dataString = `${data}`.trim();
        if (dataString.includes("loci.formats")) {
            // Ignore Bioformats stdout spam
        } else if (dataString.includes("ok")) {
            processHolder.cmdOK = true;
            processHolder.cmdError = null;
            processHolder.busy = false;
            processHolder.promiseResolver();
        } else {
            console.log(dataString);
        }
    });

    processHolder.process.stderr.on('data', (data) => {
        let dataString = `${data}`.trim();
        if (dataString.startsWith("error: ")) {
            processHolder.cmdOK = false;
            processHolder.cmdError = data;
            processHolder.busy = false;
            processHolder.promiseRejecter(dataString);
        }
    });

    processHolder.execute = async (cmd) => {
        if (processHolder.busy) throw "Cannot execute cmd: process is busy"
        processHolder.busy = true;

        processHolder.process.stdin.write(cmd + "\n");
        return new Promise((resolve, reject) => {
            processHolder.promiseResolver = resolve;
            processHolder.promiseRejecter = reject;
        });
    }

    processHolder.stop = () => {
        processHolder.process.stdin.end();
    }

    return processHolder;
}

module.exports = { createProcess };