import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, 'dist', 'faultlens-react-sample', 'browser');
const sampleDir = join(root, 'samples', 'react');

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [join(sampleDir, 'src', 'main.tsx')],
  bundle: true,
  minify: true,
  sourcemap: false,
  format: 'esm',
  target: 'es2022',
  jsx: 'automatic',
  outfile: join(outDir, 'main.js')
});

await cp(join(sampleDir, 'src', 'index.html'), join(outDir, 'index.html'));
await cp(join(sampleDir, 'src', 'styles.css'), join(outDir, 'styles.css'));
await cp(join(root, 'public'), outDir, { recursive: true });
