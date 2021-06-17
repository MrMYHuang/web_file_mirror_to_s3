const lib = require('./dist/fileMirroringToS3');

// For Google Cloud Functions
exports.gcfHandler = async (req, res) => {
  try {
      await lib.fileMirroringToS3();
      res.status(200).send('Success!');
  } catch(err) {
      res.status(400).send(`Error! ${err}`);
  }
};
