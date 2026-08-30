export class NavigationManager {
  /**
   * Normalizes a user input into a valid URL or search engine query URL
   */
  public static normalizeInput(input: string, searchEngineUrl: string): string {
    const trimmed = input.trim();
    if (!trimmed) {
      return 'orca://newtab';
    }

    if (trimmed.startsWith('orca://') || trimmed.startsWith('about:') || trimmed.startsWith('chrome://')) {
      return trimmed;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('file://')) {
      return trimmed;
    }

    // Check if it looks like a domain name (e.g. google.com, sub.domain.org, localhost:3000, 192.168.1.1)
    const domainRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d+)?(?:\/.*)?$/;
    const localhostRegex = /^localhost(?::\d+)?(?:\/.*)?$/;
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/.*)?$/;

    if (domainRegex.test(trimmed) || localhostRegex.test(trimmed) || ipRegex.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // Treat as search query
    const query = encodeURIComponent(trimmed);
    return `${searchEngineUrl}${query}`;
  }

  public static extractDomain(url: string): string {
    try {
      if (url.startsWith('orca://') || url.startsWith('about:')) {
        return 'orca';
      }
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return '';
    }
  }
}
