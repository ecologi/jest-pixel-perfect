import path from 'path';

export interface JestPixelPerfectConfiguration {
  /**
   * Passed to **native-image-diff**. Will disable or enable antialiasing detection.
   * Defaults to `true`.
   */
  detectAntialiasing?: boolean;
  /**
   * Passed to **native-image-diff**. Specifies the threshold on a scale from `0` to `1`
   * for when a pixel counts as changed. `0` allows no difference between two pixels and
   * `1` detects no difference between a white and a black pixel.
   */
  colorThreshold?: number;
  /**
   * If specified, makes the test check for the relative number of pixels changed. When for example
   * set to `0.5`, An image which differs from it's snapshot by 50.0001% of the pixels would fail.
   *
   * Default to `0`
   */
  pixelThreshold?: number;
  /**
   * The directory to write the report to. Defaults to a directory `.debug-output` next to here. Can be set to `null` to explicitly disable generating reports.
   */
  reportDir?: string;
  /**
   * Always create the report dir, even if the test pass
   */
  alwaysReport?: boolean;

  figmaToken?: string;
}

const defaultConfigTemplate: JestPixelPerfectConfiguration = {
  detectAntialiasing: false,
  colorThreshold: 0,
  pixelThreshold: 0,
  reportDir: path.join(__dirname, '.debug-output'),
  alwaysReport: false,
};

let defaultConfig = { ...defaultConfigTemplate };

export const setDefaultConfiguration = (
  config: JestPixelPerfectConfiguration,
) => {
  defaultConfig = { ...defaultConfigTemplate, ...config };
};

export const restoreDefaultConfiguration = () => {
  defaultConfig = { ...defaultConfigTemplate };
};

export const getMergedConfiguration = (
  config?: JestPixelPerfectConfiguration,
): JestPixelPerfectConfiguration & {
  detectAntialiasing: boolean;
  pixelThreshold: number;
  reportDir: string;
  alwaysReport: boolean;
} => {
  // @ts-ignore
  return { ...defaultConfig, ...config };
};
