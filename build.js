const esbuild = require('esbuild');
const pkg = require('./package.json');

const commonConfig = {
  entryPoints: ['index.ts'],
  bundle: true,
};

// Node build
esbuild.buildSync({
  ...commonConfig,
  target: ['node10.4.0'],
  format: 'cjs',
  platform: 'node',
  outfile: pkg.main,
  sourcemap: true,
});

// Module build
esbuild.buildSync({
  ...commonConfig,
  target: ['es2020'],
  format: 'esm',
  platform: 'neutral',
  outfile: pkg.module,
  sourcemap: true,
});

// Browser build
esbuild.buildSync({
  ...commonConfig,
  target: ['chrome67', 'edge79', 'firefox68', 'safari14'],
  format: 'esm',
  platform: 'browser',
  outfile: pkg.browser,
  minify: true,
  sourcemap: true,
});
