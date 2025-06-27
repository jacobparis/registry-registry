import { redis } from '@/lib/redis';

export function isValidIcon(str: string) {
  if (str.length > 10) {
    return false;
  }

  try {
    // Primary validation: Check if the string contains at least one emoji character
    // This regex pattern matches most emoji Unicode ranges
    const emojiPattern = /[\p{Emoji}]/u;
    if (emojiPattern.test(str)) {
      return true;
    }
  } catch (error) {
    // If the regex fails (e.g., in environments that don't support Unicode property escapes),
    // fall back to a simpler validation
    console.warn(
      'Emoji regex validation failed, using fallback validation',
      error
    );
  }

  // Fallback validation: Check if the string is within a reasonable length
  // This is less secure but better than no validation
  return str.length >= 1 && str.length <= 10;
}

// Shadcn registry component type
type RegistryComponent = {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: Array<{
    path: string;
    type: string;
    content?: string;
    target?: string;
  }>;
  tailwind?: {
    config?: Record<string, any>;
  };
  cssVars?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
};

type SubdomainConfig = {
  emoji: string;
  createdAt: number;
  registry: RegistryComponent[];
  name?: string;
  description?: string;
};

export function isValidRegistry(registryJson: string): boolean {
  try {
    const registry = JSON.parse(registryJson);
    
    // Check if it's an array
    if (!Array.isArray(registry)) {
      console.log('Registry is not an array');
      console.log(registry);
      return false;
    }

    // // Check if each item has required properties
    // for (const component of registry) {
    //   if (!component.name || !component.type || !component.files || !Array.isArray(component.files)) {
    //     return false;
    //   }
    // }

    return true;
  } catch (error) {
    return false;
  }
}

export async function getSubdomainData(subdomain: string): Promise<SubdomainConfig | null> {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const data = await redis.get<string | SubdomainConfig>(
    `subdomain:${sanitizedSubdomain}`
  );
  
  if (!data) {
    return null;
  }

  return data as SubdomainConfig;
}

export async function getComponentData(subdomain: string, componentName: string): Promise<RegistryComponent | null> {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const componentKey = `component:${sanitizedSubdomain}:${componentName}`;
  
  const data = await redis.get<string | RegistryComponent>(componentKey);
  
  if (!data) {
    return null;
  }

  // Handle both string and object formats for backward compatibility
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse component data JSON:', error);
      return null;
    }
  }
  
  return data as RegistryComponent;
}

export async function getAllSubdomains() {
  const keys = await redis.keys('subdomain:*');

  if (!keys.length) {
    return [];
  }

  const values = await redis.mget<(string | SubdomainConfig)[]>(...keys);

  return keys.map((key, index) => {
    const subdomain = key.replace('subdomain:', '');
    const rawData = values[index];
    
    let data: SubdomainConfig | null = null;
    
    if (rawData) {
      // Handle backwards compatibility - if data is already an object (old format)
      if (typeof rawData === 'object' && rawData !== null) {
        console.log('Found old format data for', subdomain, '- converting...');
        data = rawData as SubdomainConfig;
      }
      // Handle new format - data is a JSON string
      else if (typeof rawData === 'string') {
        try {
          data = JSON.parse(rawData);
        } catch (error) {
          console.error('Failed to parse subdomain data JSON for', subdomain, ':', error);
        }
      }
    }

    return {
      subdomain,
      emoji: data?.emoji || '❓',
      createdAt: data?.createdAt || Date.now(),
      componentsCount: data?.registry?.length || 0,
      name: data?.name || subdomain,
      description: data?.description || `${subdomain} registry`
    };
  });
}
