For testing:

kafka-console-producer.bat --bootstrap-server localhost:9093 --topic scriptengine --property parse.key=true --property key.separator=:

requestScriptExecution:{"language":"JS","id":"1234","input":"{\"a\": 10}","script":"console.log('test'); output = a*5;"}

requestScriptExecution:{"language":"JS","id":"1234","input":"{\"path\": \"s3://phaedra2-poc-measdata/testdata/example-mchf-384w-5ch/WellP9_AllFields_NucStain.tif\"}","script":"tmpPath = 'c:/dev/temp'; inPath = await sourcePathUtils.getAsFile(path, tmpPath); outPath = tmpPath + '/out.jp2k'; await imageCodec.encode(inPath, outPath, { reversible: false, depth: 16}); output = outPath;"}

requestScriptExecution:{"language":"JS","id":"1234","input":"{\"a\": 10}","script":"await metadataService.postTag(947, 'TestTag1');"}

requestScriptExecution:{"language":"JS","id":"1234","input":"{\"a\": 10}","script":"await kafka.send({topic: 'scriptengine', messages: [{ key: 'nonsense', value: 'nonsense'}]});"}