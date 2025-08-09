const previewCache: Record<string, string | null> = {};

async function fetchHtmlWithFallback(targetUrl: string): Promise<string | null> {
  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        // Alguns sites dependem de um UA "de navegador"
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (res.ok) {
      return await res.text();
    }
  } catch {}

  // Fallback via proxy de leitura (melhor compatibilidade com CORS/blocos)
  try {
    const proxyHttps = `https://r.jina.ai/https://${new URL(targetUrl).host}${new URL(targetUrl).pathname}${
      new URL(targetUrl).search
    }`;
    const resProxyHttps = await fetch(proxyHttps);
    if (resProxyHttps.ok) return await resProxyHttps.text();
  } catch {}

  try {
    const u = new URL(targetUrl);
    const proxyHttp = `https://r.jina.ai/http://${u.host}${u.pathname}${u.search}`;
    const resProxyHttp = await fetch(proxyHttp);
    if (resProxyHttp.ok) return await resProxyHttp.text();
  } catch {}

  return null;
}

function extractMetaContent(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'is'
  );
  const match = html.match(regex);
  return match && match[1] ? match[1] : null;
}

function extractLinkHref(html: string, rel: string): string | null {
  const regex = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["'][^>]*>`, 'is');
  const match = html.match(regex);
  return match && match[1] ? match[1] : null;
}

function resolveUrl(baseUrl: string, resourceUrl: string): string {
  try {
    return new URL(resourceUrl, baseUrl).toString();
  } catch {
    return resourceUrl;
  }
}

export async function getPreviewImage(targetUrl: string): Promise<string | null> {
  if (!targetUrl) return null;
  if (previewCache[targetUrl] !== undefined) return previewCache[targetUrl];

  const html = await fetchHtmlWithFallback(targetUrl);
  if (!html) {
    previewCache[targetUrl] = null;
    return null;
  }

  const candidates: Array<string | null> = [
    extractMetaContent(html, 'og:image:secure_url'),
    extractMetaContent(html, 'og:image'),
    extractMetaContent(html, 'twitter:image'),
    extractLinkHref(html, 'apple-touch-icon'),
    extractLinkHref(html, 'icon'),
  ];

  const found = candidates.find(Boolean);
  previewCache[targetUrl] = found ? resolveUrl(targetUrl, found!) : null;
  return previewCache[targetUrl];
}


