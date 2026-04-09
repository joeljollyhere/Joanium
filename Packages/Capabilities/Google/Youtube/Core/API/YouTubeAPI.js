async function getFreshGoogleCreds(creds) {
  const { getFreshCreds } = await import('../../../GoogleWorkspace.js');
  return getFreshCreds(creds);
}

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

async function ytFetch(creds, url, options = {}) {
  const fresh = await getFreshGoogleCreds(creds);
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${fresh.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `YouTube API error (${res.status}): ${body.error?.message ?? JSON.stringify(body)}`,
    );
  }

  if (res.status === 204) return null;
  return res.json();
}

export function parseDuration(iso = '') {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h ` : '';
  const m = match[2] ? `${match[2]}m ` : '';
  const s = match[3] ? `${match[3]}s` : '';
  return `${h}${m}${s}`.trim() || '0s';
}

export function formatCount(n) {
  const num = Number(n ?? 0);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export async function getMyChannel(creds) {
  const data = await ytFetch(
    creds,
    `${YT_BASE}/channels?part=snippet,statistics,brandingSettings&mine=true`,
  );
  return data.items?.[0] ?? null;
}

export async function searchVideos(
  creds,
  query,
  { maxResults = 10, order = 'relevance', type = 'video' } = {},
) {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type,
    maxResults: String(Math.min(maxResults, 50)),
    order,
  });
  const data = await ytFetch(creds, `${YT_BASE}/search?${params}`);
  return data.items ?? [];
}

export async function getVideoDetails(creds, videoId) {
  const data = await ytFetch(
    creds,
    `${YT_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoId}`,
  );
  return data.items?.[0] ?? null;
}

export async function getMultipleVideos(creds, videoIds = []) {
  if (!videoIds.length) return [];
  const data = await ytFetch(
    creds,
    `${YT_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}`,
  );
  return data.items ?? [];
}

export async function listMyPlaylists(creds, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    mine: 'true',
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/playlists?${params}`);
  return data.items ?? [];
}

export async function getPlaylistItems(creds, playlistId, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/playlistItems?${params}`);
  return data.items ?? [];
}

export async function listSubscriptions(creds, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet',
    mine: 'true',
    order: 'alphabetical',
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/subscriptions?${params}`);
  return data.items ?? [];
}

export async function getLikedVideos(creds, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    myRating: 'like',
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/videos?${params}`);
  return data.items ?? [];
}

export async function getVideoComments(creds, videoId, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet',
    videoId,
    maxResults: String(Math.min(maxResults, 100)),
    order: 'relevance',
  });
  const data = await ytFetch(creds, `${YT_BASE}/commentThreads?${params}`);
  return data.items ?? [];
}

export async function rateVideo(creds, videoId, rating) {
  const validRatings = ['like', 'dislike', 'none'];
  if (!validRatings.includes(rating))
    throw new Error(`Invalid rating. Must be one of: ${validRatings.join(', ')}`);
  await ytFetch(creds, `${YT_BASE}/videos/rate?id=${videoId}&rating=${rating}`, { method: 'POST' });
  return true;
}

export async function listMyVideos(creds, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet',
    forMine: 'true',
    type: 'video',
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/search?${params}`);
  return data.items ?? [];
}

export async function getChannelById(creds, channelId) {
  const data = await ytFetch(creds, `${YT_BASE}/channels?part=snippet,statistics&id=${channelId}`);
  return data.items?.[0] ?? null;
}

export async function getChannelVideos(creds, channelId, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId,
    type: 'video',
    maxResults: String(Math.min(maxResults, 50)),
    order: 'date',
  });
  const data = await ytFetch(creds, `${YT_BASE}/search?${params}`);
  return data.items ?? [];
}

export async function createPlaylist(
  creds,
  { title, description = '', privacyStatus = 'private' },
) {
  return ytFetch(creds, `${YT_BASE}/playlists?part=snippet,status`, {
    method: 'POST',
    body: JSON.stringify({
      snippet: { title, description },
      status: { privacyStatus },
    }),
  });
}

export async function updatePlaylist(creds, playlistId, { title, description, privacyStatus }) {
  const body = { id: playlistId, snippet: {}, status: {} };
  if (title !== undefined) body.snippet.title = title;
  if (description !== undefined) body.snippet.description = description;
  if (privacyStatus !== undefined) body.status.privacyStatus = privacyStatus;
  return ytFetch(creds, `${YT_BASE}/playlists?part=snippet,status`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deletePlaylist(creds, playlistId) {
  await ytFetch(creds, `${YT_BASE}/playlists?id=${encodeURIComponent(playlistId)}`, {
    method: 'DELETE',
  });
  return true;
}

export async function addVideoToPlaylist(creds, playlistId, videoId) {
  return ytFetch(creds, `${YT_BASE}/playlistItems?part=snippet`, {
    method: 'POST',
    body: JSON.stringify({
      snippet: {
        playlistId,
        resourceId: { kind: 'youtube#video', videoId },
      },
    }),
  });
}

export async function removePlaylistItem(creds, playlistItemId) {
  await ytFetch(creds, `${YT_BASE}/playlistItems?id=${encodeURIComponent(playlistItemId)}`, {
    method: 'DELETE',
  });
  return true;
}

export async function subscribeToChannel(creds, channelId) {
  return ytFetch(creds, `${YT_BASE}/subscriptions?part=snippet`, {
    method: 'POST',
    body: JSON.stringify({
      snippet: { resourceId: { kind: 'youtube#channel', channelId } },
    }),
  });
}

export async function unsubscribeFromChannel(creds, subscriptionId) {
  await ytFetch(creds, `${YT_BASE}/subscriptions?id=${encodeURIComponent(subscriptionId)}`, {
    method: 'DELETE',
  });
  return true;
}

export async function checkSubscription(creds, channelId) {
  const params = new URLSearchParams({ part: 'snippet', mine: 'true', forChannelId: channelId });
  const data = await ytFetch(creds, `${YT_BASE}/subscriptions?${params}`);
  const item = data.items?.[0] ?? null;
  return { subscribed: !!item, subscriptionId: item?.id ?? null };
}

export async function postComment(creds, videoId, text) {
  return ytFetch(creds, `${YT_BASE}/commentThreads?part=snippet`, {
    method: 'POST',
    body: JSON.stringify({
      snippet: {
        videoId,
        topLevelComment: { snippet: { textOriginal: text } },
      },
    }),
  });
}

export async function replyToComment(creds, parentId, text) {
  return ytFetch(creds, `${YT_BASE}/comments?part=snippet`, {
    method: 'POST',
    body: JSON.stringify({
      snippet: { parentId, textOriginal: text },
    }),
  });
}

export async function deleteComment(creds, commentId) {
  await ytFetch(creds, `${YT_BASE}/comments?id=${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
  return true;
}

export async function getCommentReplies(creds, parentId, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet',
    parentId,
    maxResults: String(Math.min(maxResults, 100)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/comments?${params}`);
  return data.items ?? [];
}

export async function getVideoRating(creds, videoId) {
  const data = await ytFetch(
    creds,
    `${YT_BASE}/videos/getRating?id=${encodeURIComponent(videoId)}`,
  );
  return data.items?.[0] ?? null;
}

export async function getTrendingVideos(
  creds,
  { regionCode = 'US', categoryId = '0', maxResults = 20 } = {},
) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode,
    videoCategoryId: categoryId,
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/videos?${params}`);
  return data.items ?? [];
}

export async function searchChannels(creds, query, maxResults = 10) {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'channel',
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/search?${params}`);
  return data.items ?? [];
}

export async function searchPlaylists(creds, query, maxResults = 10) {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'playlist',
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/search?${params}`);
  return data.items ?? [];
}

export async function getVideoCategories(creds, regionCode = 'US') {
  const params = new URLSearchParams({ part: 'snippet', regionCode, hl: 'en' });
  const data = await ytFetch(creds, `${YT_BASE}/videoCategories?${params}`);
  return data.items ?? [];
}

export async function reportVideo(creds, videoId, reasonId, secondaryReasonId = '', comments = '') {
  await ytFetch(creds, `${YT_BASE}/videos/reportAbuse`, {
    method: 'POST',
    body: JSON.stringify({ videoId, reasonId, secondaryReasonId, comments }),
  });
  return true;
}

export async function getDislikedVideos(creds, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    myRating: 'dislike',
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/videos?${params}`);
  return data.items ?? [];
}

export async function updateComment(creds, commentId, newText) {
  return ytFetch(creds, `${YT_BASE}/comments?part=snippet`, {
    method: 'PUT',
    body: JSON.stringify({
      id: commentId,
      snippet: { textOriginal: newText },
    }),
  });
}

export async function getMyActivities(creds, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    mine: 'true',
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/activities?${params}`);
  return data.items ?? [];
}

export async function getChannelActivities(creds, channelId, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    channelId,
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/activities?${params}`);
  return data.items ?? [];
}

export async function getChannelPlaylists(creds, channelId, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    channelId,
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/playlists?${params}`);
  return data.items ?? [];
}

export async function getVideoCaptions(creds, videoId) {
  const params = new URLSearchParams({ part: 'snippet', videoId });
  const data = await ytFetch(creds, `${YT_BASE}/captions?${params}`);
  return data.items ?? [];
}

export async function searchLiveVideos(creds, query, maxResults = 10) {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    eventType: 'live',
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await ytFetch(creds, `${YT_BASE}/search?${params}`);
  return data.items ?? [];
}

export async function getVideoAbuseReportReasons(creds) {
  const params = new URLSearchParams({ part: 'snippet', hl: 'en' });
  const data = await ytFetch(creds, `${YT_BASE}/videoAbuseReportReasons?${params}`);
  return data.items ?? [];
}

export async function getI18nLanguages(creds) {
  const params = new URLSearchParams({ part: 'snippet', hl: 'en' });
  const data = await ytFetch(creds, `${YT_BASE}/i18nLanguages?${params}`);
  return data.items ?? [];
}

export async function getI18nRegions(creds) {
  const params = new URLSearchParams({ part: 'snippet', hl: 'en' });
  const data = await ytFetch(creds, `${YT_BASE}/i18nRegions?${params}`);
  return data.items ?? [];
}

export async function getVideosBatch(
  creds,
  videoIds = [],
  parts = 'snippet,statistics,contentDetails',
) {
  if (!videoIds.length) return [];
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) chunks.push(videoIds.slice(i, i + 50));
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const data = await ytFetch(creds, `${YT_BASE}/videos?part=${parts}&id=${chunk.join(',')}`);
      return data.items ?? [];
    }),
  );
  return results.flat();
}

export async function getChannelSections(creds, channelId) {
  const params = new URLSearchParams({ part: 'snippet,contentDetails', channelId });
  const data = await ytFetch(creds, `${YT_BASE}/channelSections?${params}`);
  return data.items ?? [];
}

export async function getCommentById(creds, commentId) {
  const params = new URLSearchParams({ part: 'snippet', id: commentId });
  const data = await ytFetch(creds, `${YT_BASE}/comments?${params}`);
  return data.items?.[0] ?? null;
}

export async function getChannelBranding(creds, channelId) {
  const data = await ytFetch(
    creds,
    `${YT_BASE}/channels?part=snippet,brandingSettings,statistics&id=${channelId}`,
  );
  return data.items?.[0] ?? null;
}

export async function getPlaylistById(creds, playlistId) {
  const params = new URLSearchParams({
    part: 'snippet,status,contentDetails',
    id: playlistId,
  });
  const data = await ytFetch(creds, `${YT_BASE}/playlists?${params}`);
  return data.items?.[0] ?? null;
}

export async function getVideoTags(creds, videoId) {
  const data = await ytFetch(creds, `${YT_BASE}/videos?part=snippet&id=${videoId}`);
  const item = data.items?.[0] ?? null;
  return item?.snippet?.tags ?? [];
}

export async function getCommentThreadsByChannel(creds, channelId, maxResults = 20) {
  const params = new URLSearchParams({
    part: 'snippet',
    allThreadsRelatedToChannelId: channelId,
    maxResults: String(Math.min(maxResults, 100)),
    order: 'time',
  });
  const data = await ytFetch(creds, `${YT_BASE}/commentThreads?${params}`);
  return data.items ?? [];
}

export async function searchVideosAdvanced(
  creds,
  query,
  {
    maxResults = 10,
    order = 'relevance',
    videoDuration = 'any',
    videoDefinition = 'any',
    publishedAfter = null,
    publishedBefore = null,
    regionCode = null,
    relevanceLanguage = null,
  } = {},
) {
  const p = {
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(Math.min(maxResults, 50)),
    order,
    videoDuration,
    videoDefinition,
  };
  if (publishedAfter) p.publishedAfter = publishedAfter;
  if (publishedBefore) p.publishedBefore = publishedBefore;
  if (regionCode) p.regionCode = regionCode;
  if (relevanceLanguage) p.relevanceLanguage = relevanceLanguage;
  const data = await ytFetch(creds, `${YT_BASE}/search?${new URLSearchParams(p)}`);
  return data.items ?? [];
}

export async function getVideoStatistics(creds, videoId) {
  const data = await ytFetch(creds, `${YT_BASE}/videos?part=statistics&id=${videoId}`);
  return data.items?.[0]?.statistics ?? null;
}

export async function getChannelStatistics(creds, channelId) {
  const data = await ytFetch(creds, `${YT_BASE}/channels?part=statistics&id=${channelId}`);
  return data.items?.[0]?.statistics ?? null;
}
