// Latest StatGoal app release from the project's GitHub repo (public API, cached 15 min),
// so the site's download buttons follow whatever is released on GitHub.
import { cached, getJson } from '../cache.js';

const repo = () => process.env.GITHUB_REPO || 'Medaliboualleg/statgoal';

export async function latestRelease() {
  return cached(`gh:releases:${repo()}`, 900, async () => {
    const list = await getJson(`https://api.github.com/repos/${repo()}/releases?per_page=10`, { Accept: 'application/vnd.github+json' });
    const r = list.find((x) => !x.draft && x.assets?.some((a) => a.name.endsWith('.apk')));
    const apk = r?.assets.find((a) => a.name.endsWith('.apk'));
    const ipa = r?.assets.find((a) => a.name.endsWith('.ipa'));
    return {
      repoUrl: `https://github.com/${repo()}`,
      version: r?.tag_name ?? null,
      beta: r?.prerelease ?? false,
      publishedAt: r?.published_at ?? null,
      releaseUrl: r?.html_url ?? `https://github.com/${repo()}/releases`,
      android: apk ? { url: apk.browser_download_url, size: apk.size, downloads: apk.download_count } : null,
      ios: ipa ? { url: ipa.browser_download_url, size: ipa.size } : null,
    };
  });
}
