module.exports = {
  plugins: [
    "@trivago/prettier-plugin-sort-imports"
  ],
  singleQuote: true,
  semi: false,
  trailingComma: "none",
  arrowParens: "avoid",
  printWidth: 120,
  importOrder: ["^components/(.*)$", "^[./]" ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true
}
