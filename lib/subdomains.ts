import { redis } from '@/lib/redis';
import { z } from 'zod';

// Zod schemas
const registryComponentSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(z.object({
    path: z.string().optional(),
    type: z.string().optional(),
    content: z.string().optional(),
    target: z.string().optional(),
  })).optional(),
  tailwind: z.object({
    config: z.record(z.any()).optional(),
  }).optional(),
  cssVars: z.object({
    light: z.record(z.string()).optional(),
    dark: z.record(z.string()).optional(),
  }).optional(),
});

const subdomainConfigSchema = z.object({
  emoji: z.string().refine(isValidIcon, {
    message: "Invalid emoji icon",
  }),
  createdAt: z.number(),
  registry: z.array(registryComponentSchema).transform((items) => {
    const seen = new Set<string>();
    return items.filter(item => {
      // Remove empty objects and components without names
      if (Object.keys(item).length === 0) return false;
      if (!item.name) return false;
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
  }),
  name: z.string().optional(),
  description: z.string().optional(),
});

export type RegistryComponent = z.infer<typeof registryComponentSchema>;
export type SubdomainConfig = z.infer<typeof subdomainConfigSchema>;

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

export function isValidRegistry(registryJson: string): boolean {
  try {
    const registry = JSON.parse(registryJson);
    return z.array(registryComponentSchema).safeParse(registry).success;
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

  // Handle both string and object formats
  const rawData = typeof data === 'string' ? JSON.parse(data) : data;
  const result = subdomainConfigSchema.safeParse(rawData);
  
  if (!result.success) {
    console.error('Invalid subdomain data:', result.error);
    return null;
  }

  return result.data;
}

export async function getComponentData(subdomain: string, componentName: string): Promise<RegistryComponent | null> {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const componentKey = `component:${sanitizedSubdomain}:${componentName}`;
  
  const data = await redis.get<string | RegistryComponent>(componentKey);
  
  if (!data) {
    return null;
  }

  // Handle both string and object formats
  const rawData = typeof data === 'string' ? JSON.parse(data) : data;
  const result = registryComponentSchema.safeParse(rawData);
  
  if (!result.success) {
    console.error('Invalid component data:', result.error);
    return null;
  }

  return result.data;
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
      try {
        // Parse the data if it's a string
        const parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        const result = subdomainConfigSchema.safeParse(parsedData);
        
        if (result.success) {
          data = result.data;
        } else {
          console.error('Invalid subdomain data for', subdomain, ':', result.error);
        }
      } catch (error) {
        console.error('Failed to parse subdomain data JSON for', subdomain, ':', error);
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
