import { readFile } from 'node:fs/promises';
import { transform } from '@swc/core';

/** @type {import('esbuild').Plugin} */
const swcDecoratorMetadata = {
  name: 'swc-decorator-metadata',
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, async ({ path }) => {
      if (path.includes('/node_modules/')) return undefined;

      const { code } = await transform(await readFile(path, 'utf-8'), {
        filename: path,
        sourceMaps: 'inline',
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          target: 'es2023',
        },
      });
      return { contents: code, loader: 'js' };
    });
  },
};

export default () => ({
  plugins: [swcDecoratorMetadata],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});
