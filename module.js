// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs-extra');

try {
  // create module
  fs.removeSync('./module/');
  fs.copySync('./dist/', './module');
  fs.copySync('./prisma/schema.prisma', './module/prisma/schema.prisma');
  fs.copySync('./prisma/migrations', './module/prisma/migrations');
  fs.copySync('./package.json', './module/package.json');
  fs.copySync('./.npmrc', './module/.npmrc');
} catch (err) {
  console.log(err);
}
