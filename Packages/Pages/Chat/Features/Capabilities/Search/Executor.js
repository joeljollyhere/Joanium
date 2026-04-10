import { createExecutor } from '../Shared/createExecutor.js';
import { safeJson } from '../Shared/Utils.js';
import { toolsList } from './ToolsList.js';

export const { handles, execute } = createExecutor({
  name: 'SearchExecutor',
  tools: toolsList,
  handlers: {
    // ─────────────────────────────────────────────────────────────────
    // ORIGINAL HANDLERS
    // ─────────────────────────────────────────────────────────────────

    // DuckDuckGo
    search_web: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🔍 Searching the web for "${query}"…`);

      const data = await safeJson(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=0`,
      );

      const lines = [`🔍 Web Search: "${query}"`, ''];

      if (data.AbstractText) {
        lines.push(`**Answer:**`);
        lines.push(data.AbstractText);
        if (data.AbstractSource)
          lines.push(`Source: ${data.AbstractSource} — ${data.AbstractURL || ''}`);
        lines.push('');
      }

      if (data.Answer && data.Answer !== data.AbstractText) {
        lines.push(`**Instant Answer:** ${data.Answer}`);
        lines.push('');
      }

      if (data.Definition) {
        lines.push(`**Definition:** ${data.Definition}`);
        if (data.DefinitionSource) lines.push(`Source: ${data.DefinitionSource}`);
        lines.push('');
      }

      const infobox = data.Infobox?.content ?? [];
      if (infobox.length > 0) {
        lines.push('**Key Facts:**');
        infobox.slice(0, 8).forEach((item) => {
          if (item.label && item.value) lines.push(`  • ${item.label}: ${item.value}`);
        });
        lines.push('');
      }

      const related = (data.RelatedTopics ?? []).filter((t) => t.Text && t.FirstURL);
      if (related.length > 0) {
        lines.push('**Related Topics:**');
        related.slice(0, 6).forEach((t, i) => {
          const text = t.Text.slice(0, 120) + (t.Text.length > 120 ? '…' : '');
          lines.push(`  ${i + 1}. ${text}`);
          lines.push(`     🔗 ${t.FirstURL}`);
        });
        lines.push('');
      }

      const results = (data.Results ?? []).filter((r) => r.Text && r.FirstURL);
      if (results.length > 0) {
        lines.push('**Top Results:**');
        results.slice(0, 4).forEach((r, i) => {
          lines.push(`  ${i + 1}. ${r.Text.slice(0, 100)}`);
          lines.push(`     🔗 ${r.FirstURL}`);
        });
        lines.push('');
      }

      if (lines.length <= 2) {
        lines.push(
          `No instant answer found for "${query}".`,
          '',
          `Try searching directly at: https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        );
      } else {
        lines.push(`Source: DuckDuckGo Instant Answers (duckduckgo.com)`);
      }

      return lines.join('\n');
    },

    // npm
    search_npm: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`📦 Searching npm for "${query}"…`);

      const data = await safeJson(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=5`,
      );

      const lines = [`📦 npm Search: "${query}"`, ''];

      const objects = data.objects ?? [];
      if (objects.length === 0) {
        lines.push(`No npm packages found for "${query}".`);
        lines.push(`🔗 https://www.npmjs.com/search?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      objects.forEach((obj, i) => {
        const p = obj.package;
        lines.push(`**${i + 1}. ${p.name}** — v${p.version}`);
        if (p.description) lines.push(`   ${p.description}`);

        const downloads = obj.downloads?.monthly;
        if (downloads != null) lines.push(`   📥 ${downloads.toLocaleString()} downloads/month`);

        const author = p.author?.name ?? p.publisher?.username;
        if (author) lines.push(`   👤 ${author}`);

        const keywords = (p.keywords ?? []).slice(0, 5).join(', ');
        if (keywords) lines.push(`   🏷  ${keywords}`);

        lines.push(`   🔗 https://www.npmjs.com/package/${p.name}`);
        lines.push('');
      });

      lines.push(`Source: npmjs.org`);
      return lines.join('\n');
    },

    // PyPI
    search_pypi: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🐍 Searching PyPI for "${query}"…`);

      const data = await safeJson(`https://pypi.org/pypi/${encodeURIComponent(query)}/json`).catch(
        () => null,
      );

      const lines = [`🐍 PyPI Search: "${query}"`, ''];

      if (!data) {
        lines.push(`No exact PyPI match for "${query}".`);
        lines.push(`🔗 Try: https://pypi.org/search/?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      const info = data.info;
      lines.push(`**${info.name}** — v${info.version}`);
      if (info.summary) lines.push(`${info.summary}`);
      lines.push('');

      if (info.author) lines.push(`👤 **Author:** ${info.author}`);
      if (info.license) lines.push(`📄 **License:** ${info.license}`);
      if (info.requires_python) lines.push(`🐍 **Requires Python:** ${info.requires_python}`);

      const keywords = info.keywords
        ?.split(/[,\s]+/)
        .filter(Boolean)
        .slice(0, 6)
        .join(', ');
      if (keywords) lines.push(`🏷  **Keywords:** ${keywords}`);

      lines.push('');
      lines.push(`🔗 **PyPI:** ${info.package_url}`);
      if (info.home_page) lines.push(`🏠 **Homepage:** ${info.home_page}`);
      if (info.docs_url) lines.push(`📚 **Docs:** ${info.docs_url}`);

      lines.push('');
      lines.push(`Source: pypi.org`);
      return lines.join('\n');
    },

    // Crates.io
    search_crates: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🦀 Searching crates.io for "${query}"…`);

      const data = await safeJson(
        `https://crates.io/api/v1/crates?q=${encodeURIComponent(query)}&per_page=5`,
        { headers: { 'User-Agent': 'search-tool/1.0' } },
      );

      const lines = [`🦀 Crates.io Search: "${query}"`, ''];

      const crates = data.crates ?? [];
      if (crates.length === 0) {
        lines.push(`No crates found for "${query}".`);
        lines.push(`🔗 https://crates.io/search?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      crates.forEach((c, i) => {
        lines.push(`**${i + 1}. ${c.name}** — v${c.newest_version}`);
        if (c.description) lines.push(`   ${c.description}`);
        lines.push(`   📥 ${Number(c.downloads).toLocaleString()} total downloads`);

        const updated = c.updated_at ? new Date(c.updated_at).toLocaleDateString() : null;
        if (updated) lines.push(`   🕒 Updated: ${updated}`);

        lines.push(`   🔗 https://crates.io/crates/${c.name}`);
        lines.push(`   📚 https://docs.rs/${c.name}`);
        lines.push('');
      });

      lines.push(`Source: crates.io`);
      return lines.join('\n');
    },

    // Docker Hub
    search_docker: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🐳 Searching Docker Hub for "${query}"…`);

      const data = await safeJson(
        `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=5`,
      );

      const lines = [`🐳 Docker Hub Search: "${query}"`, ''];

      const results = data.results ?? [];
      if (results.length === 0) {
        lines.push(`No Docker images found for "${query}".`);
        lines.push(`🔗 https://hub.docker.com/search?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      results.forEach((r, i) => {
        const name = r.repo_name ?? r.name;
        const official = r.is_official ? ' ✅ Official' : '';
        lines.push(`**${i + 1}. ${name}**${official}`);
        if (r.short_description) lines.push(`   ${r.short_description}`);
        lines.push(
          `   ⭐ ${Number(r.star_count ?? 0).toLocaleString()} stars  📥 ${Number(r.pull_count ?? 0).toLocaleString()} pulls`,
        );
        lines.push(`   🔗 https://hub.docker.com/r/${name}`);
        lines.push('');
      });

      lines.push(`Source: hub.docker.com`);
      return lines.join('\n');
    },

    // arXiv
    search_arxiv: async (params, onStage) => {
      const { query, max_results = 5 } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      const limit = Math.min(Number(max_results) || 5, 10);
      onStage(`📄 Searching arXiv for "${query}"…`);

      const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}`;
      const xml = await fetch(url).then((r) => r.text());

      const lines = [`📄 arXiv Search: "${query}"`, ''];

      const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

      if (entries.length === 0) {
        lines.push(`No arXiv papers found for "${query}".`);
        lines.push(
          `🔗 https://arxiv.org/search/?searchtype=all&query=${encodeURIComponent(query)}`,
        );
        return lines.join('\n');
      }

      entries.forEach((match, i) => {
        const entry = match[1];

        const title = (entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')
          .replace(/\s+/g, ' ')
          .trim();
        const summary = (entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? '')
          .replace(/\s+/g, ' ')
          .trim();
        const id = (entry.match(/<id>(.*?)<\/id>/)?.[1] ?? '').trim();
        const arxivId = id
          .replace('http://arxiv.org/abs/', '')
          .replace('https://arxiv.org/abs/', '');
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1]?.slice(0, 10) ?? '';

        const authors = [...entry.matchAll(/<name>(.*?)<\/name>/g)]
          .map((m) => m[1].trim())
          .slice(0, 3)
          .join(', ');

        lines.push(`**${i + 1}. ${title}**`);
        if (authors) lines.push(`   👤 ${authors}${entries.length > 3 ? ' et al.' : ''}`);
        if (published) lines.push(`   📅 ${published}`);
        if (summary) lines.push(`   ${summary.slice(0, 200)}${summary.length > 200 ? '…' : ''}`);
        if (arxivId) {
          lines.push(`   🔗 https://arxiv.org/abs/${arxivId}`);
          lines.push(`   📥 https://arxiv.org/pdf/${arxivId}.pdf`);
        }
        lines.push('');
      });

      lines.push(`Source: arxiv.org`);
      return lines.join('\n');
    },

    // Open Library (Books)
    search_books: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`📚 Searching Open Library for "${query}"…`);

      const data = await safeJson(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=key,title,author_name,first_publish_year,edition_count,subject,isbn`,
      );

      const lines = [`📚 Books Search: "${query}"`, ''];

      const docs = data.docs ?? [];
      if (docs.length === 0) {
        lines.push(`No books found for "${query}".`);
        lines.push(`🔗 https://openlibrary.org/search?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      docs.forEach((book, i) => {
        lines.push(`**${i + 1}. ${book.title}**`);

        const authors = (book.author_name ?? []).slice(0, 3).join(', ');
        if (authors) lines.push(`   👤 ${authors}`);

        if (book.first_publish_year)
          lines.push(`   📅 First published: ${book.first_publish_year}`);
        if (book.edition_count) lines.push(`   📖 ${book.edition_count} editions`);

        const subjects = (book.subject ?? []).slice(0, 4).join(', ');
        if (subjects) lines.push(`   🏷  ${subjects}`);

        if (book.key) lines.push(`   🔗 https://openlibrary.org${book.key}`);
        lines.push('');
      });

      lines.push(`Source: openlibrary.org`);
      return lines.join('\n');
    },

    // Movies (OMDB)
    search_movies: async (params, onStage) => {
      const { query, type } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🎬 Searching for "${query}"…`);

      const apiKey = process.env.OMDB_API_KEY ?? 'trilogy';
      const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';

      const searchData = await safeJson(
        `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}${typeParam}`,
      );

      const lines = [`🎬 Movie/Show Search: "${query}"`, ''];

      if (searchData.Response === 'False') {
        lines.push(`No results found: ${searchData.Error ?? 'Unknown error'}`);
        return lines.join('\n');
      }

      const results = (searchData.Search ?? []).slice(0, 5);

      const top = results[0];
      if (top?.imdbID) {
        const detail = await safeJson(
          `https://www.omdbapi.com/?i=${top.imdbID}&apikey=${apiKey}&plot=short`,
        );

        if (detail.Response !== 'False') {
          lines.push(`**${detail.Title}** (${detail.Year})`);
          lines.push(`   🎭 ${detail.Type}  •  ⭐ IMDb: ${detail.imdbRating}  •  ${detail.Rated}`);
          if (detail.Genre) lines.push(`   🏷  ${detail.Genre}`);
          if (detail.Director && detail.Director !== 'N/A')
            lines.push(`   🎬 Director: ${detail.Director}`);
          if (detail.Actors && detail.Actors !== 'N/A') lines.push(`   👤 Cast: ${detail.Actors}`);
          if (detail.Plot && detail.Plot !== 'N/A') lines.push(`   📝 ${detail.Plot}`);
          if (detail.Runtime && detail.Runtime !== 'N/A') lines.push(`   ⏱  ${detail.Runtime}`);
          lines.push(`   🔗 https://www.imdb.com/title/${detail.imdbID}/`);
          lines.push('');
        }
      }

      if (results.length > 1) {
        lines.push('**Also found:**');
        results.slice(1).forEach((r, i) => {
          lines.push(
            `  ${i + 2}. ${r.Title} (${r.Year}) — ${r.Type}  🔗 https://www.imdb.com/title/${r.imdbID}/`,
          );
        });
        lines.push('');
      }

      lines.push(`Source: omdbapi.com`);
      return lines.join('\n');
    },

    // Product Hunt
    search_producthunt: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🚀 Searching Product Hunt for "${query}"…`);

      const data = await safeJson(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' site:producthunt.com')}&format=json&no_redirect=1&no_html=1`,
      );

      const lines = [`🚀 Product Hunt Search: "${query}"`, ''];

      const related = (data.RelatedTopics ?? []).filter(
        (t) => t.Text && t.FirstURL && t.FirstURL.includes('producthunt.com'),
      );

      if (related.length === 0) {
        lines.push(`No Product Hunt results found for "${query}".`);
        lines.push(`🔗 https://www.producthunt.com/search?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      related.slice(0, 6).forEach((t, i) => {
        lines.push(`**${i + 1}.** ${t.Text.slice(0, 140)}${t.Text.length > 140 ? '…' : ''}`);
        lines.push(`   🔗 ${t.FirstURL}`);
        lines.push('');
      });

      lines.push(`Source: producthunt.com`);
      return lines.join('\n');
    },

    // CVE Security Advisories
    search_cve: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🔒 Searching CVE database for "${query}"…`);

      const lines = [`🔒 CVE Search: "${query}"`, ''];

      const isCveId = /^CVE-\d{4}-\d+$/i.test(query.trim());

      if (isCveId) {
        const cveId = query.trim().toUpperCase();
        const data = await safeJson(
          `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cveId)}`,
        );

        const vuln = data.vulnerabilities?.[0]?.cve;
        if (!vuln) {
          lines.push(`CVE "${cveId}" not found.`);
          return lines.join('\n');
        }

        const desc = vuln.descriptions?.find((d) => d.lang === 'en')?.value ?? 'No description';
        const cvssV3 =
          vuln.metrics?.cvssMetricV31?.[0]?.cvssData ?? vuln.metrics?.cvssMetricV30?.[0]?.cvssData;
        const published = vuln.published?.slice(0, 10);
        const modified = vuln.lastModified?.slice(0, 10);

        lines.push(`**${cveId}**`);
        if (published) lines.push(`📅 Published: ${published}  •  Modified: ${modified}`);

        if (cvssV3) {
          const severity = cvssV3.baseSeverity ?? '';
          const score = cvssV3.baseScore ?? '';
          const vector = cvssV3.vectorString ?? '';
          lines.push(`⚠️  CVSS v3: ${score} (${severity})  •  ${vector}`);
        }

        lines.push('');
        lines.push(`📝 ${desc}`);
        lines.push('');

        const refs = (vuln.references ?? []).slice(0, 3);
        if (refs.length > 0) {
          lines.push('**References:**');
          refs.forEach((r) => lines.push(`  🔗 ${r.url}`));
        }

        lines.push('');
        lines.push(`🔗 https://nvd.nist.gov/vuln/detail/${cveId}`);
      } else {
        const data = await safeJson(
          `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(query)}&resultsPerPage=5`,
        ).catch(() => null);

        const vulns = data?.vulnerabilities ?? [];
        if (vulns.length === 0) {
          lines.push(`No CVEs found for "${query}".`);
          lines.push(
            `🔗 https://nvd.nist.gov/vuln/search/results?query=${encodeURIComponent(query)}`,
          );
          return lines.join('\n');
        }

        lines.push(
          `Found ${data.totalResults?.toLocaleString() ?? vulns.length} total CVEs — showing top ${vulns.length}:`,
        );
        lines.push('');

        vulns.forEach((v, i) => {
          const cve = v.cve;
          const id = cve.id;
          const desc = (cve.descriptions?.find((d) => d.lang === 'en')?.value ?? '').slice(0, 180);
          const cvss =
            cve.metrics?.cvssMetricV31?.[0]?.cvssData ?? cve.metrics?.cvssMetricV30?.[0]?.cvssData;
          const date = cve.published?.slice(0, 10);

          lines.push(`**${i + 1}. ${id}**${date ? `  (${date})` : ''}`);
          if (cvss) lines.push(`   ⚠️  CVSS: ${cvss.baseScore} ${cvss.baseSeverity}`);
          if (desc) lines.push(`   ${desc}${desc.length >= 180 ? '…' : ''}`);
          lines.push(`   🔗 https://nvd.nist.gov/vuln/detail/${id}`);
          lines.push('');
        });
      }

      lines.push(`Source: nvd.nist.gov`);
      return lines.join('\n');
    },

    // Wayback Machine
    search_wayback: async (params, onStage) => {
      const { url, timestamp } = params;
      if (!url?.trim()) throw new Error('Missing required param: url');

      onStage(`🕰️ Checking Wayback Machine for "${url}"…`);

      const tsParam = timestamp ? `&timestamp=${timestamp}` : '';
      const data = await safeJson(
        `https://archive.org/wayback/available?url=${encodeURIComponent(url)}${tsParam}`,
      );

      const lines = [`🕰️ Wayback Machine: "${url}"`, ''];

      const snapshot = data.archived_snapshots?.closest;

      if (!snapshot?.available) {
        lines.push(`No archived snapshots found for this URL.`);
        lines.push(`🔗 Try searching manually: https://web.archive.org/web/*/${url}`);
        return lines.join('\n');
      }

      const ts = snapshot.timestamp ?? '';
      const year = ts.slice(0, 4);
      const month = ts.slice(4, 6);
      const day = ts.slice(6, 8);
      const hour = ts.slice(8, 10);
      const min = ts.slice(10, 12);
      const sec = ts.slice(12, 14);

      const humanDate = ts ? `${year}-${month}-${day} ${hour}:${min}:${sec} UTC` : 'Unknown';

      const statusEmoji =
        snapshot.status === '200'
          ? '✅'
          : snapshot.status === '301' || snapshot.status === '302'
            ? '↪️'
            : '⚠️';

      lines.push(`✅ Snapshot found!`);
      lines.push(`📅 **Archived on:** ${humanDate}`);
      lines.push(`${statusEmoji} **HTTP Status:** ${snapshot.status}`);
      lines.push('');
      lines.push(`🔗 **View archived page:**`);
      lines.push(`   ${snapshot.url}`);
      lines.push('');
      lines.push(`📂 **All snapshots for this URL:**`);
      lines.push(`   https://web.archive.org/web/*/${url}`);
      lines.push('');
      lines.push(`Source: archive.org / Wayback Machine`);

      return lines.join('\n');
    },

    // ─────────────────────────────────────────────────────────────────
    // NEW HANDLERS — PACKAGE REGISTRIES
    // ─────────────────────────────────────────────────────────────────

    // Maven Central (Java / Kotlin / Scala)
    search_maven: async (params, onStage) => {
      const { query, max_results = 5 } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      const limit = Math.min(Number(max_results) || 5, 10);
      onStage(`☕ Searching Maven Central for "${query}"…`);

      const data = await safeJson(
        `https://search.maven.org/solrsearch/select?q=${encodeURIComponent(query)}&rows=${limit}&wt=json`,
      );

      const lines = [`☕ Maven Central Search: "${query}"`, ''];

      const docs = data.response?.docs ?? [];
      if (docs.length === 0) {
        lines.push(`No Maven artifacts found for "${query}".`);
        lines.push(`🔗 https://search.maven.org/search?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      docs.forEach((doc, i) => {
        const coord = `${doc.g}:${doc.a}`;
        lines.push(`**${i + 1}. ${coord}** — v${doc.latestVersion}`);
        if (doc.repositoryId) lines.push(`   🗄  Repository: ${doc.repositoryId}`);
        lines.push(`   📅 Last updated: ${new Date(doc.timestamp).toLocaleDateString()}`);
        lines.push(`   📦 Versions available: ${(doc.versionCount ?? 0).toLocaleString()}`);
        lines.push('');
        lines.push(`   **Maven (pom.xml):**`);
        lines.push(`   \`\`\`xml`);
        lines.push(`   <dependency>`);
        lines.push(`     <groupId>${doc.g}</groupId>`);
        lines.push(`     <artifactId>${doc.a}</artifactId>`);
        lines.push(`     <version>${doc.latestVersion}</version>`);
        lines.push(`   </dependency>`);
        lines.push(`   \`\`\``);
        lines.push(`   **Gradle:** \`implementation '${coord}:${doc.latestVersion}'\``);
        lines.push(`   🔗 https://search.maven.org/artifact/${doc.g}/${doc.a}`);
        lines.push('');
      });

      lines.push(`Source: search.maven.org`);
      return lines.join('\n');
    },

    // NuGet (.NET / C#)
    search_nuget: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🟣 Searching NuGet for "${query}"…`);

      const data = await safeJson(
        `https://azuresearch-usnc.nuget.org/query?q=${encodeURIComponent(query)}&take=5&prerelease=false`,
      );

      const lines = [`🟣 NuGet Search: "${query}"`, ''];

      const pkgs = data.data ?? [];
      if (pkgs.length === 0) {
        lines.push(`No NuGet packages found for "${query}".`);
        lines.push(`🔗 https://www.nuget.org/packages?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      pkgs.forEach((p, i) => {
        lines.push(`**${i + 1}. ${p.id}** — v${p.version}`);
        if (p.description)
          lines.push(`   ${p.description.slice(0, 150)}${p.description.length > 150 ? '…' : ''}`);

        const authors = Array.isArray(p.authors) ? p.authors.slice(0, 3).join(', ') : p.authors;
        if (authors) lines.push(`   👤 ${authors}`);

        if (p.totalDownloads != null)
          lines.push(`   📥 ${Number(p.totalDownloads).toLocaleString()} total downloads`);

        const tags = (p.tags ?? []).slice(0, 5).join(', ');
        if (tags) lines.push(`   🏷  ${tags}`);

        lines.push(`   📋 **Install:** \`dotnet add package ${p.id}\``);
        lines.push(`   🔗 https://www.nuget.org/packages/${p.id}`);
        lines.push('');
      });

      lines.push(`Source: nuget.org`);
      return lines.join('\n');
    },

    // Packagist (PHP / Composer)
    search_packagist: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🐘 Searching Packagist for "${query}"…`);

      const data = await safeJson(
        `https://packagist.org/search.json?q=${encodeURIComponent(query)}&per_page=5`,
      );

      const lines = [`🐘 Packagist Search: "${query}"`, ''];

      const results = data.results ?? [];
      if (results.length === 0) {
        lines.push(`No Composer packages found for "${query}".`);
        lines.push(`🔗 https://packagist.org/?query=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      results.forEach((p, i) => {
        lines.push(`**${i + 1}. ${p.name}**`);
        if (p.description)
          lines.push(`   ${p.description.slice(0, 150)}${p.description.length > 150 ? '…' : ''}`);
        if (p.downloads != null)
          lines.push(`   📥 ${Number(p.downloads).toLocaleString()} total downloads`);
        if (p.favers != null) lines.push(`   ⭐ ${Number(p.favers).toLocaleString()} stars`);
        lines.push(`   📋 **Install:** \`composer require ${p.name}\``);
        lines.push(`   🔗 https://packagist.org/packages/${p.name}`);
        lines.push('');
      });

      lines.push(`Source: packagist.org`);
      return lines.join('\n');
    },

    // RubyGems (Ruby)
    search_rubygems: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`💎 Searching RubyGems for "${query}"…`);

      const gems = await safeJson(
        `https://rubygems.org/api/v1/search.json?query=${encodeURIComponent(query)}&per_page=5`,
      );

      const lines = [`💎 RubyGems Search: "${query}"`, ''];

      if (!Array.isArray(gems) || gems.length === 0) {
        lines.push(`No gems found for "${query}".`);
        lines.push(`🔗 https://rubygems.org/search?query=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      gems.slice(0, 5).forEach((g, i) => {
        lines.push(`**${i + 1}. ${g.name}** — v${g.version}`);
        if (g.info) lines.push(`   ${g.info.slice(0, 150)}${g.info.length > 150 ? '…' : ''}`);

        const authors = g.authors;
        if (authors) lines.push(`   👤 ${authors}`);

        if (g.downloads != null)
          lines.push(`   📥 ${Number(g.downloads).toLocaleString()} total downloads`);

        if (g.licenses?.length) lines.push(`   📄 License: ${g.licenses.join(', ')}`);

        lines.push(`   📋 **Install:** \`gem install ${g.name}\``);
        lines.push(`   📋 **Gemfile:** \`gem '${g.name}'\``);
        lines.push(`   🔗 https://rubygems.org/gems/${g.name}`);
        if (g.homepage_uri) lines.push(`   🏠 ${g.homepage_uri}`);
        lines.push('');
      });

      lines.push(`Source: rubygems.org`);
      return lines.join('\n');
    },

    // pub.dev (Dart / Flutter)
    search_pub: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🎯 Searching pub.dev for "${query}"…`);

      const data = await safeJson(
        `https://pub.dev/api/search?q=${encodeURIComponent(query)}&per_page=5`,
      );

      const lines = [`🎯 pub.dev Search: "${query}"`, ''];

      const packages = data.packages ?? [];
      if (packages.length === 0) {
        lines.push(`No Dart/Flutter packages found for "${query}".`);
        lines.push(`🔗 https://pub.dev/packages?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      // Fetch details for each result (pub.dev search only returns names)
      await Promise.all(
        packages.slice(0, 5).map(async (p, i) => {
          const detail = await safeJson(`https://pub.dev/api/packages/${p.package}`).catch(
            () => null,
          );
          const info = detail?.latest?.pubspec ?? {};
          const score = detail?.score ?? {};

          lines.push(`**${i + 1}. ${p.package}** — v${info.version ?? '?'}`);
          if (info.description) lines.push(`   ${info.description.slice(0, 150)}`);
          if (detail?.latest?.published)
            lines.push(`   📅 Published: ${detail.latest.published.slice(0, 10)}`);
          if (score.grantedPoints != null)
            lines.push(
              `   🏆 Pub points: ${score.grantedPoints}/${score.maxPoints ?? 160}  •  Popularity: ${Math.round((score.popularityScore ?? 0) * 100)}%`,
            );
          lines.push(`   📋 **pubspec.yaml:** \`${p.package}: ^${info.version ?? ''}\``);
          lines.push(`   🔗 https://pub.dev/packages/${p.package}`);
          lines.push('');
        }),
      );

      lines.push(`Source: pub.dev`);
      return lines.join('\n');
    },

    // Hex.pm (Elixir / Erlang)
    search_hex: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`💧 Searching Hex.pm for "${query}"…`);

      const data = await safeJson(
        `https://hex.pm/api/packages?search=${encodeURIComponent(query)}&sort=recent_downloads&page=1`,
        { headers: { 'User-Agent': 'search-tool/1.0' } },
      );

      const lines = [`💧 Hex.pm Search: "${query}"`, ''];

      const pkgs = Array.isArray(data) ? data.slice(0, 5) : [];
      if (pkgs.length === 0) {
        lines.push(`No Hex packages found for "${query}".`);
        lines.push(`🔗 https://hex.pm/packages?search=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      pkgs.forEach((p, i) => {
        const latest = p.releases?.[0] ?? {};
        lines.push(`**${i + 1}. ${p.name}** — v${latest.version ?? '?'}`);
        if (p.meta?.description) lines.push(`   ${p.meta.description.slice(0, 150)}`);
        if (p.downloads?.all != null)
          lines.push(`   📥 ${Number(p.downloads.all).toLocaleString()} total downloads`);

        const licenses = (p.meta?.licenses ?? []).join(', ');
        if (licenses) lines.push(`   📄 License: ${licenses}`);

        const links = p.meta?.links ?? {};
        if (links.GitHub) lines.push(`   🐙 ${links.GitHub}`);

        lines.push(`   📋 **mix.exs:** \`{:${p.name}, "~> ${latest.version ?? ''}"}\``);
        lines.push(`   🔗 https://hex.pm/packages/${p.name}`);
        lines.push(`   📚 https://hexdocs.pm/${p.name}`);
        lines.push('');
      });

      lines.push(`Source: hex.pm`);
      return lines.join('\n');
    },

    // Hackage (Haskell) — DuckDuckGo scoped + direct package API
    search_hackage: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`λ Searching Hackage for "${query}"…`);

      const lines = [`λ Hackage Search: "${query}"`, ''];

      // Try exact package info first
      const exact = await safeJson(
        `https://hackage.haskell.org/package/${encodeURIComponent(query)}.json`,
      ).catch(() => null);

      if (exact) {
        const versions = Object.keys(exact).sort().reverse();
        const latest = versions[0];
        lines.push(`**${query}** — v${latest}`);
        const normalDeprecated = exact[latest]?.normal ?? exact[latest];
        if (normalDeprecated?.synopsis) lines.push(`   ${normalDeprecated.synopsis}`);
        lines.push(`   📦 ${versions.length} versions available`);
        lines.push(`   📋 **cabal:** \`build-depends: ${query} >= ${latest}\``);
        lines.push(`   📋 **stack / package.yaml:** \`- ${query}\``);
        lines.push(`   🔗 https://hackage.haskell.org/package/${query}`);
        lines.push(`   📚 https://hackage.haskell.org/package/${query}/docs`);
      } else {
        // Fall back to DuckDuckGo scoped search
        const ddg = await safeJson(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' site:hackage.haskell.org')}&format=json&no_redirect=1&no_html=1`,
        );

        const related = (ddg.RelatedTopics ?? []).filter(
          (t) => t.Text && t.FirstURL?.includes('hackage.haskell.org'),
        );

        if (related.length === 0) {
          lines.push(`No Hackage results for "${query}".`);
          lines.push(
            `🔗 https://hackage.haskell.org/packages/search?terms=${encodeURIComponent(query)}`,
          );
          return lines.join('\n');
        }

        related.slice(0, 5).forEach((t, i) => {
          lines.push(`**${i + 1}.** ${t.Text.slice(0, 140)}${t.Text.length > 140 ? '…' : ''}`);
          lines.push(`   🔗 ${t.FirstURL}`);
          lines.push('');
        });
      }

      lines.push('');
      lines.push(`Source: hackage.haskell.org`);
      return lines.join('\n');
    },

    // MetaCPAN (Perl / CPAN)
    search_cpan: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🐪 Searching CPAN for "${query}"…`);

      const data = await safeJson(
        `https://fastapi.metacpan.org/v1/search?q=${encodeURIComponent(query)}&size=5`,
      ).catch(() => null);

      const lines = [`🐪 MetaCPAN Search: "${query}"`, ''];

      const hits = data?.hits?.hits ?? [];
      if (hits.length === 0) {
        lines.push(`No CPAN modules found for "${query}".`);
        lines.push(`🔗 https://metacpan.org/search?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      hits.forEach((hit, i) => {
        const src = hit._source ?? {};
        const name = src.module?.[0]?.name ?? src.name ?? src.distribution ?? 'Unknown';
        lines.push(`**${i + 1}. ${name}**`);
        if (src.abstract) lines.push(`   ${src.abstract.slice(0, 150)}`);
        if (src.author) lines.push(`   👤 ${src.author}`);
        if (src.version) lines.push(`   🏷  v${src.version}`);
        if (src.distribution) {
          lines.push(
            `   📋 **Install:** \`cpan ${src.distribution}\`  or  \`cpanm ${src.distribution}\``,
          );
          lines.push(`   🔗 https://metacpan.org/dist/${src.distribution}`);
        }
        lines.push('');
      });

      lines.push(`Source: metacpan.org`);
      return lines.join('\n');
    },

    // Anaconda / conda-forge
    search_conda: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🐍🔬 Searching conda-forge for "${query}"…`);

      // Try conda-forge repodata search via Anaconda.org API
      const data = await safeJson(
        `https://api.anaconda.org/search?name=${encodeURIComponent(query)}&type=conda&limit=5`,
      ).catch(() => null);

      const lines = [`🔬 Conda Search: "${query}"`, ''];

      const pkgs = Array.isArray(data) ? data.slice(0, 5) : [];

      if (pkgs.length === 0) {
        lines.push(`No conda packages found for "${query}".`);
        lines.push(`🔗 https://anaconda.org/search?q=${encodeURIComponent(query)}`);
        lines.push(`🔗 https://conda-forge.org/packages/ (conda-forge)`);
        return lines.join('\n');
      }

      pkgs.forEach((p, i) => {
        const channel = p.channel ?? p.owner?.login ?? 'unknown';
        lines.push(`**${i + 1}. ${p.name}** (${channel})`);
        if (p.summary) lines.push(`   ${p.summary.slice(0, 150)}`);
        if (p.latest_version) lines.push(`   🏷  Latest: v${p.latest_version}`);
        if (p.conda_platforms?.length)
          lines.push(`   💻 Platforms: ${p.conda_platforms.slice(0, 4).join(', ')}`);

        lines.push(`   📋 **Install:** \`conda install -c ${channel} ${p.name}\``);
        if (channel === 'conda-forge')
          lines.push(`   📋 **or:** \`conda install -c conda-forge ${p.name}\``);
        lines.push(`   🔗 https://anaconda.org/${channel}/${p.name}`);
        lines.push('');
      });

      lines.push(`Source: anaconda.org`);
      return lines.join('\n');
    },

    // Swift Package Index
    search_swift: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🍎 Searching Swift Package Index for "${query}"…`);

      // SPI has a search API (unofficial but stable)
      const data = await safeJson(
        `https://swiftpackageindex.com/api/search?query=${encodeURIComponent(query)}`,
      ).catch(() => null);

      const lines = [`🍎 Swift Package Index: "${query}"`, ''];

      const results = data?.results ?? data?.packages ?? [];

      if (results.length === 0) {
        lines.push(`No Swift packages found for "${query}".`);
        lines.push(`🔗 https://swiftpackageindex.com/search?query=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      results.slice(0, 5).forEach((p, i) => {
        const name = p.packageName ?? p.name ?? p.repositoryName ?? 'Unknown';
        const owner = p.repositoryOwner ?? p.owner ?? '';
        lines.push(`**${i + 1}. ${name}**${owner ? ` by ${owner}` : ''}`);
        if (p.summary) lines.push(`   ${p.summary.slice(0, 150)}`);
        if (p.stars != null) lines.push(`   ⭐ ${Number(p.stars).toLocaleString()} stars`);
        if (p.lastActivityAt) lines.push(`   📅 Last active: ${p.lastActivityAt.slice(0, 10)}`);

        const repo = p.repositoryUrl ?? (owner ? `https://github.com/${owner}/${name}` : null);
        if (repo) {
          lines.push(`   📋 **Package.swift:** \`.package(url: "${repo}", from: "...")`);
          lines.push(`   🔗 ${repo}`);
        }
        const spiUrl = p.url ?? (owner ? `https://swiftpackageindex.com/${owner}/${name}` : null);
        if (spiUrl) lines.push(`   📚 ${spiUrl}`);
        lines.push('');
      });

      lines.push(`Source: swiftpackageindex.com`);
      return lines.join('\n');
    },

    // Julia (JuliaHub / General Registry)
    search_julia: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🟣 Searching Julia packages for "${query}"…`);

      // JuliaHub has a public packages endpoint
      const data = await safeJson(`https://juliahub.com/app/packages/info`).catch(() => null);

      const lines = [`🟣 Julia Package Search: "${query}"`, ''];

      // Filter packages client-side (the endpoint returns an array of all packages)
      if (Array.isArray(data)) {
        const q = query.toLowerCase();
        const matches = data
          .filter(
            (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
          )
          .slice(0, 5);

        if (matches.length > 0) {
          matches.forEach((p, i) => {
            lines.push(`**${i + 1}. ${p.name}**`);
            if (p.description) lines.push(`   ${p.description.slice(0, 150)}`);
            if (p.stars != null) lines.push(`   ⭐ ${Number(p.stars).toLocaleString()} stars`);
            if (p.version) lines.push(`   🏷  v${p.version}`);
            lines.push(`   📋 **Pkg.jl:** \`] add ${p.name}\``);
            if (p.url) lines.push(`   🔗 ${p.url}`);
            lines.push(`   📚 https://juliahub.com/ui/Packages/${p.name}`);
            lines.push('');
          });
          lines.push(`Source: juliahub.com`);
          return lines.join('\n');
        }
      }

      // Fallback: DuckDuckGo scoped to juliahub.com
      const ddg = await safeJson(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' julia package site:juliahub.com OR site:juliaobserver.com')}&format=json&no_redirect=1&no_html=1`,
      );

      const related = (ddg.RelatedTopics ?? []).filter((t) => t.Text && t.FirstURL);

      if (related.length === 0) {
        lines.push(`No Julia packages found for "${query}".`);
        lines.push(`🔗 https://juliahub.com/app/packages?q=${encodeURIComponent(query)}`);
        lines.push(`📋 **Install:** \`] add ${query}\``);
        return lines.join('\n');
      }

      related.slice(0, 5).forEach((t, i) => {
        lines.push(`**${i + 1}.** ${t.Text.slice(0, 140)}${t.Text.length > 140 ? '…' : ''}`);
        lines.push(`   🔗 ${t.FirstURL}`);
        lines.push('');
      });

      lines.push(`Source: juliahub.com`);
      return lines.join('\n');
    },

    // Gradle Plugin Portal
    search_gradle: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🐘 Searching Gradle Plugin Portal for "${query}"…`);

      // Gradle Plugin Portal has a JSON search API
      const data = await safeJson(
        `https://plugins.gradle.org/search?term=${encodeURIComponent(query)}&start=0&limit=5`,
      ).catch(() => null);

      const lines = [`🐘 Gradle Plugin Search: "${query}"`, ''];

      const plugins = data?.hits ?? [];

      if (plugins.length === 0) {
        // Fallback to DuckDuckGo
        const ddg = await safeJson(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' site:plugins.gradle.org')}&format=json&no_redirect=1&no_html=1`,
        );
        const related = (ddg.RelatedTopics ?? []).filter(
          (t) => t.Text && t.FirstURL?.includes('plugins.gradle.org'),
        );
        if (related.length === 0) {
          lines.push(`No Gradle plugins found for "${query}".`);
          lines.push(`🔗 https://plugins.gradle.org/search?term=${encodeURIComponent(query)}`);
          return lines.join('\n');
        }
        related.slice(0, 5).forEach((t, i) => {
          lines.push(`**${i + 1}.** ${t.Text.slice(0, 140)}${t.Text.length > 140 ? '…' : ''}`);
          lines.push(`   🔗 ${t.FirstURL}`);
          lines.push('');
        });
        lines.push(`Source: plugins.gradle.org`);
        return lines.join('\n');
      }

      plugins.forEach((p, i) => {
        lines.push(`**${i + 1}. ${p.id ?? p.pluginId}** — v${p.version ?? '?'}`);
        if (p.description) lines.push(`   ${p.description.slice(0, 150)}`);
        if (p.website) lines.push(`   🏠 ${p.website}`);

        const pluginId = p.id ?? p.pluginId;
        const version = p.version ?? '';
        lines.push('');
        lines.push(`   **Kotlin DSL (build.gradle.kts):**`);
        lines.push(`   \`\`\`kotlin`);
        lines.push(`   plugins {`);
        lines.push(`     id("${pluginId}") version "${version}"`);
        lines.push(`   }`);
        lines.push(`   \`\`\``);
        lines.push(`   🔗 https://plugins.gradle.org/plugin/${pluginId}`);
        lines.push('');
      });

      lines.push(`Source: plugins.gradle.org`);
      return lines.join('\n');
    },

    // CocoaPods (iOS / macOS)
    search_cocoapods: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🍫 Searching CocoaPods for "${query}"…`);

      // Try trunk.cocoapods.org for exact pod info, then DuckDuckGo for keyword search
      const exact = await safeJson(
        `https://trunk.cocoapods.org/api/v1/pods/${encodeURIComponent(query)}`,
      ).catch(() => null);

      const lines = [`🍫 CocoaPods Search: "${query}"`, ''];

      if (exact) {
        const latest = exact.versions?.sort((a, b) =>
          b.name?.localeCompare(a.name, undefined, { numeric: true }),
        )?.[0];
        lines.push(`**${exact.name ?? query}** — v${latest?.name ?? '?'}`);
        if (exact.summary) lines.push(`   ${exact.summary}`);
        if (exact.description) lines.push(`   ${exact.description.slice(0, 200)}`);
        if (exact.authors) {
          const authNames =
            typeof exact.authors === 'object'
              ? Object.keys(exact.authors).join(', ')
              : String(exact.authors);
          lines.push(`   👤 ${authNames}`);
        }
        if (exact.license?.type) lines.push(`   📄 License: ${exact.license.type}`);
        if (exact.platforms) {
          const plats = Object.entries(exact.platforms)
            .map(([k, v]) => `${k} ${v}`)
            .join(', ');
          lines.push(`   📱 Platforms: ${plats}`);
        }
        lines.push('');
        lines.push(`   **Podfile:**`);
        lines.push(`   \`pod '${exact.name ?? query}', '~> ${latest?.name ?? ''}'\``);
        lines.push(`   🔗 https://cocoapods.org/pods/${exact.name ?? query}`);
      } else {
        // DuckDuckGo site-scoped fallback
        const ddg = await safeJson(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' site:cocoapods.org/pods')}&format=json&no_redirect=1&no_html=1`,
        );
        const related = (ddg.RelatedTopics ?? []).filter(
          (t) => t.Text && t.FirstURL?.includes('cocoapods.org'),
        );

        if (related.length === 0) {
          lines.push(`No CocoaPods results for "${query}".`);
          lines.push(`🔗 https://cocoapods.org/pods?q=${encodeURIComponent(query)}`);
          return lines.join('\n');
        }

        related.slice(0, 5).forEach((t, i) => {
          lines.push(`**${i + 1}.** ${t.Text.slice(0, 140)}${t.Text.length > 140 ? '…' : ''}`);
          lines.push(`   🔗 ${t.FirstURL}`);
          lines.push('');
        });
      }

      lines.push('');
      lines.push(`Source: cocoapods.org`);
      return lines.join('\n');
    },

    // ─────────────────────────────────────────────────────────────────
    // NEW HANDLERS — DEV-TOOL ECOSYSTEMS
    // ─────────────────────────────────────────────────────────────────

    // Homebrew
    search_homebrew: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🍺 Searching Homebrew for "${query}"…`);

      const lines = [`🍺 Homebrew Search: "${query}"`, ''];

      // Try exact formula lookup first
      const formula = await safeJson(
        `https://formulae.brew.sh/api/formula/${encodeURIComponent(query.toLowerCase())}.json`,
      ).catch(() => null);

      if (formula) {
        lines.push(`**${formula.name}** — v${formula.versions?.stable ?? '?'}`);
        if (formula.desc) lines.push(`   ${formula.desc}`);
        if (formula.homepage) lines.push(`   🏠 ${formula.homepage}`);
        if (formula.license) lines.push(`   📄 License: ${formula.license}`);

        const deps = (formula.dependencies ?? []).slice(0, 6).join(', ');
        if (deps) lines.push(`   🔗 Dependencies: ${deps}`);

        const installCount = formula.analytics?.install?.['365d']?.['formula']?.[formula.name];
        if (installCount)
          lines.push(`   📥 ~${Number(installCount).toLocaleString()} installs (365d)`);

        lines.push('');
        lines.push(`   📋 **Install:** \`brew install ${formula.name}\``);
        lines.push(`   🔗 https://formulae.brew.sh/formula/${formula.name}`);
      } else {
        // Try cask
        const cask = await safeJson(
          `https://formulae.brew.sh/api/cask/${encodeURIComponent(query.toLowerCase())}.json`,
        ).catch(() => null);

        if (cask) {
          lines.push(`**${cask.token}** (Cask) — v${cask.version ?? '?'}`);
          if (cask.desc) lines.push(`   ${cask.desc}`);
          if (cask.homepage) lines.push(`   🏠 ${cask.homepage}`);
          lines.push('');
          lines.push(`   📋 **Install:** \`brew install --cask ${cask.token}\``);
          lines.push(`   🔗 https://formulae.brew.sh/cask/${cask.token}`);
        } else {
          lines.push(`No exact Homebrew formula/cask found for "${query}".`);
          lines.push(`🔗 https://formulae.brew.sh/`);
          lines.push(`💡 Tip: Run \`brew search ${query}\` locally for fuzzy results.`);
          return lines.join('\n');
        }
      }

      lines.push('');
      lines.push(`Source: formulae.brew.sh`);
      return lines.join('\n');
    },

    // VS Code Marketplace
    search_vscode: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🔵 Searching VS Code Marketplace for "${query}"…`);

      const body = {
        filters: [
          {
            criteria: [
              { filterType: 8, value: 'Microsoft.VisualStudio.Code' },
              { filterType: 10, value: query },
            ],
            pageSize: 5,
            pageNumber: 1,
            sortBy: 4, // InstallCount
            sortOrder: 0,
          },
        ],
        flags: 914, // includes install stats, rating, versions
      };

      const resp = await fetch(
        'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json;api-version=3.0-preview.1',
          },
          body: JSON.stringify(body),
        },
      );

      const data = await resp.json();
      const lines = [`🔵 VS Code Marketplace: "${query}"`, ''];

      const extensions = data.results?.[0]?.extensions ?? [];
      if (extensions.length === 0) {
        lines.push(`No VS Code extensions found for "${query}".`);
        lines.push(
          `🔗 https://marketplace.visualstudio.com/search?target=VSCode&term=${encodeURIComponent(query)}`,
        );
        return lines.join('\n');
      }

      extensions.forEach((ext, i) => {
        const id = `${ext.publisher.publisherName}.${ext.extensionName}`;
        const version = ext.versions?.[0]?.version ?? '?';

        // Pull stats from statisticName fields
        const stats = Object.fromEntries(
          (ext.statistics ?? []).map((s) => [s.statisticName, s.value]),
        );

        lines.push(`**${i + 1}. ${ext.displayName}** — v${version}`);
        lines.push(`   🆔 \`${id}\``);
        if (ext.shortDescription) lines.push(`   ${ext.shortDescription.slice(0, 150)}`);
        lines.push(`   👤 ${ext.publisher.displayName}`);

        if (stats.install != null)
          lines.push(`   📥 ${Number(stats.install).toLocaleString()} installs`);
        if (stats.averagerating != null)
          lines.push(`   ⭐ ${Number(stats.averagerating).toFixed(1)} / 5`);

        lines.push(`   📋 **Install:** \`code --install-extension ${id}\``);
        lines.push(`   🔗 https://marketplace.visualstudio.com/items?itemName=${id}`);
        lines.push('');
      });

      lines.push(`Source: marketplace.visualstudio.com`);
      return lines.join('\n');
    },

    // Terraform Registry
    search_terraform: async (params, onStage) => {
      const { query, type = 'providers' } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      const resourceType = type === 'modules' ? 'modules' : 'providers';
      onStage(`🏗️ Searching Terraform Registry for "${query}" ${resourceType}…`);

      const data = await safeJson(
        `https://registry.terraform.io/v2/${resourceType}?filter%5Bquery%5D=${encodeURIComponent(query)}&page%5Bsize%5D=5`,
      ).catch(() => null);

      const lines = [`🏗️ Terraform Registry: "${query}" (${resourceType})`, ''];

      const items = data?.data ?? [];
      if (items.length === 0) {
        lines.push(`No Terraform ${resourceType} found for "${query}".`);
        lines.push(
          `🔗 https://registry.terraform.io/search/${resourceType}?q=${encodeURIComponent(query)}`,
        );
        return lines.join('\n');
      }

      items.forEach((item, i) => {
        const attr = item.attributes ?? {};
        const name = attr['full-name'] ?? attr.name ?? item.id ?? 'Unknown';
        lines.push(`**${i + 1}. ${name}**`);
        if (attr.description) lines.push(`   ${attr.description.slice(0, 150)}`);
        if (attr.downloads != null)
          lines.push(`   📥 ${Number(attr.downloads).toLocaleString()} downloads`);
        if (attr.source) lines.push(`   🐙 ${attr.source}`);
        if (attr.tier) lines.push(`   🏷  Tier: ${attr.tier}`);

        if (resourceType === 'providers') {
          const ns = attr.namespace ?? name.split('/')[0];
          const pname = attr.name ?? name.split('/')[1] ?? name;
          lines.push('');
          lines.push(`   **terraform {}:**`);
          lines.push(`   \`\`\`hcl`);
          lines.push(`   required_providers {`);
          lines.push(`     ${pname} = {`);
          lines.push(`       source  = "${ns}/${pname}"`);
          lines.push(`       version = "~> ${attr['latest-version'] ?? '?'}"`);
          lines.push(`     }`);
          lines.push(`   }`);
          lines.push(`   \`\`\``);
        }

        lines.push(`   🔗 https://registry.terraform.io/${resourceType}/${name}`);
        lines.push('');
      });

      lines.push(`Source: registry.terraform.io`);
      return lines.join('\n');
    },

    // Ansible Galaxy
    search_ansible: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🅰️ Searching Ansible Galaxy for "${query}"…`);

      // Galaxy API v3 collection search
      const data = await safeJson(
        `https://galaxy.ansible.com/api/v3/plugin/ansible/search/collection-versions/?keywords=${encodeURIComponent(query)}&limit=5&deprecated=false`,
      ).catch(() => null);

      const lines = [`🅰️ Ansible Galaxy: "${query}"`, ''];

      const results = data?.data ?? [];

      if (results.length === 0) {
        // Fallback to v1 roles
        const rolesData = await safeJson(
          `https://galaxy.ansible.com/api/v1/search/roles/?keywords=${encodeURIComponent(query)}&page_size=5`,
        ).catch(() => null);

        const roles = rolesData?.results ?? [];

        if (roles.length === 0) {
          lines.push(`No Ansible Galaxy content found for "${query}".`);
          lines.push(`🔗 https://galaxy.ansible.com/search?keywords=${encodeURIComponent(query)}`);
          return lines.join('\n');
        }

        lines.push(`**Roles:**\n`);
        roles.forEach((r, i) => {
          lines.push(
            `**${i + 1}. ${r.namespace}.${r.name}** — v${r.summary_fields?.versions?.[0]?.name ?? '?'}`,
          );
          if (r.description) lines.push(`   ${r.description.slice(0, 150)}`);
          if (r.stargazers_count != null)
            lines.push(`   ⭐ ${Number(r.stargazers_count).toLocaleString()} stars`);
          if (r.download_count != null)
            lines.push(`   📥 ${Number(r.download_count).toLocaleString()} downloads`);
          lines.push(`   📋 **Install:** \`ansible-galaxy role install ${r.namespace}.${r.name}\``);
          lines.push(`   🔗 https://galaxy.ansible.com/${r.namespace}/${r.name}`);
          lines.push('');
        });

        lines.push(`Source: galaxy.ansible.com`);
        return lines.join('\n');
      }

      lines.push(`**Collections:**\n`);
      results.forEach((item, i) => {
        const col = item.collection_version ?? item;
        const ns = col.namespace ?? '';
        const name = col.name ?? '';
        const version = col.version ?? '?';

        lines.push(`**${i + 1}. ${ns}.${name}** — v${version}`);
        if (col.description) lines.push(`   ${col.description.slice(0, 150)}`);
        if (col.download_count != null)
          lines.push(`   📥 ${Number(col.download_count).toLocaleString()} downloads`);

        lines.push(`   📋 **Install:** \`ansible-galaxy collection install ${ns}.${name}\``);
        lines.push(`   🔗 https://galaxy.ansible.com/${ns}/${name}`);
        lines.push('');
      });

      lines.push(`Source: galaxy.ansible.com`);
      return lines.join('\n');
    },

    // WordPress Plugin Directory
    search_wordpress_plugins: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🔷 Searching WordPress plugins for "${query}"…`);

      const data = await safeJson(
        `https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[search]=${encodeURIComponent(query)}&request[per_page]=5&request[fields][description]=true&request[fields][short_description]=true&request[fields][rating]=true&request[fields][num_ratings]=true&request[fields][active_installs]=true&request[fields][tested]=true&request[fields][requires]=true`,
      );

      const lines = [`🔷 WordPress Plugins: "${query}"`, ''];

      const plugins = data.plugins ?? [];
      if (plugins.length === 0) {
        lines.push(`No WordPress plugins found for "${query}".`);
        lines.push(`🔗 https://wordpress.org/plugins/search/${encodeURIComponent(query)}/`);
        return lines.join('\n');
      }

      plugins.forEach((p, i) => {
        lines.push(`**${i + 1}. ${p.name}** — v${p.version ?? '?'}`);
        if (p.short_description) lines.push(`   ${p.short_description.slice(0, 150)}`);
        lines.push(`   👤 ${p.author_profile ? p.author : (p.author ?? 'Unknown')}`);

        if (p.active_installs != null)
          lines.push(`   📥 ${Number(p.active_installs).toLocaleString()}+ active installs`);

        if (p.rating != null) {
          const stars = Math.round((p.rating / 20) * 10) / 10;
          lines.push(`   ⭐ ${stars}/5 (${(p.num_ratings ?? 0).toLocaleString()} ratings)`);
        }

        if (p.requires) lines.push(`   🔧 Requires WordPress: ${p.requires}+`);
        if (p.tested) lines.push(`   ✅ Tested up to: ${p.tested}`);
        if (p.requires_php) lines.push(`   🐍 Requires PHP: ${p.requires_php}+`);

        lines.push(`   🔗 https://wordpress.org/plugins/${p.slug}/`);
        lines.push('');
      });

      lines.push(`Source: wordpress.org/plugins`);
      return lines.join('\n');
    },

    // Godot Asset Library
    search_godot: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🎮 Searching Godot Asset Library for "${query}"…`);

      const data = await safeJson(
        `https://godotengine.org/asset-library/api/asset?filter=${encodeURIComponent(query)}&max_results=5&type=any`,
      ).catch(() => null);

      const lines = [`🎮 Godot Asset Library: "${query}"`, ''];

      const assets = data?.result ?? [];
      if (assets.length === 0) {
        lines.push(`No Godot assets found for "${query}".`);
        lines.push(
          `🔗 https://godotengine.org/asset-library/asset?search=${encodeURIComponent(query)}`,
        );
        return lines.join('\n');
      }

      assets.forEach((a, i) => {
        lines.push(`**${i + 1}. ${a.title}**`);
        if (a.category) lines.push(`   🏷  Category: ${a.category}`);
        if (a.author) lines.push(`   👤 ${a.author}`);
        if (a.godot_version) lines.push(`   🎮 Godot: ${a.godot_version}`);
        if (a.version_string) lines.push(`   🏷  v${a.version_string}`);
        if (a.rating != null) lines.push(`   ⭐ ${a.rating}`);
        if (a.description)
          lines.push(`   ${a.description.slice(0, 150)}${a.description.length > 150 ? '…' : ''}`);
        if (a.browse_url) lines.push(`   🔗 ${a.browse_url}`);
        else if (a.asset_id)
          lines.push(`   🔗 https://godotengine.org/asset-library/asset/${a.asset_id}`);
        lines.push('');
      });

      if (data.total_items != null)
        lines.push(`Showing ${assets.length} of ${data.total_items} results.`);

      lines.push(`Source: godotengine.org/asset-library`);
      return lines.join('\n');
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // BATCH 2 — 20 NEW HANDLERS
    // Merge these into the `handlers:` object inside createExecutor() in Executor.js
    // ─────────────────────────────────────────────────────────────────────────────

    // ── R / CRAN ────────────────────────────────────────────────────────────────
    search_cran: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`📊 Searching CRAN for "${query}"…`);

      const lines = [`📊 CRAN Search: "${query}"`, ''];

      // Try exact package name via crandb (maintained by r-hub.io)
      const exact = await fetch(`https://crandb.r-pkg.org/${encodeURIComponent(query)}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (exact) {
        lines.push(`**${exact.Package}** — v${exact.Version}`);
        if (exact.Title) lines.push(`   ${exact.Title}`);
        if (exact.Description)
          lines.push(`   ${exact.Description.replace(/\s+/g, ' ').slice(0, 200)}`);
        lines.push('');
        if (exact.Author)
          lines.push(`   👤 Author: ${exact.Author.replace(/\s+/g, ' ').slice(0, 100)}`);
        if (exact.Maintainer)
          lines.push(`   🔧 Maintainer: ${exact.Maintainer.split('<')[0].trim()}`);
        if (exact.License) lines.push(`   📄 License: ${exact.License}`);
        if (exact.Depends) lines.push(`   🔗 Depends: ${exact.Depends}`);
        if (exact.Imports) lines.push(`   📦 Imports: ${String(exact.Imports).slice(0, 120)}`);
        if (exact.Published) lines.push(`   📅 Published: ${exact.Published}`);
        lines.push('');
        lines.push(`   📋 **Install:** \`install.packages("${exact.Package}")\``);
        lines.push(`   🔗 https://cran.r-project.org/package=${exact.Package}`);
        lines.push(`   📚 https://rdrr.io/cran/${exact.Package}/`);
      } else {
        // No exact match — guide to CRAN search and R-Universe
        lines.push(`No exact CRAN package named "${query}".`);
        lines.push('');
        lines.push(
          `🔗 **CRAN search:** https://cran.r-project.org/search.html?query=${encodeURIComponent(query)}`,
        );
        lines.push(
          `🔗 **R-Universe:**  https://r-universe.dev/search/#${encodeURIComponent(query)}`,
        );
        lines.push(`🔗 **CRAN Task Views:** https://cran.r-project.org/web/views/`);
        lines.push('');
        lines.push(`💡 Tip: In R, run \`install.packages("${query}")\` to try a direct install.`);
      }

      lines.push('');
      lines.push(`Source: crandb.r-pkg.org`);
      return lines.join('\n');
    },

    // ── Clojure / Clojars ───────────────────────────────────────────────────────
    search_clojars: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🌀 Searching Clojars for "${query}"…`);

      const data = await fetch(
        `https://clojars.org/search?q=${encodeURIComponent(query)}&format=json`,
      ).then((r) => r.json());

      const lines = [`🌀 Clojars Search: "${query}"`, ''];

      const results = (data.results ?? []).slice(0, 5);
      if (results.length === 0) {
        lines.push(`No Clojars artifacts found for "${query}".`);
        lines.push(`🔗 https://clojars.org/search?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      if (data.count != null)
        lines.push(
          `Found ${Number(data.count).toLocaleString()} results — top ${results.length}:\n`,
        );

      results.forEach((r, i) => {
        const coord = r.group_name === r.jar_name ? r.jar_name : `${r.group_name}/${r.jar_name}`;
        lines.push(`**${i + 1}. ${coord}** — v${r.version}`);
        if (r.description) lines.push(`   ${r.description.slice(0, 150)}`);
        if (r.created != null)
          lines.push(`   📅 First created: ${new Date(r.created).toLocaleDateString()}`);
        lines.push('');
        lines.push(`   **deps.edn:**`);
        lines.push(`   \`{${coord} {:mvn/version "${r.version}"}}\``);
        lines.push(`   **Leiningen:**`);
        lines.push(`   \`[${coord} "${r.version}"]\``);
        lines.push(`   🔗 https://clojars.org/${coord}`);
        lines.push('');
      });

      lines.push(`Source: clojars.org`);
      return lines.join('\n');
    },

    // ── OCaml / OPAM ────────────────────────────────────────────────────────────
    search_opam: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🐫 Searching OPAM for "${query}"…`);

      const lines = [`🐫 OPAM Search: "${query}"`, ''];

      // OPAM doesn't expose a JSON search API — try exact package info from the
      // public package pages, then fall back to DuckDuckGo scoped to opam.ocaml.org.
      const exact = await fetch(`https://opam.ocaml.org/packages/${encodeURIComponent(query)}/`, {
        headers: { Accept: 'application/json, text/html' },
      })
        .then((r) => (r.ok ? r.text() : null))
        .catch(() => null);

      if (exact && !exact.includes('404') && exact.includes(query)) {
        lines.push(`**${query}**`);
        lines.push(`   ✅ Package found in the OPAM repository.`);

        // Scrape synopsis from page if available
        const synopsisMatch = exact.match(/<meta name="description" content="([^"]+)"/i);
        if (synopsisMatch) lines.push(`   ${synopsisMatch[1].slice(0, 200)}`);

        lines.push('');
        lines.push(`   📋 **Install:**`);
        lines.push(`   \`opam install ${query}\``);
        lines.push(`   🔗 https://opam.ocaml.org/packages/${query}/`);
      } else {
        // DuckDuckGo site-scoped fallback
        const ddg = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' site:opam.ocaml.org/packages')}&format=json&no_redirect=1&no_html=1`,
        ).then((r) => r.json());

        const related = (ddg.RelatedTopics ?? []).filter(
          (t) => t.Text && t.FirstURL?.includes('opam.ocaml.org'),
        );

        if (related.length === 0) {
          lines.push(`No OPAM results found for "${query}".`);
          lines.push(`🔗 https://opam.ocaml.org/packages/ (browse all packages)`);
          lines.push(`💡 Tip: Run \`opam search ${query}\` locally for fuzzy results.`);
          return lines.join('\n');
        }

        related.slice(0, 5).forEach((t, i) => {
          // Extract package name from URL
          const pkgName = t.FirstURL.split('/packages/')[1]?.split('/')[0] ?? '';
          lines.push(`**${i + 1}. ${pkgName || t.Text.slice(0, 40)}**`);
          if (t.Text) lines.push(`   ${t.Text.slice(0, 150)}`);
          if (pkgName) lines.push(`   📋 \`opam install ${pkgName}\``);
          lines.push(`   🔗 ${t.FirstURL}`);
          lines.push('');
        });
      }

      lines.push(`Source: opam.ocaml.org`);
      return lines.join('\n');
    },

    // ── Elm ─────────────────────────────────────────────────────────────────────
    search_elm: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🌳 Searching Elm packages for "${query}"…`);

      // Official Elm package search endpoint
      const results = await fetch(
        `https://package.elm-lang.org/search.json?q=${encodeURIComponent(query)}`,
      ).then((r) => r.json());

      const lines = [`🌳 Elm Packages: "${query}"`, ''];

      if (!Array.isArray(results) || results.length === 0) {
        lines.push(`No Elm packages found for "${query}".`);
        lines.push(`🔗 https://package.elm-lang.org/`);
        return lines.join('\n');
      }

      results.slice(0, 5).forEach((p, i) => {
        const latestVersion = (p.versions ?? [])[0] ?? '?';
        lines.push(`**${i + 1}. ${p.name}** — v${latestVersion}`);
        if (p.summary) lines.push(`   ${p.summary}`);
        if (p.license) lines.push(`   📄 License: ${p.license}`);
        if (p.versions?.length > 1) lines.push(`   📦 ${p.versions.length} versions available`);
        lines.push('');
        lines.push(`   📋 **elm.json:**`);
        lines.push(
          `   \`"${p.name}": "${latestVersion <= '?' ? '1.0.0' : latestVersion} <= v < ${incrementMajor(latestVersion)}"\``,
        );
        lines.push(`   📋 **Install:** \`elm install ${p.name}\``);
        lines.push(`   🔗 https://package.elm-lang.org/packages/${p.name}/latest/`);
        lines.push('');
      });

      lines.push(`Source: package.elm-lang.org`);
      return lines.join('\n');

      function incrementMajor(ver) {
        const parts = ver.split('.');
        if (parts.length < 1 || isNaN(Number(parts[0]))) return '2.0.0';
        return `${Number(parts[0]) + 1}.0.0`;
      }
    },

    // ── D / DUB ─────────────────────────────────────────────────────────────────
    search_dub: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🔷 Searching DUB registry for "${query}"…`);

      const data = await fetch(
        `https://code.dlang.org/api/packages/search?q=${encodeURIComponent(query)}&limit=5`,
      ).then((r) => r.json());

      const lines = [`🔷 DUB Search: "${query}"`, ''];

      const pkgs = Array.isArray(data) ? data : (data.packages ?? data.results ?? []);

      if (pkgs.length === 0) {
        lines.push(`No DUB packages found for "${query}".`);
        lines.push(`🔗 https://code.dlang.org/?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      for (const p of pkgs.slice(0, 5)) {
        // Fetch full package info for version/description if not in search results
        const detail =
          !p.version || !p.description
            ? await fetch(
                `https://code.dlang.org/api/packages/${encodeURIComponent(p.name)}/latest/info`,
              )
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
            : null;

        const version = p.version ?? detail?.version ?? '?';
        const desc = p.description ?? detail?.description ?? '';
        const owner = p.owner ?? detail?.owner ?? '';

        lines.push(`**${p.name}** — v${version}`);
        if (desc) lines.push(`   ${desc.slice(0, 150)}`);
        if (owner) lines.push(`   👤 ${owner}`);
        if (p.downloads != null)
          lines.push(`   📥 ${Number(p.downloads).toLocaleString()} downloads`);
        if (p.score != null) lines.push(`   ⭐ Score: ${Number(p.score).toFixed(1)}`);
        lines.push('');
        lines.push(`   **dub.json:**`);
        lines.push(`   \`"${p.name}": "~>${version.split('.').slice(0, 2).join('.')}"\``);
        lines.push(`   📋 **Install:** \`dub add ${p.name}\``);
        lines.push(`   🔗 https://code.dlang.org/packages/${p.name}`);
        lines.push('');
      }

      lines.push(`Source: code.dlang.org`);
      return lines.join('\n');
    },

    // ── Nim / Nimble ─────────────────────────────────────────────────────────────
    search_nimble: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`👑 Searching Nimble packages for "${query}"…`);

      // The official Nim packages list lives in the nim-lang/packages repo
      const raw = await fetch(
        'https://raw.githubusercontent.com/nim-lang/packages/master/packages.json',
      )
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

      const lines = [`👑 Nimble Search: "${query}"`, ''];

      if (!Array.isArray(raw) || raw.length === 0) {
        lines.push(`Could not reach the Nim package registry.`);
        lines.push(`🔗 https://nimble.directory/search?search=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      const q = query.toLowerCase();
      const matches = raw
        .filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
        )
        .slice(0, 6);

      if (matches.length === 0) {
        lines.push(`No Nimble packages match "${query}".`);
        lines.push(`🔗 https://nimble.directory/search?search=${encodeURIComponent(query)}`);
        lines.push(`💡 Tip: Run \`nimble search ${query}\` locally.`);
        return lines.join('\n');
      }

      lines.push(
        `Found ${matches.length} match${matches.length === 1 ? '' : 'es'} in ${raw.length.toLocaleString()} registered packages:\n`,
      );

      matches.forEach((p, i) => {
        lines.push(`**${i + 1}. ${p.name}**`);
        if (p.description) lines.push(`   ${p.description.slice(0, 150)}`);

        const method = p.method ?? 'git';
        const tags = (p.tags ?? []).slice(0, 5).join(', ');
        if (tags) lines.push(`   🏷  ${tags}`);
        if (p.license) lines.push(`   📄 License: ${p.license}`);
        if (p.url) lines.push(`   🐙 ${p.url}`);

        lines.push(`   📋 **Install:** \`nimble install ${p.name}\``);
        lines.push(`   🔗 https://nimble.directory/pkg/${p.name}`);
        lines.push('');
      });

      lines.push(`Source: github.com/nim-lang/packages`);
      return lines.join('\n');
    },

    // ── Lua / LuaRocks ──────────────────────────────────────────────────────────
    search_luarocks: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🌙 Searching LuaRocks for "${query}"…`);

      const lines = [`🌙 LuaRocks Search: "${query}"`, ''];

      // LuaRocks has no public JSON search API — try an exact module manifest
      const exact = await fetch(`https://luarocks.org/manifests/luarocks/manifest-5.4`)
        .then((r) => (r.ok ? r.text() : null))
        .catch(() => null);

      // Parse the text manifest for matching entries
      if (exact) {
        const q = query.toLowerCase();
        const moduleRegex = /^([^\s]+)\s*=/gm;
        const allModules = [];
        let m;
        while ((m = moduleRegex.exec(exact)) !== null) {
          if (m[1].toLowerCase().includes(q)) allModules.push(m[1]);
        }

        if (allModules.length > 0) {
          lines.push(`Packages matching "${query}" on LuaRocks:\n`);
          allModules.slice(0, 6).forEach((name, i) => {
            lines.push(`**${i + 1}. ${name}**`);
            lines.push(`   📋 **Install:** \`luarocks install ${name}\``);
            lines.push(
              `   🔗 https://luarocks.org/modules/${name.toLowerCase().replace('.', '/')}`,
            );
            lines.push('');
          });
          if (allModules.length > 6) lines.push(`…and ${allModules.length - 6} more matches.`);
          lines.push(`Source: luarocks.org`);
          return lines.join('\n');
        }
      }

      // DuckDuckGo fallback scoped to luarocks.org
      const ddg = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' site:luarocks.org/modules')}&format=json&no_redirect=1&no_html=1`,
      ).then((r) => r.json());

      const related = (ddg.RelatedTopics ?? []).filter(
        (t) => t.Text && t.FirstURL?.includes('luarocks.org'),
      );

      if (related.length === 0) {
        lines.push(`No LuaRocks results for "${query}".`);
        lines.push(`🔗 https://luarocks.org/search?q=${encodeURIComponent(query)}`);
        lines.push(`💡 Tip: Run \`luarocks search ${query}\` locally.`);
        return lines.join('\n');
      }

      related.slice(0, 5).forEach((t, i) => {
        const name = t.FirstURL.split('/modules/')[1]?.split('/')[0] ?? '';
        lines.push(`**${i + 1}. ${name || t.Text.slice(0, 40)}**`);
        if (t.Text) lines.push(`   ${t.Text.slice(0, 150)}`);
        if (name) lines.push(`   📋 \`luarocks install ${name}\``);
        lines.push(`   🔗 ${t.FirstURL}`);
        lines.push('');
      });

      lines.push(`Source: luarocks.org`);
      return lines.join('\n');
    },

    // ── Crystal / Shards ────────────────────────────────────────────────────────
    search_crystal: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`💎 Searching Crystal shards for "${query}"…`);

      const lines = [`💎 Crystal Shards: "${query}"`, ''];

      // shards.info is the community Crystal package index with a JSON search API
      const data = await fetch(`https://shards.info/api/search?q=${encodeURIComponent(query)}`, {
        headers: { Accept: 'application/json' },
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const results = data?.results ?? data?.shards ?? (Array.isArray(data) ? data : []);

      if (results.length === 0) {
        lines.push(`No Crystal shards found for "${query}".`);
        lines.push(`🔗 https://shards.info/?query=${encodeURIComponent(query)}`);
        lines.push(`🔗 https://crystal-lang.org/`);
        return lines.join('\n');
      }

      results.slice(0, 5).forEach((s, i) => {
        const name = s.name ?? s.full_name ?? s.repository?.full_name ?? 'Unknown';
        lines.push(`**${i + 1}. ${name}**`);
        if (s.description) lines.push(`   ${s.description.slice(0, 150)}`);
        if (s.stars != null) lines.push(`   ⭐ ${Number(s.stars).toLocaleString()} stars`);
        if (s.version || s.latest_release) lines.push(`   🏷  v${s.version ?? s.latest_release}`);

        const owner = s.owner ?? name.split('/')[0];
        const repo = s.repo ?? name.split('/')[1] ?? name;
        lines.push('');
        lines.push(`   **shard.yml:**`);
        lines.push(`   \`\`\`yaml`);
        lines.push(`   dependencies:`);
        lines.push(`     ${repo}:`);
        lines.push(`       github: ${owner}/${repo}`);
        if (s.version) lines.push(`       version: ~> ${s.version}`);
        lines.push(`   \`\`\``);
        if (s.url ?? s.html_url) lines.push(`   🔗 ${s.url ?? s.html_url}`);
        lines.push('');
      });

      lines.push(`Source: shards.info`);
      return lines.join('\n');
    },

    // ── PureScript / Pursuit ────────────────────────────────────────────────────
    search_purescript: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🔮 Searching Pursuit for "${query}"…`);

      // Pursuit supports JSON results via the Accept header
      const results = await fetch(
        `https://pursuit.purescript.org/search?q=${encodeURIComponent(query)}`,
        { headers: { Accept: 'application/json' } },
      )
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

      const lines = [`🔮 PureScript Pursuit: "${query}"`, ''];

      if (!Array.isArray(results) || results.length === 0) {
        lines.push(`No PureScript packages found for "${query}".`);
        lines.push(`🔗 https://pursuit.purescript.org/search?q=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      // Deduplicate by package
      const seen = new Set();
      const deduped = results.filter((r) => {
        const pkg = r.package?.name ?? r.module?.package ?? r.type;
        if (seen.has(pkg)) return false;
        seen.add(pkg);
        return true;
      });

      deduped.slice(0, 6).forEach((r, i) => {
        const pkg = r.package?.name ?? r.module?.package ?? '?';
        const ver = r.package?.version ?? '?';
        const title = r.title ?? r.name ?? pkg;
        const info = r.info ?? r.type ?? '';

        lines.push(`**${i + 1}. ${title}** (${pkg} v${ver})`);
        if (info) lines.push(`   ${String(info).replace(/\s+/g, ' ').slice(0, 150)}`);
        if (r.module?.name) lines.push(`   📦 Module: ${r.module.name}`);

        lines.push(`   📋 **spago.dhall:** \`"${pkg}" = "v${ver}..v${bumpMajor(ver)}"\``);
        lines.push(`   🔗 https://pursuit.purescript.org/packages/${pkg}/${ver}`);
        lines.push('');
      });

      lines.push(`Source: pursuit.purescript.org`);
      return lines.join('\n');

      function bumpMajor(ver) {
        const n = Number(ver.split('.')[0]);
        return isNaN(n) ? '9.0.0' : `${n + 1}.0.0`;
      }
    },

    // ── Nix / NixOS packages ────────────────────────────────────────────────────
    search_nix: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`❄️ Searching NixOS packages for "${query}"…`);

      const lines = [`❄️ NixOS Packages: "${query}"`, ''];

      // search.nixos.org exposes the same public Elasticsearch endpoint it uses
      // on its own frontend. The credentials are public in the nixos-search repo.
      try {
        const resp = await fetch(
          'https://search.nixos.org/backend/latest-42-nixos-unstable/_search',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Public key from github.com/NixOS/nixos-search (not a secret)
              Authorization:
                'Basic aWVSYVdoSGxtQUJVUDo5N2UyNGQ2MC02YWViLTQ1MmMtOGIyYS1mYTM0ZmU5MzhhYmU=',
            },
            body: JSON.stringify({
              from: 0,
              size: 5,
              query: {
                bool: {
                  must: [
                    {
                      multi_match: {
                        query,
                        fields: [
                          'package_attr_name^9',
                          'package_pname^6',
                          'package_attr_set^4',
                          'package_description^1',
                          'package_longDescription^0.25',
                        ],
                        type: 'best_fields',
                        analyzer: 'whitespace',
                      },
                    },
                  ],
                },
              },
              sort: [{ _score: 'desc' }, { 'package_attr_name.raw': 'asc' }],
            }),
          },
        );

        const data = await resp.json();
        const hits = data.hits?.hits ?? [];

        if (hits.length === 0) throw new Error('no results');

        const total = data.hits?.total?.value ?? hits.length;
        lines.push(`Found ~${Number(total).toLocaleString()} packages — top ${hits.length}:\n`);

        hits.forEach((hit, i) => {
          const s = hit._source ?? {};
          const attrName = s.package_attr_name ?? '?';
          const version = s.package_version ?? '?';
          const pname = s.package_pname ?? attrName;

          lines.push(`**${i + 1}. ${attrName}** — v${version}`);
          if (s.package_description) lines.push(`   ${s.package_description.slice(0, 150)}`);
          if (s.package_homepage?.[0]) lines.push(`   🏠 ${s.package_homepage[0]}`);
          if (s.package_license_set?.length)
            lines.push(
              `   📄 License: ${s.package_license_set
                .slice(0, 3)
                .map((l) => l.fullName ?? l)
                .join(', ')}`,
            );
          lines.push('');
          lines.push(`   📋 **shell.nix / nix-shell:** \`nix-shell -p ${pname}\``);
          lines.push(`   📋 **flake (pkgs):** \`pkgs.${attrName}\``);
          lines.push(
            `   🔗 https://search.nixos.org/packages?query=${encodeURIComponent(attrName)}`,
          );
          lines.push('');
        });
      } catch {
        // Fallback: DuckDuckGo scoped to search.nixos.org
        const ddg = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' site:search.nixos.org/packages')}&format=json&no_redirect=1&no_html=1`,
        ).then((r) => r.json());

        const related = (ddg.RelatedTopics ?? []).filter(
          (t) => t.Text && t.FirstURL?.includes('nixos.org'),
        );

        if (related.length > 0) {
          related.slice(0, 5).forEach((t, i) => {
            lines.push(`**${i + 1}.** ${t.Text.slice(0, 140)}`);
            lines.push(`   🔗 ${t.FirstURL}`);
            lines.push('');
          });
        } else {
          lines.push(`Could not fetch NixOS search results for "${query}".`);
          lines.push(`🔗 https://search.nixos.org/packages?query=${encodeURIComponent(query)}`);
          lines.push(`💡 Tip: Run \`nix search nixpkgs ${query}\` locally.`);
        }
      }

      lines.push(`Source: search.nixos.org`);
      return lines.join('\n');
    },

    // ── Go modules / pkg.go.dev ─────────────────────────────────────────────────
    search_go: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🐹 Searching Go modules for "${query}"…`);

      const lines = [`🐹 Go Modules: "${query}"`, ''];

      // pkg.go.dev has no public JSON search API — use GitHub search filtered to Go
      // as a practical approximation, then surface the official pkg.go.dev link.
      const ghData = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+language:Go&sort=stars&order=desc&per_page=5`,
        { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'search-tool/1.0' } },
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const items = ghData?.items ?? [];

      if (items.length > 0) {
        lines.push(`Top Go repositories on GitHub matching "${query}":\n`);

        items.forEach((repo, i) => {
          lines.push(`**${i + 1}. ${repo.full_name}**`);
          if (repo.description) lines.push(`   ${repo.description.slice(0, 150)}`);
          lines.push(
            `   ⭐ ${Number(repo.stargazers_count).toLocaleString()} stars  🍴 ${Number(repo.forks_count).toLocaleString()} forks`,
          );
          if (repo.updated_at) lines.push(`   🕒 Updated: ${repo.updated_at.slice(0, 10)}`);
          lines.push('');
          lines.push(`   📋 **go.mod:** \`require github.com/${repo.full_name} v0.0.0-latest\``);
          lines.push(`   📋 **go get:** \`go get github.com/${repo.full_name}\``);
          lines.push(`   🔗 https://pkg.go.dev/github.com/${repo.full_name}`);
          lines.push(`   🐙 ${repo.html_url}`);
          lines.push('');
        });
      } else {
        lines.push(`No results via GitHub search for "${query}".`);
      }

      lines.push(
        `🔗 **Official module search:** https://pkg.go.dev/search?q=${encodeURIComponent(query)}`,
      );
      lines.push('');
      lines.push(`Source: pkg.go.dev / github.com`);
      return lines.join('\n');
    },

    // ── C/C++ / Conan ────────────────────────────────────────────────────────────
    search_conan: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🍫 Searching ConanCenter for "${query}"…`);

      // ConanCenterIndex v2 — the public API used by the ConanCenter website
      const data = await fetch(
        `https://conan.io/center/api/ui/packages?q=${encodeURIComponent(query)}&page_size=5`,
        { headers: { Accept: 'application/json', 'User-Agent': 'search-tool/1.0' } },
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const lines = [`🍫 ConanCenter Search: "${query}"`, ''];

      const pkgs = data?.results ?? data?.packages ?? data?.data ?? [];

      if (pkgs.length === 0) {
        // DuckDuckGo fallback
        const ddg = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' site:conan.io/center')}&format=json&no_redirect=1&no_html=1`,
        ).then((r) => r.json());

        const related = (ddg.RelatedTopics ?? []).filter(
          (t) => t.Text && t.FirstURL?.includes('conan.io'),
        );

        if (related.length === 0) {
          lines.push(`No Conan packages found for "${query}".`);
          lines.push(`🔗 https://conan.io/center/recipes?q=${encodeURIComponent(query)}`);
          lines.push(`💡 Tip: Run \`conan search ${query} -r conancenter\` locally.`);
          return lines.join('\n');
        }

        related.slice(0, 5).forEach((t, i) => {
          lines.push(`**${i + 1}.** ${t.Text.slice(0, 140)}`);
          lines.push(`   🔗 ${t.FirstURL}`);
          lines.push('');
        });
        lines.push(`Source: conan.io/center`);
        return lines.join('\n');
      }

      pkgs.forEach((p, i) => {
        const name = p.name ?? p.id ?? p.package_name ?? 'Unknown';
        const version = p.version ?? p.latest_version ?? '?';

        lines.push(`**${i + 1}. ${name}** — v${version}`);
        if (p.description) lines.push(`   ${p.description.slice(0, 150)}`);
        if (p.license) lines.push(`   📄 License: ${p.license}`);
        if (p.downloads != null)
          lines.push(`   📥 ${Number(p.downloads).toLocaleString()} downloads`);
        lines.push('');
        lines.push(`   **conanfile.txt:**`);
        lines.push(`   \`[requires]\\n${name}/${version}\``);
        lines.push(`   📋 **CLI:** \`conan install --requires="${name}/${version}"\``);
        lines.push(`   🔗 https://conan.io/center/recipes/${name}`);
        lines.push('');
      });

      lines.push(`Source: conan.io/center`);
      return lines.join('\n');
    },

    // ── C/C++ / vcpkg ────────────────────────────────────────────────────────────
    search_vcpkg: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`📦 Searching vcpkg ports for "${query}"…`);

      const lines = [`📦 vcpkg Search: "${query}"`, ''];

      // Try exact port lookup via GitHub raw contents
      const exactManifest = await fetch(
        `https://raw.githubusercontent.com/microsoft/vcpkg/master/ports/${encodeURIComponent(query.toLowerCase())}/vcpkg.json`,
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (exactManifest) {
        lines.push(
          `**${exactManifest.name ?? query}** — v${exactManifest.version ?? exactManifest['version-semver'] ?? exactManifest['version-date'] ?? '?'}`,
        );
        if (exactManifest.description) {
          const desc = Array.isArray(exactManifest.description)
            ? exactManifest.description.join(' ')
            : exactManifest.description;
          lines.push(`   ${desc.slice(0, 200)}`);
        }
        if (exactManifest.homepage) lines.push(`   🏠 ${exactManifest.homepage}`);

        const deps = (exactManifest.dependencies ?? [])
          .map((d) => (typeof d === 'string' ? d : d.name))
          .filter(Boolean)
          .slice(0, 8)
          .join(', ');
        if (deps) lines.push(`   🔗 Dependencies: ${deps}`);

        const features = Object.keys(exactManifest.features ?? {})
          .slice(0, 6)
          .join(', ');
        if (features) lines.push(`   ✨ Features: ${features}`);

        lines.push('');
        lines.push(`   📋 **Install (classic):** \`vcpkg install ${exactManifest.name ?? query}\``);
        lines.push(`   📋 **Install (manifest):** Add to \`vcpkg.json\`:`);
        lines.push(
          `   \`{ "name": "${exactManifest.name ?? query}", "version>=": "${exactManifest.version ?? ''}" }\``,
        );
        lines.push(`   🔗 https://vcpkg.io/en/package/${exactManifest.name ?? query}`);
        lines.push(
          `   🐙 https://github.com/microsoft/vcpkg/tree/master/ports/${exactManifest.name ?? query}`,
        );
      } else {
        // Search via GitHub Code Search API (searches port vcpkg.json files)
        const ghSearch = await fetch(
          `https://api.github.com/search/code?q=${encodeURIComponent(query)}+repo:microsoft/vcpkg+path:ports+filename:vcpkg.json&per_page=6`,
          { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'search-tool/1.0' } },
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        const items = ghSearch?.items ?? [];

        if (items.length === 0) {
          lines.push(`No vcpkg ports found for "${query}".`);
          lines.push(`🔗 https://vcpkg.io/en/packages.html`);
          lines.push(`💡 Run \`vcpkg search ${query}\` locally.`);
          return lines.join('\n');
        }

        lines.push(`Matching vcpkg ports:\n`);
        items.forEach((item, i) => {
          // Path is like "ports/zlib/vcpkg.json" — extract port name
          const portName = item.path?.split('/')[1] ?? item.name;
          lines.push(`**${i + 1}. ${portName}**`);
          lines.push(`   📋 \`vcpkg install ${portName}\``);
          lines.push(`   🔗 https://vcpkg.io/en/package/${portName}`);
          lines.push('');
        });
      }

      lines.push(`Source: github.com/microsoft/vcpkg`);
      return lines.join('\n');
    },

    // ── Haxe / Haxelib ──────────────────────────────────────────────────────────
    search_haxelib: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`⚡ Searching Haxelib for "${query}"…`);

      const lines = [`⚡ Haxelib Search: "${query}"`, ''];

      // lib.haxe.org exposes package JSON at /p/NAME.json
      const exact = await fetch(`https://lib.haxe.org/p/${encodeURIComponent(query)}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (exact) {
        const latest =
          exact.curversion ?? exact.current_version ?? (exact.versions ?? []).slice(-1)[0] ?? '?';
        lines.push(`**${exact.name ?? query}** — v${latest}`);
        if (exact.desc) lines.push(`   ${exact.desc.slice(0, 200)}`);
        if (exact.website) lines.push(`   🏠 ${exact.website}`);
        if (exact.owner) lines.push(`   👤 ${exact.owner}`);
        if (exact.license) lines.push(`   📄 License: ${exact.license}`);
        if (exact.tags?.length) lines.push(`   🏷  ${exact.tags.slice(0, 6).join(', ')}`);
        if (exact.versions?.length) lines.push(`   📦 ${exact.versions.length} versions available`);
        lines.push('');
        lines.push(`   **haxelib.json:**`);
        lines.push(`   \`"dependencies": { "${exact.name ?? query}": "${latest}" }\``);
        lines.push(`   📋 **Install:** \`haxelib install ${exact.name ?? query}\``);
        lines.push(`   🔗 https://lib.haxe.org/p/${exact.name ?? query}`);
      } else {
        const ddg = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' site:lib.haxe.org/p')}&format=json&no_redirect=1&no_html=1`,
        ).then((r) => r.json());

        const related = (ddg.RelatedTopics ?? []).filter(
          (t) => t.Text && t.FirstURL?.includes('lib.haxe.org'),
        );

        if (related.length === 0) {
          lines.push(`No Haxelib results for "${query}".`);
          lines.push(`🔗 https://lib.haxe.org/search/?v=${encodeURIComponent(query)}`);
          lines.push(`💡 Run \`haxelib search ${query}\` locally.`);
          return lines.join('\n');
        }

        related.slice(0, 5).forEach((t, i) => {
          const name = t.FirstURL.split('/p/')[1]?.split('/')[0] ?? '';
          lines.push(`**${i + 1}. ${name || t.Text.slice(0, 40)}**`);
          if (t.Text) lines.push(`   ${t.Text.slice(0, 150)}`);
          if (name) lines.push(`   📋 \`haxelib install ${name}\``);
          lines.push(`   🔗 ${t.FirstURL}`);
          lines.push('');
        });
      }

      lines.push(`Source: lib.haxe.org`);
      return lines.join('\n');
    },

    // ── Racket ───────────────────────────────────────────────────────────────────
    search_racket: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🎭 Searching Racket packages for "${query}"…`);

      // pkgs.racket-lang.org exposes all packages as JSON
      const allPkgs = await fetch('https://pkgs.racket-lang.org/pkgs-all.json')
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}));

      const lines = [`🎭 Racket Packages: "${query}"`, ''];

      if (Object.keys(allPkgs).length === 0) {
        lines.push(`Could not reach the Racket package catalog.`);
        lines.push(`🔗 https://pkgs.racket-lang.org/`);
        return lines.join('\n');
      }

      const q = query.toLowerCase();
      const matches = Object.entries(allPkgs)
        .filter(([name, info]) => {
          const desc = (info.description ?? '').toLowerCase();
          const tags = (info.tags ?? []).join(' ').toLowerCase();
          return name.toLowerCase().includes(q) || desc.includes(q) || tags.includes(q);
        })
        .slice(0, 6);

      if (matches.length === 0) {
        lines.push(
          `No Racket packages match "${query}" in ${Object.keys(allPkgs).length.toLocaleString()} packages.`,
        );
        lines.push(`🔗 https://pkgs.racket-lang.org/?search=${encodeURIComponent(query)}`);
        return lines.join('\n');
      }

      lines.push(
        `Found ${matches.length} match${matches.length === 1 ? '' : 'es'} in ${Object.keys(allPkgs).length.toLocaleString()} packages:\n`,
      );

      matches.forEach(([name, info], i) => {
        lines.push(`**${i + 1}. ${name}**`);
        if (info.description) lines.push(`   ${info.description.slice(0, 150)}`);

        const author = info.authors?.[0] ?? info.author;
        if (author) lines.push(`   👤 ${author}`);

        const tags = (info.tags ?? []).slice(0, 5).join(', ');
        if (tags) lines.push(`   🏷  ${tags}`);

        if (info.last_updated) lines.push(`   📅 Updated: ${info.last_updated.slice(0, 10)}`);

        lines.push(`   📋 **Install:** \`raco pkg install ${name}\``);
        lines.push(`   📋 **require:** \`(require ${name})\``);
        lines.push(`   🔗 https://pkgs.racket-lang.org/package/${name}`);
        lines.push('');
      });

      lines.push(`Source: pkgs.racket-lang.org`);
      return lines.join('\n');
    },

    // ── Spack (HPC / Scientific Computing) ─────────────────────────────────────
    search_spack: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🔬 Searching Spack packages for "${query}"…`);

      const lines = [`🔬 Spack Packages: "${query}"`, ''];

      // Spack package list from GitHub API (official source)
      const ghContents = await fetch(
        `https://api.github.com/repos/spack/spack/contents/var/spack/repos/builtin/packages`,
        { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'search-tool/1.0' } },
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (Array.isArray(ghContents)) {
        const q = query.toLowerCase();
        const matches = ghContents
          .filter((entry) => entry.type === 'dir' && entry.name.toLowerCase().includes(q))
          .slice(0, 6);

        if (matches.length > 0) {
          lines.push(`Spack packages matching "${query}":\n`);

          await Promise.all(
            matches.map(async (pkg, i) => {
              // Fetch package.py to extract description
              const raw = await fetch(
                `https://raw.githubusercontent.com/spack/spack/develop/var/spack/repos/builtin/packages/${pkg.name}/package.py`,
              )
                .then((r) => (r.ok ? r.text() : ''))
                .catch(() => '');

              const descMatch = raw.match(/description\s*=\s*["'](.*?)["']/s);
              const urlMatch = raw.match(/homepage\s*=\s*["'](.*?)["']/);
              const verMatch = raw.match(/version\(\s*["']([^"']+)["']/);

              lines.push(`**${i + 1}. ${pkg.name}**`);
              if (descMatch) lines.push(`   ${descMatch[1].replace(/\s+/g, ' ').slice(0, 150)}`);
              if (verMatch) lines.push(`   🏷  Latest in package.py: ${verMatch[1]}`);
              if (urlMatch) lines.push(`   🏠 ${urlMatch[1]}`);
              lines.push(`   📋 **Install:** \`spack install ${pkg.name}\``);
              lines.push(`   🔗 https://packages.spack.io/package.html?name=${pkg.name}`);
              lines.push('');
            }),
          );

          lines.push(`Source: github.com/spack/spack`);
          return lines.join('\n');
        }
      }

      // DuckDuckGo fallback
      const ddg = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' site:packages.spack.io')}&format=json&no_redirect=1&no_html=1`,
      ).then((r) => r.json());

      const related = (ddg.RelatedTopics ?? []).filter(
        (t) => t.Text && t.FirstURL?.includes('spack'),
      );

      if (related.length === 0) {
        lines.push(`No Spack packages found for "${query}".`);
        lines.push(`🔗 https://packages.spack.io/?search=${encodeURIComponent(query)}`);
        lines.push(`💡 Run \`spack list ${query}\` locally.`);
        return lines.join('\n');
      }

      related.slice(0, 5).forEach((t, i) => {
        lines.push(`**${i + 1}.** ${t.Text.slice(0, 140)}`);
        lines.push(`   🔗 ${t.FirstURL}`);
        lines.push('');
      });

      lines.push(`Source: packages.spack.io`);
      return lines.join('\n');
    },

    // ── Meson WrapDB ────────────────────────────────────────────────────────────
    search_meson_wrap: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🔧 Searching Meson WrapDB for "${query}"…`);

      // WrapDB v2 exposes a full releases JSON
      const data = await fetch('https://wrapdb.mesonbuild.com/v2/releases.json')
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}));

      const lines = [`🔧 Meson WrapDB: "${query}"`, ''];

      if (Object.keys(data).length === 0) {
        lines.push(`Could not reach WrapDB.`);
        lines.push(`🔗 https://wrapdb.mesonbuild.com/`);
        return lines.join('\n');
      }

      const q = query.toLowerCase();
      const matches = Object.entries(data)
        .filter(([name]) => name.toLowerCase().includes(q))
        .slice(0, 6);

      if (matches.length === 0) {
        lines.push(`No WrapDB wraps match "${query}".`);
        lines.push(`🔗 https://wrapdb.mesonbuild.com/`);
        lines.push(`💡 Run \`meson wrap search ${query}\` locally.`);
        return lines.join('\n');
      }

      lines.push(
        `Wraps matching "${query}" (${Object.keys(data).length.toLocaleString()} total):\n`,
      );

      matches.forEach(([name, info], i) => {
        const versions = info.versions ?? [];
        const latest = versions[0] ?? '?';
        lines.push(`**${i + 1}. ${name}** — ${latest}`);

        if (versions.length > 1)
          lines.push(
            `   📦 ${versions.length} wrap versions (${versions.slice(0, 4).join(', ')}${versions.length > 4 ? '…' : ''})`,
          );

        if (info.dependency_names?.length)
          lines.push(`   🔗 Provides: ${info.dependency_names.slice(0, 4).join(', ')}`);

        lines.push(`   📋 **Install:** \`meson wrap install ${name}\``);
        lines.push(
          `   📋 **or (subprojects/packagefiles):** \`meson wrap update-db && meson wrap install ${name}\``,
        );
        lines.push(`   🔗 https://wrapdb.mesonbuild.com/v2/${name}/${latest}/wrap`);
        lines.push('');
      });

      lines.push(`Source: wrapdb.mesonbuild.com`);
      return lines.join('\n');
    },

    // ── Windows / Scoop ──────────────────────────────────────────────────────────
    search_scoop: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🥄 Searching Scoop buckets for "${query}"…`);

      const lines = [`🥄 Scoop Search: "${query}"`, ''];

      // The ScoopInstaller website aggregates buckets and publishes apps.json
      const appsData = await fetch('https://scoopinstaller.github.io/assets/apps.json')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (Array.isArray(appsData) && appsData.length > 0) {
        const q = query.toLowerCase();
        const matches = appsData
          .filter(
            (app) =>
              app.Name?.toLowerCase().includes(q) || app.Description?.toLowerCase().includes(q),
          )
          .slice(0, 6);

        if (matches.length > 0) {
          lines.push(
            `Scoop apps matching "${query}" (${appsData.length.toLocaleString()} total):\n`,
          );

          matches.forEach((app, i) => {
            lines.push(`**${i + 1}. ${app.Name}**`);
            if (app.Description) lines.push(`   ${app.Description.slice(0, 150)}`);
            if (app.Version) lines.push(`   🏷  v${app.Version}`);
            if (app.Bucket) lines.push(`   🪣 Bucket: ${app.Bucket}`);
            if (app.Homepage) lines.push(`   🏠 ${app.Homepage}`);
            lines.push(`   📋 **Install:** \`scoop install ${app.Name.toLowerCase()}\``);
            lines.push('');
          });

          lines.push(`Source: scoopinstaller.github.io`);
          return lines.join('\n');
        }
      }

      // Fallback: search the main bucket via GitHub contents API
      const exactManifest = await fetch(
        `https://raw.githubusercontent.com/ScoopInstaller/Main/master/bucket/${encodeURIComponent(query.toLowerCase())}.json`,
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      if (exactManifest) {
        lines.push(`**${query}** — v${exactManifest.version ?? '?'}`);
        if (exactManifest.description) lines.push(`   ${exactManifest.description}`);
        if (exactManifest.homepage) lines.push(`   🏠 ${exactManifest.homepage}`);
        if (exactManifest.license) lines.push(`   📄 License: ${exactManifest.license}`);
        lines.push(`   📋 **Install:** \`scoop install ${query.toLowerCase()}\``);
        lines.push(`   🔗 https://scoop.sh/#/apps?q=${encodeURIComponent(query)}`);
      } else {
        lines.push(`No exact Scoop manifest found for "${query}".`);
        lines.push(`🔗 https://scoop.sh/#/apps?q=${encodeURIComponent(query)}`);
        lines.push(`💡 Run \`scoop search ${query}\` locally (searches all added buckets).`);
      }

      lines.push('');
      lines.push(`Source: scoopinstaller.github.io / github.com/ScoopInstaller`);
      return lines.join('\n');
    },

    // ── Windows / winget ─────────────────────────────────────────────────────────
    search_winget: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`🪟 Searching winget packages for "${query}"…`);

      // winget.run is a community frontend backed by the official microsoft/winget-pkgs repo
      const data = await fetch(
        `https://winget.run/api/v2/packages?query=${encodeURIComponent(query)}`,
        { headers: { Accept: 'application/json', 'User-Agent': 'search-tool/1.0' } },
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const lines = [`🪟 winget Search: "${query}"`, ''];

      const pkgs = data?.Packages ?? data?.packages ?? data?.results ?? [];

      if (pkgs.length > 0) {
        pkgs.slice(0, 5).forEach((p, i) => {
          const id = p.Identifier ?? p.id ?? p.PackageIdentifier ?? '?';
          const name = p.Name ?? p.name ?? p.PackageName ?? id;
          const publisher = p.Publisher ?? p.publisher ?? '';
          const version = p.Version ?? p.version ?? p.LatestVersion ?? '?';
          const desc = p.Description ?? p.description ?? '';

          lines.push(`**${i + 1}. ${name}** — v${version}`);
          lines.push(`   🆔 \`${id}\``);
          if (publisher) lines.push(`   🏢 ${publisher}`);
          if (desc) lines.push(`   ${desc.slice(0, 150)}`);
          lines.push(`   📋 **Install:** \`winget install --id ${id} -e\``);
          lines.push(`   🔗 https://winget.run/pkg/${id.replace('.', '/')}`);
          lines.push('');
        });

        lines.push(`Source: winget.run (mirrors microsoft/winget-pkgs)`);
        return lines.join('\n');
      }

      // Fallback: GitHub code search on the official winget-pkgs repo
      const ghSearch = await fetch(
        `https://api.github.com/search/code?q=${encodeURIComponent(query)}+repo:microsoft/winget-pkgs+path:manifests+filename:installer.yaml&per_page=5`,
        { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'search-tool/1.0' } },
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const items = ghSearch?.items ?? [];

      if (items.length === 0) {
        lines.push(`No winget packages found for "${query}".`);
        lines.push(`🔗 https://winget.run/?query=${encodeURIComponent(query)}`);
        lines.push(`💡 Run \`winget search "${query}"\` on Windows.`);
        return lines.join('\n');
      }

      items.forEach((item, i) => {
        // Path: manifests/p/Publisher/App/version/App.installer.yaml
        const parts = item.path?.split('/') ?? [];
        const id = parts.length >= 4 ? `${parts[2]}.${parts[3]}` : item.name;
        lines.push(`**${i + 1}. ${id}**`);
        lines.push(`   📋 \`winget install --id ${id} -e\``);
        lines.push(`   🔗 https://winget.run/pkg/${id.replace('.', '/')}`);
        lines.push('');
      });

      lines.push(`Source: github.com/microsoft/winget-pkgs`);
      return lines.join('\n');
    },

    // ── LaTeX / CTAN ─────────────────────────────────────────────────────────────
    search_ctan: async (params, onStage) => {
      const { query } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');

      onStage(`📐 Searching CTAN for "${query}"…`);

      const lines = [`📐 CTAN Search: "${query}"`, ''];

      // CTAN exposes an official JSON API
      const searchData = await fetch(
        `https://ctan.org/json/2.0/search?phrase=${encodeURIComponent(query)}&max=5`,
        { headers: { Accept: 'application/json' } },
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const results = searchData?.result ?? searchData?.results ?? [];

      if (results.length === 0) {
        // Try exact package lookup
        const exact = await fetch(`https://ctan.org/json/2.0/pkg/${encodeURIComponent(query)}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        if (exact) {
          results.push({ id: exact.id, name: exact.name, caption: exact.caption, _exact: exact });
        } else {
          lines.push(`No CTAN packages found for "${query}".`);
          lines.push(`🔗 https://ctan.org/search?phrase=${encodeURIComponent(query)}`);
          return lines.join('\n');
        }
      }

      await Promise.all(
        results.slice(0, 5).map(async (r, i) => {
          const pkgId = r.id ?? r.pkg ?? r.key;
          let detail = r._exact;
          if (!detail && pkgId) {
            detail = await fetch(`https://ctan.org/json/2.0/pkg/${pkgId}`)
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null);
          }

          const name = detail?.name ?? r.name?.text ?? r.name ?? pkgId ?? 'Unknown';
          const caption = detail?.caption ?? r.caption ?? '';
          const version = detail?.version?.number ?? detail?.version ?? '';
          const desc = detail?.description ?? '';
          const authors = (detail?.authors ?? [])
            .map((a) => a.givenname + ' ' + a.familyname)
            .slice(0, 3)
            .join(', ');
          const license = (detail?.licenses ?? [])
            .map((l) => l.text ?? l.id)
            .slice(0, 2)
            .join(', ');
          const docs = detail?.documentation?.[0]?.href;
          const ctan = `https://ctan.org/pkg/${pkgId}`;
          const texlive = detail?.['tex-archive'];

          lines.push(`**${i + 1}. ${name}**${version ? ` — v${version}` : ''}`);
          if (caption) lines.push(`   ${caption}`);
          if (desc)
            lines.push(
              `   ${desc
                .replace(/<[^>]+>/g, '')
                .replace(/\s+/g, ' ')
                .slice(0, 200)}`,
            );
          if (authors) lines.push(`   👤 ${authors}`);
          if (license) lines.push(`   📄 License: ${license}`);
          lines.push('');
          lines.push(`   **LaTeX usage:**`);
          lines.push(`   \`\\usepackage{${pkgId ?? name}}\``);
          if (texlive) lines.push(`   📋 **tlmgr:** \`tlmgr install ${pkgId ?? name}\``);
          lines.push(`   🔗 ${ctan}`);
          if (docs) lines.push(`   📚 Docs: https://ctan.org${docs}`);
          lines.push('');
        }),
      );

      lines.push(`Source: ctan.org`);
      return lines.join('\n');
    },
  },
});
