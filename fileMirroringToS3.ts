import path from 'path';
import fs from 'fs';
import os from 'os';
import * as AdmZip from 'adm-zip';
import {PutObjectCommand, S3Client, GetBucketLocationCommand, } from '@aws-sdk/client-s3';
import { chromium } from 'playwright';
import params from './params.json';
const tempDir = `${os.tmpdir()}/twchtemp`;
const node_xj = require("xls-to-json");

const s3Client = new S3Client({
  region: params.REGION,
  credentials: {
    accessKeyId: params.IAM_USER_KEY,
    secretAccessKey: params.IAM_USER_SECRET
  }
});

export async function downloadSource() {
  const timeout = 5 * 60 * 1000;
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    acceptDownloads: true,
  });
  const page = await context.newPage();
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    page.setDefaultNavigationTimeout(timeout);
    await page.goto(params.SOURCE_URL);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout }),
      page.click('#LinkButton1', {
        timeout
      }),
    ]);
    await download.saveAs(path.resolve(tempDir, download.suggestedFilename()));

    console.log('File download done!');
  } catch (error) {
    throw new Error(`Download source error: ${error}`);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

async function xlsToJson() {
  const files = fs.readdirSync(tempDir);
  return new Promise<void>((ok, fail) => {
    node_xj(
      {
        input: `${tempDir}/${files[0]}`, // input xls
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
  const s3client = await getS3BucketClient();
  await s3client.send(new PutObjectCommand({
    Bucket: params.BUCKET_NAME,
    Key: objectName,
    Body: objectData,
  }));
}

async function getS3BucketClient() {
  const location = await s3Client.send(new GetBucketLocationCommand({ Bucket: params.BUCKET_NAME }));
  const bucketRegion = normalizeBucketRegion(location.LocationConstraint as unknown as string);

  return new S3Client({
    region: bucketRegion,
    credentials: {
      accessKeyId: params.IAM_USER_KEY,
      secretAccessKey: params.IAM_USER_SECRET,
    },
  });
}

function normalizeBucketRegion(locationConstraint?: string) {
  if (!locationConstraint) {
    return 'us-east-1';
  }
  if (locationConstraint === 'EU') {
    return 'eu-west-1';
  }
  return locationConstraint;
}

export async function fileMirroringToS3() {
  try {
    await downloadSource();
    const data = Buffer.from(JSON.stringify(await xlsToJson()));
    fs.rmSync(path.resolve(tempDir), { recursive: true, force: true });
    const zip = new AdmZip.default();
    zip.addFile('a.json', data);
    await uploadObjectToS3Bucket(params.S3_OBJECT_NAME, zip.toBuffer());
    console.log(`File mirroring success!`);
  } catch (err) {
    throw new Error(`File mirroring failed: ` + err);
  }
}
