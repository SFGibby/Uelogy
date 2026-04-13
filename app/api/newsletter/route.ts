import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { XMLParser } from 'fast-xml-parser';

interface Article {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  imageUrl?: string;
}

const FEEDS = {
  solar: [
    { url: 'https://cleantechnica.com/feed/', source: 'CleanTechnica' },
    { url: 'https://www.solarpowerworldonline.com/feed/', source: 'Solar Power World' },
    { url: 'https://www.pv-magazine-usa.com/feed/', source: 'PV Magazine' },
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

async function getCategory(feeds: { url: string; source: string }[]): Promise<Article[]> {
  const results = await Promise.all(feeds.map(f => fetchFeed(f.url, f.source)));
  return results.flat().slice(0, 4);
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

function sectionHeader(bgcolor: string, emoji: string, label: string): string {
  return `
    <tr>
      <td bgcolor="${bgcolor}" style="padding:14px 24px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:20px;vertical-align:middle;">${emoji}</td>
          <td style="color:#fff;font-size:14px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding-left:10px;vertical-align:middle;">${label}</td>
        </tr></table>
      </td>
    </tr>`;
}

function buildEmail(solar: Article[], tech: Article[], sales: Article[]): string {
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
        <td style="padding:0 12px;color:#64748b;font-size:13px;">☀️ Solar</td>
        <td style="padding:0 12px;color:#64748b;font-size:13px;">💻 Technology</td>
        <td style="padding:0 12px;color:#64748b;font-size:13px;">📈 Sales</td>
      </tr></table>
    </td></tr>

    <!-- BODY -->
    <tr><td bgcolor="#ffffff">
      <table width="100%" cellpadding="0" cellspacing="0">

        ${sectionHeader('#c2410c', '☀️', 'Solar Industry')}
        ${solar.map(articleRow).join('')}
        <tr><td style="height:6px;background:#f8fafc;"></td></tr>

        ${sectionHeader('#1d4ed8', '💻', 'Technology & IT')}
        ${tech.map(articleRow).join('')}
        <tr><td style="height:6px;background:#f8fafc;"></td></tr>

        ${sectionHeader('#15803d', '📈', 'Sales & Business')}
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

export async function GET(req: NextRequest): Promise<NextResponse> {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!isVercelCron && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [solar, tech, sales] = await Promise.all([
      getCategory(FEEDS.solar),
      getCategory(FEEDS.tech),
      getCategory(FEEDS.sales),
    ]);

    if (solar.length + tech.length + sales.length === 0) {
      return NextResponse.json({ error: 'No articles fetched' }, { status: 500 });
    }

    const html = buildEmail(solar, tech, sales);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    await transporter.sendMail({
      from: `"Sam's Weekly Brief" <${process.env.GMAIL_USER}>`,
      to: process.env.NEWSLETTER_TO || process.env.GMAIL_USER,
      subject: `📰 Weekly Brief — ${today}`,
      html,
    });

    return NextResponse.json({
      success: true,
      counts: { solar: solar.length, tech: tech.length, sales: sales.length },
    });
  } catch (err) {
    console.error('Newsletter error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
