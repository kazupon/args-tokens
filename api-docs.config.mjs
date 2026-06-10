// @ts-check

/** @type {import('vitepress-api-references').OxContentApiDocsOptions} */
export default {
  entryPoints: [{ path: 'src/index.ts' }, { path: 'src/combinators.ts' }],
  outDir: 'docs',
  basePath: '/docs',
  tsconfig: 'tsconfig.json',
  markdown: {
    pathStrategy: 'typedoc',
    renderStyle: 'markdown',
    indexFormat: 'table',
    parametersFormat: 'table',
    interfacePropertiesFormat: 'table',
    classPropertiesFormat: 'table',
    propertyMembersFormat: 'table',
    typeAliasPropertiesFormat: 'table',
    typeDeclarationFormat: 'table',
    enumMembersFormat: 'table',
    renderGeneratedBy: false,
    renderStats: false
  }
}
