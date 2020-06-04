import * as fs from 'fs';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG, PNGWithMetadata } from 'pngjs';
import { JestMatcher, MatcherResult } from './jest-matcher';
import chalk from 'chalk';
import { fetchFigma } from './figma';
import {
  JestPixelPerfectConfiguration,
  getMergedConfiguration,
} from './config';

export interface ImageMatcherResult extends MatcherResult {
  diffImage?: PNG;
  changedRelative: number;
  totalPixels: number;
  changedPixels: number;
}

/**
 * Performs the actual check for equality of two images.
 *
 * @return A `MatcherResult` with `pass` and a message which can be handed to jest.
 */
function checkImages(
  expectedImage: PNGWithMetadata,
  receivedImage: PNGWithMetadata,
  expectedPath: string,
  receivedPath: string,
  diffPath: string,
  configuration: JestPixelPerfectConfiguration,
): ImageMatcherResult {
  const { colorThreshold, detectAntialiasing, pixelThreshold } = configuration;

  const diffImage = new PNG({
    width: receivedImage.width,
    height: receivedImage.height,
  });

  // Perform the actual image diff.
  const changedPixels = pixelmatch(
    receivedImage.data,
    expectedImage.data,
    diffImage.data,
    diffImage.width,
    diffImage.height,
    {
      threshold: colorThreshold,
      includeAA: detectAntialiasing,
    },
  );

  const preamble = `${chalk.red('Received value')} does not match ${chalk.green(
    'expected value',
  )}.`;
  const snapshotImagePixels = expectedImage.width * expectedImage.height;
  const receivedImagePixels = receivedImage.width * receivedImage.height;
  const totalPixels = Math.max(snapshotImagePixels, receivedImagePixels);
  const changedRelative = changedPixels / totalPixels;

  if (typeof pixelThreshold === 'number' && changedRelative > pixelThreshold) {
    const percentThreshold = (pixelThreshold * 100).toFixed(2);
    const percentChanged = (changedRelative * 100).toFixed(2);
    return {
      pass: false,
      message: () =>
        `${preamble}

Expected less than ${chalk.green(
          `${percentThreshold}%`,
        )} of the pixels to have changed, but ${chalk.red(
          `${percentChanged}%`,
        )} of the pixels changed.

Expected ${chalk.green(`${expectedPath}`)}
Received ${chalk.red(`${receivedPath}`)}
Diff     ${diffPath}`,
      diffImage,
      changedRelative,
      totalPixels,
      changedPixels,
      actual: receivedPath,
      expected: expectedPath,
    };
  }
  return {
    pass: true,
    message: () => 'Images are matching',
    diffImage,
    changedRelative,
    totalPixels,
    changedPixels,
  };
}

export async function toBePixelPerfect(
  this: JestMatcher,
  received: unknown,
  expected: string | Buffer,
  configuration?: JestPixelPerfectConfiguration,
): Promise<MatcherResult> {
  const resolvedConfiguration = getMergedConfiguration(configuration);
  const { reportDir, alwaysReport } = resolvedConfiguration;

  const matcherString = (this.isNot ? '.not' : '') + '.toBePixelPerfect';

  if (!Buffer.isBuffer(received)) {
    throw new Error(
      this.utils.matcherErrorMessage(
        this.utils.matcherHint(matcherString, undefined, undefined, this),
        `${this.utils.RECEIVED_COLOR('received')} value must be a Buffer`,
        this.utils.printWithType(
          'Received',
          received,
          this.utils.printReceived,
        ),
      ),
    );
  }

  if (typeof expected !== 'string' && !Buffer.isBuffer(expected)) {
    throw new Error(
      this.utils.matcherErrorMessage(
        this.utils.matcherHint(matcherString, undefined, undefined, this),
        `${this.utils.EXPECTED_COLOR(
          'expected',
        )} value must be a string or a Buffer`,
        this.utils.printWithType(
          'Expected',
          expected,
          this.utils.printExpected,
        ),
      ),
    );
  }

  const receivedImage = PNG.sync.read(received);

  let expectedBuffer: Buffer | undefined = Buffer.isBuffer(expected)
    ? expected
    : undefined;

  if (
    typeof expected === 'string' &&
    (expected.startsWith('https://www.figma.com') ||
      expected.startsWith('https://figma.com'))
  ) {
    if (!resolvedConfiguration.figmaToken) {
      throw new Error(
        this.utils.matcherErrorMessage(
          this.utils.matcherHint(matcherString, undefined, undefined, this),
          `${this.utils.EXPECTED_COLOR(
            'configuration.figmaToken',
          )} value must be an non empty string`,
          this.utils.printWithType(
            'Expected',
            resolvedConfiguration.figmaToken,
            this.utils.printExpected,
          ),
        ),
      );
    }

    expectedBuffer = await fetchFigma(
      expected,
      resolvedConfiguration.figmaToken,
      {
        width: receivedImage.width,
        height: receivedImage.height,
      },
    );
  }

  try {
    if (typeof expected === 'string' && fs.existsSync(expected)) {
      expectedBuffer = await fs.promises.readFile(expected);
    }
  } catch (err) {}

  if (!expectedBuffer) {
    throw new Error(
      this.utils.matcherErrorMessage(
        this.utils.matcherHint(matcherString, undefined, undefined, this),
        `${this.utils.EXPECTED_COLOR(
          'expected',
        )} value must contain a URL to a design file`,
        this.utils.printWithType(
          'Expected',
          expected,
          this.utils.printExpected,
        ),
      ),
    );
  }

  const expectedImage = PNG.sync.read(expectedBuffer);

  // Decode the new image and read the snapshot.

  const receivedPath = path.join(
    reportDir,
    this.currentTestName,
    'received.png',
  );
  const expectedPath = path.join(
    reportDir,
    this.currentTestName,
    'expected.png',
  );
  const diffPath = path.join(reportDir, this.currentTestName, 'diff.png');

  // Perform the actual diff of the images.
  const { pass, message, diffImage } = checkImages(
    expectedImage,
    receivedImage,
    expectedPath,
    receivedPath,
    diffPath,
    resolvedConfiguration,
  );

  if (!pass || alwaysReport) {
    if (reportDir !== null) {
      await fs.promises.mkdir(path.join(reportDir, this.currentTestName), {
        recursive: true,
      });
      await fs.promises.writeFile(receivedPath, received);
      await fs.promises.writeFile(expectedPath, expectedBuffer);
      if (diffImage) {
        await fs.promises.writeFile(diffPath, PNG.sync.write(diffImage));
      }
    }
  }
  return { pass, message };
}
