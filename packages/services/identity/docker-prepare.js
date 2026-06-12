import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkgPath = join(__dirname, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const rewrittenExports = {};
for (const [key, value] of Object.entries(pkg.exports || {})) {
    if (typeof value === 'string' && value.startsWith('./src/')) {
        rewrittenExports[key] = value.replace(/^\.\/src\//, './dist/src/').replace(/\.ts$/, '.js');
    } else {
        rewrittenExports[key] = value;
    }
}

const productionPkg = {
    ...pkg,
    exports: rewrittenExports,
    main: './dist/src/main.js',
    types: './dist/src/main.d.ts',
};

Reflect.deleteProperty(productionPkg, 'devDependencies');
Reflect.deleteProperty(productionPkg, 'scripts');

const outPath = join(__dirname, 'prod.package.json');
writeFileSync(outPath, JSON.stringify(productionPkg, null, 4) + '\n');
console.log(`Wrote production package.json to ${outPath}`);
