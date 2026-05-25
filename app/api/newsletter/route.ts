import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { XMLParser } from 'fast-xml-parser';
import Groq from 'groq-sdk';

interface Article {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  imageUrl?: string;
}

const GN = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

// Watchlist: specific companies Sam tracks. Grouped to keep query count
// reasonable while still hitting each name. Add "solar" anchor where the
// name is ambiguous (PG&E, Eversource, UI, Vivint).
const WATCHLIST_QUERIES = [
  GN('"GoodLeap" OR "LightReach" OR "Sungage" OR "Enfin"'),
  GN('"Sunrun" OR "SunPower" OR "Vivint Solar"'),
  GN('"V3 Electric" OR "Freedom Forever" OR "Bright Planet Solar" OR "BrightOps"'),
  GN('"PG&E" solar OR "Eversource" solar OR "United Illuminating" solar'),
  GN('residential solar bankruptcy OR layoffs OR acquisition OR "funding round"'),
];

const FEEDS = {
  solarTrade: [
    { url: 'https://cleantechnica.com/feed/', source: 'CleanTechnica' },
    { url: 'https://www.solarpowerworldonline.com/feed/', source: 'Solar Power World' },
    { url: 'https://www.pv-magazine-usa.com/feed/', source: 'PV Magazine' },
    { url: 'https://electrek.co/category/solar/feed/', source: 'Electrek Solar' },
    { url: 'https://www.utilitydive.com/feeds/solar/', source: 'Utility Dive' },
  ],
  tech: [
    { url: 'https://techcrunch.com/feed/', source: 'TechCrunch' },
    { url: 'https://feeds.arstechnica.com/arstechnica/index', source: 'Ars Technica' },
    { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge' },
  ],
  sales: [
    { url: 'https://www.fastcompany.com/feed', source: 'Fast Company' },
    { url: 'https://www.inc.com/rss', source: 'Inc.' },
    { url: 'https://feeds.hbr.org/harvardbusiness', source: 'HBR' },
  ],
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string) => ['item', 'entry'].includes(name),
  parseTagValue: true,
  trimValues: true,
  htmlEntities: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImage(item: Record<string, any>): string | undefined {
  const media = item['media:content'];
  if (Array.isArray(media)) {
    for (const m of media) {
      const url = m['@_url'];
      if (url && !url.endsWith('.gif') && !url.includes('pixel')) return url;
    }
  } else if (media?.['@_url']) {
    const url = media['@_url'];
    if (!url.endsWith('.gif') && !url.includes('pixel')) return url;
  }
  const enc = item.enclosure;
  if (enc?.['@_url'] && enc['@_type']?.startsWith('image')) return enc['@_url'];
  const desc = typeof item.description === 'string' ? item.description
    : item.description?.['#text'] || '';
  const match = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1] && !match[1].endsWith('.gif')) return match[1];
  return undefined;
}

function stripHtml(str: string): string {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

async function fetchFeed(url: string, source: string): Promise<Article[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Newsletter/1.0)' },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const channel = parsed.rss?.channel || parsed.feed;
    if (!channel) return [];
    const items = channel.item || channel.entry || [];
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return (Array.isArray(items) ? items : [items])
      .map((item: Record<string, unknown>) => {
        const dateStr = (item.pubDate || item.updated || item.published) as string;
        const date = new Date(dateStr);
        if (isNaN(date.getTime()) || date.getTime() < cutoff) return null;
        const title = stripHtml(
          typeof item.title === 'string' ? item.title
            : (item.title as Record<string, string>)?.['#text'] || ''
        ).slice(0, 130);
        const link = typeof item.link === 'string' ? item.link
          : (item.link as Record<string, string>)?.['@_href'] || '';
        const rawDesc = typeof item.description === 'string' ? item.description
          : typeof item.summary === 'string' ? item.summary
          : (item.description as Record<string, string>)?.['#text']
          || (item.summary as Record<string, string>)?.['#text'] || '';
        const description = stripHtml(rawDesc).slice(0, 280);
        if (!title || !link || description.length < 40) return null;
        return {
          title,
          link,
          description,
          pubDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          source,
          imageUrl: extractImage(item as Record<string, unknown>),
        } as Article;
      })
      .filter((a): a is Article => a !== null);
  } catch {
    return [];
  }
}

async function fetchAll(items: { url: string; source: string }[]): Promise<Article[]> {
  const results = await Promise.all(items.map(f => fetchFeed(f.url, f.source)));
  return results.flat();
}

async function fetchWatchlist(): Promise<Article[]> {
  const feeds = WATCHLIST_QUERIES.map(url => ({ url, source: 'Google News' }));
  return fetchAll(feeds);
}

// Dedupe by title token-overlap. Two titles sharing >65% of their meaningful
// words (>3 chars) are treated as the same story.
function titleKey(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function similar(a: string, b: string): boolean {
  const at = new Set(a.split(' ').filter(w => w.length > 3));
  const bt = new Set(b.split(' ').filter(w => w.length > 3));
  if (at.size === 0 || bt.size === 0) return false;
  let overlap = 0;
  for (const w of at) if (bt.has(w)) overlap++;
  const min = Math.min(at.size, bt.size);
  return overlap / min > 0.65;
}

function dedupe(articles: Article[]): Article[] {
  const seen: string[] = [];
  const out: Article[] = [];
  for (const a of articles) {
    const k = titleKey(a.title);
    if (seen.some(s => similar(s, k))) continue;
    seen.push(k);
    out.push(a);
  }
  return out;
}

// "The Brief" — 3-5 line LLM summary of what matters. Falls back to empty
// string on any failure (network, API, no articles).
async function curate(articles: Article[]): Promise<string> {
  if (articles.length === 0) return '';
  if (!process.env.GROQ_API_KEY) return '';
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const corpus = articles.slice(0, 28)
      .map(a => `- ${a.title} (${a.source}): ${a.description.slice(0, 220)}`)
      .join('\n');
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are writing a weekly briefing for Sam, who leads IT and business systems at a residential solar company. ' +
            'Read the news items and surface what actually matters: bankruptcies, layoffs, funding rounds, M&A, leadership changes, ' +
            'regulatory shifts, or anything that meaningfully affects the residential solar market. Skip generic industry hype. ' +
            'Output 3-5 short lines, plain text, no bullets, no headers, no preamble. Each line stands on its own. ' +
            'Be specific (name companies, name numbers). Avoid em dashes, the word "amid", and the phrase "in a move that".',
        },
        { role: 'user', content: corpus },
      ],
      max_tokens: 450,
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content?.trim() ?? '';
  } catch {
    return '';
  }
}

function articleRow(a: Article): string {
  const img = a.imageUrl
    ? `<td width="110" style="padding:0 14px 0 0; vertical-align:top; width:110px;">
        <img src="${a.imageUrl}" width="96" height="68" alt=""
          style="width:96px;height:68px;object-fit:cover;border-radius:6px;display:block;"/>
       </td>`
    : '';
  return `
    <tr>
      <td style="padding:0 24px; border-bottom:1px solid #f1f5f9;">
        <table cellpadding="0" cellspacing="0" width="100%" style="padding:16px 0;">
          <tr>
            ${img}
            <td style="vertical-align:top;">
              <a href="${a.link}" style="color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;line-height:1.4;display:block;">
                ${a.title}
              </a>
              <div style="color:#64748b;font-size:13px;margin-top:6px;line-height:1.55;">
                ${a.description}
              </div>
              <div style="margin-top:8px;">
                <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">${a.source}</span>
                <span style="color:#e2e8f0;margin:0 5px;">·</span>
                <span style="color:#94a3b8;font-size:11px;">${a.pubDate}</span>
                <a href="${a.link}" style="color:#3b82f6;font-size:11px;margin-left:10px;text-decoration:none;font-weight:600;">Read →</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function sectionHeader(bgcolor: string, label: string): string {
  return `
    <tr>
      <td bgcolor="${bgcolor}" style="padding:14px 24px;">
        <div style="color:#fff;font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">${label}</div>
      </td>
    </tr>`;
}

function briefBlock(text: string): string {
  if (!text) return '';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const rendered = lines.map(l =>
    `<div style="color:#0f172a;font-size:14px;line-height:1.65;margin-bottom:10px;">${l}</div>`
  ).join('');
  return `
    <tr>
      <td bgcolor="#ffffff" style="padding:24px 24px 14px;">
        <div style="color:#94a3b8;font-size:10px;letter-spacing:.25em;text-transform:uppercase;margin-bottom:14px;font-weight:700;">The Brief</div>
        ${rendered}
      </td>
    </tr>
    <tr><td style="height:6px;background:#f8fafc;"></td></tr>`;
}

function buildEmail(brief: string, watchlist: Article[], trade: Article[], tech: Article[], sales: Article[]): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Sam's Weekly Brief – ${today}</title></head>
<body style="margin:0;padding:0;background:#e8edf2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#e8edf2">
  <tr><td align="center" style="padding:24px 12px 48px;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- HEADER -->
    <tr><td bgcolor="#0f172a" style="padding:36px 32px;border-radius:12px 12px 0 0;text-align:center;">
      <div style="color:#64748b;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin-bottom:10px;">Weekly Intelligence Brief</div>
      <div style="color:#fff;font-size:32px;font-weight:900;letter-spacing:-.5px;">SAM GIBSON</div>
      <div style="color:#475569;font-size:13px;margin-top:8px;">${today}</div>
      <div style="background:#1e293b;height:1px;margin:20px 32px;"></div>
      <table cellpadding="0" cellspacing="0" align="center"><tr>
        <td style="padding:0 10px;color:#64748b;font-size:11px;letter-spacing:.15em;text-transform:uppercase;">Watchlist</td>
        <td style="padding:0 10px;color:#64748b;font-size:11px;letter-spacing:.15em;text-transform:uppercase;">Industry</td>
        <td style="padding:0 10px;color:#64748b;font-size:11px;letter-spacing:.15em;text-transform:uppercase;">Tech</td>
        <td style="padding:0 10px;color:#64748b;font-size:11px;letter-spacing:.15em;text-transform:uppercase;">Sales</td>
      </tr></table>
    </td></tr>

    <!-- BODY -->
    <tr><td bgcolor="#ffffff">
      <table width="100%" cellpadding="0" cellspacing="0">

        ${briefBlock(brief)}

        ${sectionHeader('#92400e', 'Watchlist')}
        ${watchlist.map(articleRow).join('')}
        <tr><td style="height:6px;background:#f8fafc;"></td></tr>

        ${sectionHeader('#c2410c', 'Solar Industry')}
        ${trade.map(articleRow).join('')}
        <tr><td style="height:6px;background:#f8fafc;"></td></tr>

        ${sectionHeader('#1d4ed8', 'Technology & IT')}
        ${tech.map(articleRow).join('')}
        <tr><td style="height:6px;background:#f8fafc;"></td></tr>

        ${sectionHeader('#15803d', 'Sales & Business')}
        ${sales.map(articleRow).join('')}

      </table>
    </td></tr>

    <!-- FOOTER -->
    <tr><td bgcolor="#0f172a" style="padding:24px 32px;text-align:center;border-radius:0 0 12px 12px;">
      <div style="color:#334155;font-size:11px;line-height:1.7;">
        Delivered every Monday morning &nbsp;·&nbsp; ${today}<br>
        CleanTechnica · PV Magazine · Solar Power World · TechCrunch · Ars Technica · The Verge · Fast Company · Inc. · HBR
      </div>
    </td></tr>

  </table>
  </td></tr>
</table>
</body></html>`;
}

function buildSubject(top: string | undefined, today: string): string {
  if (!top) return `Weekly Brief, ${today}`;
  const cleaned = top.replace(/\s+/g, ' ').trim();
  const truncated = cleaned.length > 65 ? cleaned.slice(0, 62) + '...' : cleaned;
  return `Weekly Brief: ${truncated}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!isVercelCron && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [watchlistRaw, tradeRaw, techRaw, salesRaw] = await Promise.all([
      fetchWatchlist(),
      fetchAll(FEEDS.solarTrade),
      fetchAll(FEEDS.tech),
      fetchAll(FEEDS.sales),
    ]);

    // Dedupe inside each section AND across them (watchlist wins over trade
    // when the same story shows up in both — we want named-company framing).
    const watchlist = dedupe(watchlistRaw).slice(0, 6);
    const watchlistKeys = watchlist.map(a => titleKey(a.title));
    const trade = dedupe(tradeRaw)
      .filter(a => !watchlistKeys.some(k => similar(k, titleKey(a.title))))
      .slice(0, 4);
    const tech = dedupe(techRaw).slice(0, 3);
    const sales = dedupe(salesRaw).slice(0, 3);

    const totalCount = watchlist.length + trade.length + tech.length + sales.length;
    if (totalCount === 0) {
      return NextResponse.json({ error: 'No articles fetched' }, { status: 500 });
    }

    // Curate over the most-prioritized articles.
    const brief = await curate([...watchlist, ...trade, ...tech, ...sales]);

    const html = buildEmail(brief, watchlist, trade, tech, sales);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const topHeadline = watchlist[0]?.title ?? trade[0]?.title;
    const subject = buildSubject(topHeadline, today);

    await transporter.sendMail({
      from: `"Sam's Weekly Brief" <${process.env.GMAIL_USER}>`,
      to: process.env.NEWSLETTER_TO || process.env.GMAIL_USER,
      subject,
      html,
    });

    return NextResponse.json({
      success: true,
      subject,
      curated: brief.length > 0,
      counts: { watchlist: watchlist.length, trade: trade.length, tech: tech.length, sales: sales.length },
    });
  } catch (err) {
    console.error('Newsletter error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
