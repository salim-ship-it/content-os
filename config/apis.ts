/**
 * Centralized API configuration
 * Manages all external API keys and their validation
 */

export interface ApiConfig {
  anthropic: {
    apiKey: string;
    model: string;
    status: 'configured' | 'missing';
  };
  supabase: {
    url: string;
    serviceKey: string;
    status: 'configured' | 'missing';
  };
  apify?: {
    token: string;
    status: 'configured' | 'missing';
  };
  openRouter?: {
    apiKey: string;
    status: 'configured' | 'missing';
  };
  vidIQ?: {
    apiKey: string;
    status: 'configured' | 'missing';
  };
  clay?: {
    apiKey: string;
    status: 'configured' | 'missing';
  };
}

export function getApiConfig(): ApiConfig {
  return {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-haiku-4-5-20251001',
      status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
    },
    supabase: {
      url: process.env.SUPABASE_URL || '',
      serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
      status: process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'missing',
    },
    apify: process.env.APIFY_TOKEN
      ? { token: process.env.APIFY_TOKEN, status: 'configured' as const }
      : undefined,
    openRouter: process.env.OPENROUTER_API_KEY
      ? { apiKey: process.env.OPENROUTER_API_KEY, status: 'configured' as const }
      : undefined,
    vidIQ: process.env.VIDIQ_API_KEY
      ? { apiKey: process.env.VIDIQ_API_KEY, status: 'configured' as const }
      : undefined,
    clay: process.env.CLAY_API_KEY
      ? { apiKey: process.env.CLAY_API_KEY, status: 'configured' as const }
      : undefined,
  };
}

export function checkRequiredApis(): { missing: string[]; configured: string[] } {
  const config = getApiConfig();
  const missing: string[] = [];
  const configured: string[] = [];

  if (config.anthropic.status === 'missing') {
    missing.push('ANTHROPIC_API_KEY');
  } else {
    configured.push('Anthropic Claude');
  }

  if (config.supabase.status === 'missing') {
    missing.push('SUPABASE_URL and SUPABASE_SERVICE_KEY');
  } else {
    configured.push('Supabase Database');
  }

  if (config.apify?.status === 'configured') {
    configured.push('Apify Web Scraping');
  }

  if (config.openRouter?.status === 'configured') {
    configured.push('OpenRouter AI');
  }

  if (config.vidIQ?.status === 'configured') {
    configured.push('vidIQ Mining');
  }

  if (config.clay?.status === 'configured') {
    configured.push('Clay Enrichment');
  }

  return { missing, configured };
}

/**
 * Validate that all required APIs are configured
 * Throws error if any required API is missing
 */
export function validateRequiredApis(): void {
  const { missing } = checkRequiredApis();
  if (missing.length > 0) {
    throw new Error(
      `Missing required API keys: ${missing.join(', ')}\n` +
      'Copy .env.example to .env.local and fill in your API keys.\n' +
      'See SETUP.md for detailed instructions.'
    );
  }
}

/**
 * Get API key by name (for use in API routes)
 */
export function getApiKey(name: keyof Omit<ApiConfig, 'anthropic' | 'supabase'>): string | undefined {
  const config = getApiConfig();
  if (name === 'apify') return config.apify?.token;
  if (name === 'openRouter') return config.openRouter?.apiKey;
  if (name === 'vidIQ') return config.vidIQ?.apiKey;
  if (name === 'clay') return config.clay?.apiKey;
  return undefined;
}
