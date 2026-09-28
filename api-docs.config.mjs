// @ts-check

/** @type {import('vitepress-api-references').OxContentApiDocsOptions} */
export default {
  entryPoints: [{ path: 'src/index.ts' }, { path: 'src/combinators.ts' }],
  outDir: 'docs',
  basePath: '/docs',
  tsconfig: 'tsconfig.json',
  extraction: {
    // describe the type parameters of each signature in a table, from `@typeParam`. Without it,
    // `@typeParam` is a plain tag, and only the first tag of a name is kept
    typeParameters: true
  },
  // the title of a generic type has its type parameters, such as `ArgValues<T>`: escape `<` and
  // `>`, or GitHub reads them as HTML and drops them
  escapeHeadingAngleBrackets: true,
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
