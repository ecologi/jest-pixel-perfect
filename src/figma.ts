import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

const cacheDir = path.join(__dirname, '../.cache/figma');

export const fetchFigma = async (
  url: string,
  token: string,
  { width, height }: { width: number; height: number },
) => {
  // prepare cache
  fs.promises.mkdir(cacheDir, { recursive: true });

  const parsedURL = new URL(url);

  const [, , fileKey, fileTitle] = parsedURL.pathname.split('/');
  const nodeId = parsedURL.searchParams.get('node-id');

  if (!nodeId) {
    throw new Error('The Figma URL needs to point to a specific frame.');
  }

  const versionId = parsedURL.searchParams.get('version-id');

  // https://www.figma.com/developers/api#get-file-nodes-endpoint
  const data = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?depth=0&ids=${encodeURIComponent(
      nodeId,
    )}${versionId ? `&version=${versionId}` : ''}`,
    {
      headers: {
        'X-Figma-Token': token,
      },
    },
  );

  const node = await data.json();

  if (!data.ok || node.err) {
    throw new Error(node.err);
  }

  if (!node.nodes[nodeId]) {
    throw new Error('Cannot find Figma node');
  }

  const dimensions = node.nodes[nodeId].document.absoluteBoundingBox;
  if (!dimensions) {
    throw new Error('Need a URL to a Figma frame');
  }

  // scale needs to be between 0.01 and 4
  const scale = Math.min(4, Math.max(0.01, width / dimensions.width));

  // try to use the cached if we have one
  const cachedKey = `${fileKey} - ${nodeId} - ${versionId} - ${scale}`;
  try {
    const lastModified = new Date(node.lastModified);
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

  // https://www.figma.com/developers/api#get-images-endpoint
  const imageMetaData = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?scale=${scale}&ids=${encodeURIComponent(
      nodeId,
    )}&format=png${versionId ? `&version=${versionId}` : ''}`,
    {
      headers: {
        'X-Figma-Token': token,
      },
    },
  );

  const imageUrl = await imageMetaData.json();

  if (!imageMetaData.ok || imageUrl.err) {
    throw new Error(imageUrl.err);
  }

  if (!imageUrl.images[nodeId]) {
    throw new Error('Cannot find Figma image URL');
  }

  const imageData = await fetch(imageUrl.images[nodeId]);

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
