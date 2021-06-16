import AWS from 'aws-sdk';
import puppeteer from 'puppeteer';
import params from './params.json';

const s3bucket = new AWS.S3({
  accessKeyId: params.IAM_USER_KEY,
  secretAccessKey: params.IAM_USER_SECRET
});

async function uploadObjectToS3Bucket(objectName: string, objectData: any) {
  return new Promise<void>((ok, fail) => {
    const s3params: AWS.S3.PutObjectRequest = {
      Bucket: params.BUCKET_NAME,
      Key: objectName,
      Body: objectData,
      ACL: 'public-read'
    };
    s3bucket.upload(s3params, function (err: Error, data: { Location: any; }) {
      if (err) {
        fail(err);
        return;
      }

      ok();
    });
  });
}

export async function downloadSource() {
  const timeout = 5 * 60 * 1000;
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(params.SOURCE_URL);
  await page.setDefaultNavigationTimeout(timeout);
  await page.click('#LinkButton1');

  await new Promise<void>((ok, fail) => {
    page.once('response', (event: puppeteer.HTTPResponse) => {
      if (event.status() === 200) {
        ok();
      } else {
        fail(event.statusText);
      }
    });
  });

  console.log('File download done!');

  await browser.close();
  /*
  if (res.status == 200) {
    return res.data;
  } else {
    throw `Download source error: ${res.statusText}`;
  }*/
}

export async function fileMirroringToS3() {
  try {
    const data = await downloadSource();
    await uploadObjectToS3Bucket(params.S3_OBJECT_NAME, data);
    console.log(`File mirroring success!`);
  } catch (err) {
    console.error(`File mirroring failed: ` + err);
  }
}
