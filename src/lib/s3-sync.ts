import * as fs from 'fs';
import * as path from 'path';
import { S3 } from '@aws-sdk/client-s3';
import { S3SyncClient } from 's3-sync-client';
const s3 = new S3();
const { sync } = new S3SyncClient({ client: s3 });

async function Sync(artifactFolder: string, bucket: string): Promise<void> {
  const absArtifactFolder = path.resolve(artifactFolder);

  if (!fs.existsSync(absArtifactFolder)) {
    throw new Error(`Cannot find artifact folder: ${absArtifactFolder}`);
  }

  await sync(absArtifactFolder, 's3://' + bucket, { del: true });
}

export default Sync;
