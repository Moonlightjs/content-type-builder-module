import * as moduleAlias from 'module-alias';
moduleAlias.addAliases({
  '@modules': `${__dirname}/modules`,
  '@src': `${__dirname}`,
});
export * from './modules';
