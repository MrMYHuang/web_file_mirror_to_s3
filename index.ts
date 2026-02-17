import express from 'express';
import { fileMirroringToS3 } from './fileMirroringToS3';

const app = express();

app.all('/', async (_req, res) => {
  try {
    await fileMirroringToS3();
    res.status(200).send('Success!');
  } catch (err) {
    res.status(500).send(`Error! ${err}`);
  }
});

const PORT = process.env.PORT || '8080';
app.listen(Number(PORT), () => {
  console.log(`Service listening on port ${PORT}`);
});

export default app;
