export const NPM_TOOLS = [
  {
    name: 'npm_search',
    description:
      'Search the npm registry for packages by name or keyword. Returns name, description, latest version, and npm link. Use this to discover packages or check if one exists.',
    category: 'npm',
    parameters: {
      query: {
        type: 'string',
        required: !0,
        description: 'Package name or keyword(s) to search for (e.g. "csv parser", "react router")',
      },
      size: {
        type: 'number',
        required: !1,
        description: 'Number of results to return (default: 5, max: 10)',
      },
    },
  },
  {
    name: 'npm_package_info',
    description:
      'Get detailed metadata for an npm package: latest version, description, license, homepage, repository, author, and dependency counts. Use this before adding a package to a project.',
    category: 'npm',
    parameters: {
      name: {
        type: 'string',
        required: !0,
        description: 'Exact npm package name (e.g. "react", "@tanstack/query", "lodash")',
      },
    },
  },
  {
    name: 'npm_package_versions',
    description:
      'List all published versions of an npm package with their release dates, newest first. Useful for finding a specific version or checking how actively a package is maintained.',
    category: 'npm',
    parameters: {
      name: {
        type: 'string',
        required: !0,
        description: 'Exact npm package name',
      },
      limit: {
        type: 'number',
        required: !1,
        description: 'How many recent versions to show (default: 15, max: 30)',
      },
    },
  },
  {
    name: 'npm_package_downloads',
    description:
      'Get download statistics for an npm package over the last week, month, or year. Use this to gauge package popularity and community adoption.',
    category: 'npm',
    parameters: {
      name: {
        type: 'string',
        required: !0,
        description: 'Exact npm package name',
      },
      period: {
        type: 'string',
        required: !1,
        description: '"last-week" (default), "last-month", or "last-year"',
      },
    },
  },
  {
    name: 'npm_compare_packages',
    description:
      'Compare two npm packages side-by-side: version, weekly downloads, license, dependency count, and last publish date. Use this to choose between alternatives (e.g. "axios vs got", "moment vs dayjs").',
    category: 'npm',
    parameters: {
      package_a: {
        type: 'string',
        required: !0,
        description: 'First npm package name',
      },
      package_b: {
        type: 'string',
        required: !0,
        description: 'Second npm package name',
      },
    },
  },
];
