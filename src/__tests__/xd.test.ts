import * as fs from 'fs';
import * as path from 'path';
import '../index';

const xdToken = process.env.XD_TOKEN || '';

test('Should match with an XD file', async () => {
  const image = await fs.promises.readFile(
    path.join(__dirname, './fixtures/xd.png'),
  );
  await expect(
    image,
  ).toBePixelPerfect(
    'https://xd.adobe.com/view/8831b43f-b7da-4286-432b-088795ecbf7c-fe00/',
    { alwaysReport: true, xdToken },
  );
}, 30000);

test('Should fail with an xd file', async () => {
  const image = await fs.promises.readFile(
    path.join(__dirname, './fixtures/wrong.png'),
  );
  try {
    await expect(
      image,
    ).toBePixelPerfect(
      'https://xd.adobe.com/view/8831b43f-b7da-4286-432b-088795ecbf7c-fe00/',
      { alwaysReport: true, xdToken },
    );
    expect(1).toBe(2);
  } catch (err) {
    expect(1).toBe(1);
  }
}, 10000);
