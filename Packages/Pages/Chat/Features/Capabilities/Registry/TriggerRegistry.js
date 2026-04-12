/**
 * TriggerRegistry.js
 *
 * Central registry of trigger-word mappings for all capabilities.
 * Determines which tool groups are relevant to a user's message
 * by matching against trigger keywords from each capability's Trigger.js.
 *
 * Default tools (Terminal, Search, Utility, Memory, SubAgents) are always
 * loaded and do NOT appear here. Only trigger-gated capabilities are listed.
 */

// ─── Internal capability triggers ────────────────────────────────────
import { Trigger as WeatherTrigger } from '../Weather/Trigger.js';
import { Trigger as CryptoTrigger } from '../Crypto/Trigger.js';
import { Trigger as FinanceTrigger } from '../Finance/Trigger.js';
import { Trigger as PhotoTrigger } from '../Photo/Trigger.js';
import { Trigger as WikiTrigger } from '../Wiki/Trigger.js';
import { Trigger as GeoTrigger } from '../Geo/Trigger.js';
import { Trigger as FunTrigger } from '../Fun/Trigger.js';
import { Trigger as JokeTrigger } from '../Joke/Trigger.js';
import { Trigger as QuoteTrigger } from '../Quote/Trigger.js';
import { Trigger as AstronomyTrigger } from '../Astronomy/Trigger.js';
import { Trigger as HackerNewsTrigger } from '../HackerNews/Trigger.js';
import { Trigger as UrlTrigger } from '../Url/Trigger.js';
import { Trigger as DictionaryTrigger } from '../Dictionary/Trigger.js';
import { Trigger as DateTimeTrigger } from '../DateTime/Trigger.js';
import { Trigger as PasswordTrigger } from '../Password/Trigger.js';
import { Trigger as CountryTrigger } from '../Country/Trigger.js';

// ─── External capability triggers ────────────────────────────────────
import { Trigger as GithubTrigger } from '../../../../../Capabilities/Github/Core/Trigger.js';
import { Trigger as GitlabTrigger } from '../../../../../Capabilities/Gitlab/Core/Trigger.js';
import { Trigger as CalendarTrigger } from '../../../../../Capabilities/Google/Calendar/Core/Trigger.js';
import { Trigger as ContactsTrigger } from '../../../../../Capabilities/Google/Contacts/Core/Trigger.js';
import { Trigger as DocsTrigger } from '../../../../../Capabilities/Google/Docs/Core/Trigger.js';
import { Trigger as DriveTrigger } from '../../../../../Capabilities/Google/Drive/Core/Trigger.js';
import { Trigger as FormsTrigger } from '../../../../../Capabilities/Google/Forms/Core/Trigger.js';
import { Trigger as GmailTrigger } from '../../../../../Capabilities/Google/Gmail/Core/Trigger.js';
import { Trigger as GooglePhotosTrigger } from '../../../../../Capabilities/Google/Photos/Core/Trigger.js';
import { Trigger as SheetsTrigger } from '../../../../../Capabilities/Google/Sheets/Core/Trigger.js';
import { Trigger as SlidesTrigger } from '../../../../../Capabilities/Google/Slides/Core/Trigger.js';
import { Trigger as TasksTrigger } from '../../../../../Capabilities/Google/Tasks/Core/Trigger.js';
import { Trigger as YoutubeTrigger } from '../../../../../Capabilities/Google/Youtube/Core/Trigger.js';

/**
 * Each triggered group maps a capability name to:
 *   triggers          – array of trigger words/phrases from the Trigger.js
 *   description       – human-readable summary (used in AI catalog)
 *   featureCategories – tool.category values that belong to this group
 *                       (used to match feature-boot / external tools)
 */
export const TRIGGERED_GROUPS = [
  // ── Internal capabilities (tools defined in STATIC_TOOLS) ──────────
  {
    name: 'weather',
    description: 'Weather forecasts, temperature, and conditions',
    triggers: WeatherTrigger,
    featureCategories: ['open_meteo', 'openweathermap'],
  },
  {
    name: 'crypto',
    description: 'Cryptocurrency prices and market data',
    triggers: CryptoTrigger,
    featureCategories: ['coingecko'],
  },
  {
    name: 'finance',
    description: 'Finance, stocks, currency exchange, and economics',
    triggers: FinanceTrigger,
    featureCategories: ['exchange_rate', 'treasury', 'fred'],
  },
  {
    name: 'photo',
    description: 'Photo search from Unsplash',
    triggers: PhotoTrigger,
    featureCategories: ['unsplash'],
  },
  {
    name: 'wiki',
    description: 'Wikipedia article lookup and encyclopedia knowledge',
    triggers: WikiTrigger,
    featureCategories: ['wikipedia'],
  },
  {
    name: 'geo',
    description: 'IP geolocation and location data',
    triggers: GeoTrigger,
    featureCategories: ['ipgeo'],
  },
  {
    name: 'fun',
    description: 'Fun facts and trivia',
    triggers: FunTrigger,
    featureCategories: ['funfacts'],
  },
  {
    name: 'joke',
    description: 'Random jokes',
    triggers: JokeTrigger,
    featureCategories: ['jokeapi'],
  },
  {
    name: 'quote',
    description: 'Inspirational and famous quotes',
    triggers: QuoteTrigger,
    featureCategories: ['quotes'],
  },
  {
    name: 'astronomy',
    description: 'Astronomy data and NASA imagery',
    triggers: AstronomyTrigger,
    featureCategories: ['nasa'],
  },
  {
    name: 'hackernews',
    description: 'Hacker News stories and discussions',
    triggers: HackerNewsTrigger,
    featureCategories: ['hackernews'],
  },
  {
    name: 'url',
    description: 'URL shortening and link tools',
    triggers: UrlTrigger,
    featureCategories: ['cleanuri'],
  },
  {
    name: 'dictionary',
    description: 'Dictionary definitions, word lookups, and translations',
    triggers: DictionaryTrigger,
    featureCategories: ['dictionary', 'translate'],
  },
  {
    name: 'datetime',
    description: 'Date and time calculations and scheduling helpers',
    triggers: DateTimeTrigger,
    featureCategories: ['datetime'],
  },
  {
    name: 'password',
    description: 'Password generation and security utilities',
    triggers: PasswordTrigger,
    featureCategories: ['security'],
  },
  {
    name: 'country',
    description: 'Country information, flags, capitals, and demographics',
    triggers: CountryTrigger,
    featureCategories: ['restcountries'],
  },

  // ── External capabilities (tools loaded via featureBoot) ───────────
  {
    name: 'github',
    description: 'GitHub repos, pull requests, issues, and actions',
    triggers: GithubTrigger,
    featureCategories: ['github', 'github_review'],
  },
  {
    name: 'gitlab',
    description: 'GitLab repos, merge requests, and CI/CD pipelines',
    triggers: GitlabTrigger,
    featureCategories: ['gitlab'],
  },
  {
    name: 'google_calendar',
    description: 'Google Calendar events and scheduling',
    triggers: CalendarTrigger,
    featureCategories: ['calendar'],
  },
  {
    name: 'google_contacts',
    description: 'Google Contacts management',
    triggers: ContactsTrigger,
    featureCategories: ['contacts'],
  },
  {
    name: 'google_docs',
    description: 'Google Docs document management',
    triggers: DocsTrigger,
    featureCategories: ['docs'],
  },
  {
    name: 'google_drive',
    description: 'Google Drive file management',
    triggers: DriveTrigger,
    featureCategories: ['drive'],
  },
  {
    name: 'google_forms',
    description: 'Google Forms management',
    triggers: FormsTrigger,
    featureCategories: ['forms'],
  },
  {
    name: 'google_gmail',
    description: 'Gmail email management',
    triggers: GmailTrigger,
    featureCategories: ['gmail'],
  },
  {
    name: 'google_photos',
    description: 'Google Photos management',
    triggers: GooglePhotosTrigger,
    featureCategories: ['photos'],
  },
  {
    name: 'google_sheets',
    description: 'Google Sheets spreadsheet management',
    triggers: SheetsTrigger,
    featureCategories: ['sheets'],
  },
  {
    name: 'google_slides',
    description: 'Google Slides presentation management',
    triggers: SlidesTrigger,
    featureCategories: ['slides'],
  },
  {
    name: 'google_tasks',
    description: 'Google Tasks management',
    triggers: TasksTrigger,
    featureCategories: ['tasks'],
  },
  {
    name: 'google_youtube',
    description: 'YouTube video management',
    triggers: YoutubeTrigger,
    featureCategories: ['youtube'],
  },
];

/* ══════════════════════════════════════════════════════════════════════
   PRE-PROCESSING — build efficient lookup structures once at import
   ══════════════════════════════════════════════════════════════════════ */

for (const group of TRIGGERED_GROUPS) {
  group._singleWords = new Set();
  group._phrases = [];
  for (const trigger of group.triggers) {
    const t = String(trigger).trim().toLowerCase();
    if (!t) continue;
    if (t.includes(' ')) {
      group._phrases.push(t);
    } else {
      group._singleWords.add(t);
    }
  }
}

// Category → group-name lookup (for matching feature-boot tools)
const _categoryToGroup = new Map();
for (const group of TRIGGERED_GROUPS) {
  for (const cat of group.featureCategories) {
    _categoryToGroup.set(cat, group.name);
  }
}

/* ══════════════════════════════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Match user text against all trigger groups.
 * @param {string} userText — the user's raw message content
 * @returns {Set<string>} — set of group names whose triggers matched
 */
export function matchTriggeredGroups(userText = '') {
  const text = String(userText ?? '')
    .trim()
    .toLowerCase();
  if (!text) return new Set();

  const words = text.match(/[a-z0-9]+/g) ?? [];
  const matched = new Set();

  for (const group of TRIGGERED_GROUPS) {
    // Multi-word phrases — substring match (more specific)
    let found = group._phrases.some((phrase) => text.includes(phrase));

    if (!found) {
      // Single words — exact Set lookup
      found = words.some((word) => group._singleWords.has(word));
    }

    if (found) matched.add(group.name);
  }

  return matched;
}

/**
 * Given a tool category string, return the trigger group name it belongs to.
 * Returns null if the category is not mapped to any triggered group.
 */
export function groupForCategory(category = '') {
  return _categoryToGroup.get(category) ?? null;
}

/**
 * Build a concise catalog of all triggered tool groups for the AI to review.
 * Used by the request_all_tools meta-tool response.
 */
export function buildTriggeredGroupCatalog() {
  return TRIGGERED_GROUPS.map((group) => {
    const sample = group.triggers.slice(0, 5).join(', ');
    return `- ${group.name}: ${group.description} (e.g. ${sample})`;
  }).join('\n');
}
