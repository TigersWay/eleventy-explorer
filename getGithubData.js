require('dotenv').config();

const
  EleventyFetch = require('@11ty/eleventy-fetch'),
  { Octokit } = require('@octokit/core'),
  { paginateGraphql } = require("@octokit/plugin-paginate-graphql"),
  pAll = require('p-all'),
  { green, red } = require('colorette'),
  { writeFile } = require('fs/promises'),

  octokit = new (Octokit.plugin(paginateGraphql))({ auth: process.env.GH_ACCESS_TOKEN });

const wait = (s = 1, value = s) => new Promise(resolve => setTimeout(() => resolve(value), s * 1000));

const getRepos = async (query) => {
  try {
    const results = await octokit.graphql.paginate(
      `query ($queryStr: String!, $cursor: String) {
        search(query: $queryStr, type: REPOSITORY, first: 100, after: $cursor) {
          nodes {
            ...on Repository {
              nameWithOwner
              name
              description
              descriptionHTML
              url
              owner { login, url, avatarUrl }
              createdAt
              updatedAt
              pushedAt
              license: licenseInfo { name, spdxId }
              topics: repositoryTopics(first: 30) { nodes { topic { name } }, totalCount }
              languages(first:12) { nodes { name, color }, totalCount }
              forkCount
              stargazerCount
              isFork
              isTemplate
              isArchived
              usesCustomOpenGraphImage
              openGraphImageUrl
            }
          }
          repositoryCount
          pageInfo {
            hasNextPage
            endCursor
          }
        }
        rateLimit { limit, cost, remaining, resetAt }
      }`,
      { queryStr: query }
    );
    console.log(`  "${query}" : ${results.search.nodes.length}`);
    await wait(12);  // So far, impossible to be free of the "second rate limit", but ~= 2 seconds/page seems to make it work!
    return results.search.nodes;
  } catch (e) {
    Promise.reject(`[${e.status}] ${e.response.data.message}`);
  };
};

const getAllRepos = async () => {

  const assets = new EleventyFetch.AssetCache('github-repos');
  if (assets.isCacheValid('6d')) return {
    repos: await assets.getCachedValue(),
    cachedAt: new Date(assets.cache._persisted[assets.hash].cachedAt).toISOString()
  };

  const now = (new Date()).toJSON();

  // @octokit won't return more than 1000 objects, we need to split our request
  let repos = await pAll([
    () => getRepos('topic:eleventy stars:>0'),
    () => getRepos('topic:eleventy stars:<1'),
    () => getRepos('topic:11ty -topic:eleventy')
  ], { concurrency: 1 }) // It seems impossible to run them simultaneously on Netlify! The famous "second rate limit".
    .then(values => values.flat());

  // And now: cleaning, flattening & sorting all these repositories
  repos = [...new Map(repos.map(repo => [repo.nameWithOwner, repo])).values()];
  repos.forEach(repo => {
    // Topics
    if (repo.topics.totalCount > 30) console.log(red(`${repo.nameWithOwner} has ${repo.topics.totalCount} topics!`));
    repo.topics = repo.topics.nodes.map(o => o.topic.name);
    // Languages
    if (repo.languages.totalCount > 12) console.log(red(`${repo.nameWithOwner} has ${repo.languages.totalCount} languages!`));
    repo.languages = repo.languages.nodes;
    // Search
    repo.search = repo.topics.join(' ') + ' ' + repo.description?.toLowerCase();
  });
  // Default sorting: stargazerCount DESC + pushedAt DESC
  repos.sort((a, b) => (b.stargazerCount - a.stargazerCount || -a.pushedAt.localeCompare(b.pushedAt)));

  assets.save(repos, 'json');
  return { repos, cachedAt: new Date().toISOString() };
};


(async () => {

  console.log(green('--- Get Eleventy related repositories'));
  const { repos, cachedAt } = await getAllRepos();
  await writeFile('./site/_data/repos.json', JSON.stringify(repos, null, 2));
  await writeFile('./site/_data/github.json', JSON.stringify({ cachedAt }, null, 2)); // Keep fetch time

  console.log();

})();
