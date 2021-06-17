const lib = require('./dist/fileMirroringToS3');

async function test() {
    await lib.fileMirroringToS3();
}

test();
