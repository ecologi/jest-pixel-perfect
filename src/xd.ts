import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

const cacheDir = path.join(__dirname, '../.cache/xd');

export const fetchXD = async (
  url: string,
  token: string,
  { width, height }: { width: number; height: number },
) => {
  // prepare cache
  fs.promises.mkdir(cacheDir, { recursive: true });

  const parsedURL = new URL(url);

  let [, , documentKey, , screenId] = parsedURL.pathname.split('/');

  if (!documentKey) {
    throw new Error('The XD URL needs to point to a specific document.');
  }

  const version = parsedURL.searchParams.get('version');

  // https://adobexdplatform.com/cloud-content-api-docs/reference/#v2documentlinkid
  const documentData = await fetch(
    `https://xdce.adobe.io/v2/document/${documentKey}${
      version ? `?version=${version}` : ''
    }`,
    {
      headers: {
        'x-api-key': token,
      },
    },
  );

  const document = await documentData.json();

  if (!documentData.ok || document.err) {
    throw new Error(document.err);
  }

  if (!screenId) {
    if (!document.homeArtboardId) {
      throw new Error('Cannot find main XD artboard');
    }

    screenId = document.homeArtboardId;
  }

  // try to use the cached if we have one
  const cachedKey = `${documentKey} - ${screenId} - ${version}`;
  try {
    const lastModified = new Date(document.lastupdated);
    const cachedLastModified = new Date(
      await fs.promises.readFile(
        path.join(cacheDir, `${cachedKey}.txt`),
        'utf8',
      ),
    );

    if (lastModified.getTime() === cachedLastModified.getTime()) {
      return await fs.promises.readFile(
        path.join(cacheDir, `${cachedKey}.png`),
      );
    }
  } catch (err) {}

  // https://adobexdplatform.com/cloud-content-api-docs/reference/#v2documentlinkidartboardartboardid
  const data = await fetch(
    `https://xdce.adobe.io/v2/document/${documentKey}/artboard/${screenId}${
      version ? `?version=${version}` : ''
    }`,
    {
      headers: {
        'x-api-key': token,
      },
    },
  );

  const node = await data.json();

  if (!data.ok || node.err) {
    throw new Error(node.err);
  }

  const imageUrl = node.thumbnail.url;

  const imageData = await fetch(imageUrl);

  const buffer = await imageData.buffer();

  try {
    await fs.promises.writeFile(
      path.join(cacheDir, `${cachedKey}.txt`),
      node.lastModified,
    );
    await fs.promises.writeFile(
      path.join(cacheDir, `${cachedKey}.png`),
      buffer,
    );
  } catch (err) {}

  return buffer;
};
