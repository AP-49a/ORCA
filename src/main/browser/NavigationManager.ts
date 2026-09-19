export const DEFAULT_SEARCH_ENGINE = 'https://www.google.com/search?q=';

export class NavigationManager {
  /**
   * Normalizes a user input into a valid URL or search engine query URL.
   *
   * Rules:
   * 1. Empty or whitespace-only -> 'orca://newtab'
   * 2. Browser/internal schemes (orca://, about:, chrome://, file://, data:, javascript:) -> preserve as-is
   * 3. Explicit HTTP/HTTPS protocols (http://, https://) -> preserve as-is
   * 4. Localhost with optional port/path (e.g. localhost:3000, localhost:8080/api) -> http://localhost...
   * 5. IPv4 addresses with optional port/path (e.g. 127.0.0.1:8000, 192.168.1.1) -> http://...
   * 6. Multi-word strings with spaces -> search engine query with encoded terms
   * 7. Valid domain names with TLD (e.g. youtube.com, github.com/user/repo) -> https://...
   * 8. Any other non-domain keyword (e.g. "youtube", "weather") -> search engine query with encoded terms
   */
  public static normalizeInput(input: string, searchEngineUrl?: string): string {
    const trimmed = (input || '').trim();
    if (!trimmed) {
      return 'orca://newtab';
    }

    const engine = searchEngineUrl || DEFAULT_SEARCH_ENGINE;

    // Internal and special schemes
    if (
      trimmed.startsWith('orca://') ||
      trimmed.startsWith('about:') ||
      trimmed.startsWith('chrome://') ||
      trimmed.startsWith('file://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('javascript:')
    ) {
      return trimmed;
    }

    // Explicit standard web protocols
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Check for localhost with optional port/path (e.g. localhost:3000, localhost/path)
    const localhostRegex = /^localhost(?::\d+)?(?:\/.*)?$/i;
    if (localhostRegex.test(trimmed)) {
      return `http://${trimmed}`;
    }

    // Check for IPv4 addresses with optional port/path (e.g. 127.0.0.1:3000, 192.168.1.1)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::\d+)?(?:\/.*)?$/;
    if (ipRegex.test(trimmed)) {
      return `http://${trimmed}`;
    }

    // If input contains spaces and doesn't have a protocol, it is a search query
    if (/\s/.test(trimmed)) {
      const query = encodeURIComponent(trimmed);
      return `${engine}${query}`;
    }

    // Check if it looks like a valid domain name with a TLD of at least 2 alpha characters
    // (e.g. youtube.com, sub.domain.org, github.com/user/repo, site.co.uk:8080/path)
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d+)?(?:\/.*)?$/;
    if (domainRegex.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // Treat single words without dots as search queries (e.g. "youtube", "weather")
    const query = encodeURIComponent(trimmed);
    return `${engine}${query}`;
  }

  public static extractDomain(url: string): string {
    try {
      if (!url) return '';
      if (url.startsWith('orca://') || url.startsWith('about:')) {
        return 'orca';
      }
      const parsed = new URL(url);
      return parsed.hostname.toLowerCase();
    } catch {
      return '';
    }
  }
}

