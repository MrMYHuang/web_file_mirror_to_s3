import path from 'path';
import fs from 'fs';
import * as AdmZip from 'adm-zip';
import AWS from 'aws-sdk';
import puppeteer from 'puppeteer';
import params from './params.json';
const node_xj = require("xls-to-json");

const s3bucket = new AWS.S3({
  accessKeyId: params.IAM_USER_KEY,
  secretAccessKey: params.IAM_USER_SECRET
});

export async function downloadSource() {
  const timeout = 5 * 60 * 1000;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  if (!fs.existsSync('./twch')) {
    fs.mkdirSync('./twch');
  }
  await (page as any)._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: path.resolve('./twch'),
  });
  await page.goto(params.SOURCE_URL);
  await page.setDefaultNavigationTimeout(timeout);
  await page.click('#LinkButton1');

  try {
    await new Promise<void>((ok, fail) => {
      page.on('response', (event: puppeteer.HTTPResponse) => {
        if (event.status() === 200) {
          if (event.url() === params.SOURCE_URL) {
            ok();
          }
        } else {
          fail(event.statusText);
        }
      });
    });
    console.log('File download done!');
    await browser.close();
  } catch (error) {
    throw `Download source error: ${error}`;
  }
}

async function xlsToJson() {
  const files = fs.readdirSync('./twch');
  return new Promise<void>((ok, fail) => {
    node_xj(
      {
        input: `./twch/${files[0]}`, // input xls
        rowsToSkip: 0, // number of rows to skip at the top of the sheet; defaults to 0
        allowEmptyKey: false, // avoids empty keys in the output, example: {"": "something"}; default: true
      },
      function (err: any, result: any) {
        if (err) {
          fail(err);
        } else {
          ok(result);
        }
      }
    );
  });
}

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

export async function fileMirroringToS3() {
  try {
    await downloadSource();
    const data = Buffer.from(JSON.stringify(await xlsToJson()));
    const zip = new AdmZip.default();
    zip.addFile('a.json', data);
    await uploadObjectToS3Bucket(params.S3_OBJECT_NAME, zip.toBuffer());
    console.log(`File mirroring success!`);
  } catch (err) {
    console.error(`File mirroring failed: ` + err);
  }
}
