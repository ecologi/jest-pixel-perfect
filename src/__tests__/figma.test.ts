import * as fs from 'fs';
import * as path from 'path';
import '../index';

const figmaToken = process.env.FIGMA_TOKEN || '';

test('Should match with a Figma file', async () => {
  const image = await fs.promises.readFile(
    path.join(__dirname, './fixtures/figma.png'),
  );
  await expect(
    image,
  ).toBePixelPerfect(
    'https://www.figma.com/file/S2ukcXYvojo86oMu1tI9pt/Test-2-Colors?node-id=20%3A2',
    { alwaysReport: true, figmaToken },
  );
}, 10000);

test('Should match with a Figma file with a different scale', async () => {
  const image = await fs.promises.readFile(
    path.join(__dirname, './fixtures/figma@2x.png'),
  );
  await expect(
    image,
  ).toBePixelPerfect(
    'https://www.figma.com/file/S2ukcXYvojo86oMu1tI9pt/Test-2-Colors?node-id=20%3A2',
    { alwaysReport: true, figmaToken },
  );
}, 10000);

test('Should fail with a different file', async () => {
  const image = await fs.promises.readFile(
    path.join(__dirname, './fixtures/wrong.png'),
  );
  await expect(
    image,
  ).toBePixelPerfect(
    'https://www.figma.com/file/S2ukcXYvojo86oMu1tI9pt/Test-2-Colors?node-id=20%3A2',
    { alwaysReport: true, figmaToken },
  );
}, 10000);
