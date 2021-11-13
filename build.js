const esbuild = require('esbuild');

const commonConfig = {
  entryPoints: ['index.ts'],
  bundle: true,
  minify: true,
};

// Node build
esbuild.buildSync({
  ...commonConfig,
  target: ['node10.4.0'],
  format: 'cjs',
  platform: 'node',
  outfile: 'dist/pesa.cjs',
});

// Browser build
esbuild.buildSync({
  ...commonConfig,
  target: ['chrome67', 'edge79', 'firefox68', 'safari14'],
  format: 'iife',
  platform: 'browser',
  outfile: 'dist/pesa.js',
});

// Module build
esbuild.buildSync({
  ...commonConfig,
  target: ['chrome67', 'edge79', 'firefox68', 'safari14'],
  format: 'esm',
  platform: 'browser',
  outfile: 'dist/pesa.mjs',
});
