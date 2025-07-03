'use server';

import { redis } from '@/lib/redis';
import { isValidRegistry } from '@/lib/subdomains';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { rootDomain, protocol } from '@/lib/utils';

export async function createSubdomainAction(
  prevState: any,
  formData: FormData
) {
  const subdomain = formData.get('subdomain') as string;
  const registryUrl = formData.get('registryUrl') as string;

  if (!subdomain || !registryUrl) {
    return { 
      subdomain,
      registryUrl,
      success: false, 
      error: 'Registry name and registry URL are required' 
    };
  }

  // Validate URL format
  try {
    new URL(registryUrl);
  } catch {
    return {
      subdomain,
      registryUrl,
      success: false,
      error: 'Please enter a valid URL'
    };
  }

  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (sanitizedSubdomain !== subdomain) {
    return {
      subdomain,
      registryUrl,
      success: false,
      error:
        'Registry name can only have lowercase letters, numbers, and hyphens. Please try again.'
    };
  }

  const subdomainAlreadyExists = await redis.get(
    `subdomain:${sanitizedSubdomain}`
  );
  if (subdomainAlreadyExists) {
    return {
      subdomain,
      registryUrl,
      success: false,
      error: 'This registry name is already taken'
    };
  }

  try {
    // Fetch the main registry from the URL
    const response = await fetch(registryUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'registry-registry-bot/1.0',
      },
      signal: AbortSignal.timeout(10000), // 10 seconds
    });

    if (!response.ok) {
      return {
        subdomain,
        registryUrl,
        success: false,
        error: `Failed to fetch registry: ${response.status} ${response.statusText}`
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {
        subdomain,
        registryUrl,
        success: false,
        error: 'The URL did not return JSON content'
      };
    }

    const registryData = await response.json();
    const registryJson = JSON.stringify(registryData);

    // Validate the fetched registry
    if (!isValidRegistry(registryJson)) {
      return {
        subdomain,
        registryUrl,
        success: false,
        error: 'The fetched content is not a valid shadcn registry format'
      };
    }

    const registry = JSON.parse(registryJson);
    
    // Check if this is a shadcn-style registry with styles
    const baseUrl = new URL(registryUrl);
    const registryBaseUrl = baseUrl.origin + baseUrl.pathname.replace(/\/$/, '');
    
    let enhancedRegistry = [];
    
    try {
      // Try to fetch styles first (shadcn pattern)
      const stylesResponse = await fetch(`${registryBaseUrl}/styles`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'registry-registry-bot/1.0',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (stylesResponse.ok) {
        const styles = await stylesResponse.json();
        console.log('Found styles:', styles);
        
        if (Array.isArray(styles) && styles.length > 0) {
          // Use the first style (usually 'default' or 'new-york')
          const defaultStyle = styles.find(s => s.name === 'default') || styles[0];
          console.log('Using style:', defaultStyle.name);
          
          // Fetch components for this style
          enhancedRegistry = await Promise.all(
            registry.map(async (component: any) => {
              try {
                const componentUrl = `${registryBaseUrl}/styles/${defaultStyle.name}/${component.name}.json`;
                console.log(`Fetching component ${component.name} from:`, componentUrl);
                
                const componentResponse = await fetch(componentUrl, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'registry-registry-bot/1.0',
                  },
                  signal: AbortSignal.timeout(5000),
                });

                if (componentResponse.ok) {
                  const componentData = await componentResponse.json();
                  console.log(`Component ${component.name} data:`, {
                    hasFiles: !!componentData.files,
                    filesCount: componentData.files?.length || 0,
                    files: componentData.files?.map((f: any) => ({
                      path: f.path,
                      hasContent: !!(f.content || f.code),
                      contentLength: (f.content || f.code)?.length || 0
                    }))
                  });
                  
                  return componentData;
                } else {
                  console.log(`Failed to fetch ${component.name}: ${componentResponse.status}`);
                  return component;
                }
              } catch (error) {
                console.warn(`Failed to fetch component ${component.name}:`, error);
                return component;
              }
            })
          );
        } else {
          throw new Error('No styles found');
        }
      } else {
        throw new Error('Styles endpoint not found');
      }
    } catch (error) {
      console.log('Not a shadcn-style registry, trying individual component fetch:', error);
      
      // Fallback to the old method for non-shadcn registries
      enhancedRegistry = await Promise.all(
        registry.map(async (component: any) => {
          try {
            // Try to fetch individual component data
            const componentUrl = `${registryBaseUrl}/${component.name}`;
            console.log(`Fetching component ${component.name} from:`, componentUrl);
            
            const componentResponse = await fetch(componentUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'registry-registry-bot/1.0',
              },
              signal: AbortSignal.timeout(5000), // 5 seconds per component
            });

            if (componentResponse.ok) {
              const componentData = await componentResponse.json();
              console.log(`Component ${component.name} individual data:`, {
                hasFiles: !!componentData.files,
                filesCount: componentData.files?.length || 0,
                files: componentData.files?.map((f: any) => ({
                  path: f.path,
                  type: f.type,
                  hasContent: !!(f.content || f.code),
                  contentLength: (f.content || f.code)?.length || 0
                }))
              });
              
              // If the individual component has file content, use it
              if (componentData.files && Array.isArray(componentData.files)) {
                const enhancedFiles = componentData.files.map((file: any) => ({
                  ...file,
                  content: file.content || file.code || '' // Handle different content field names
                }));
                
                return {
                  ...component,
                  files: enhancedFiles
                };
              }
            } else {
              console.log(`Failed to fetch ${component.name}: ${componentResponse.status}`);
            }
            
            // If individual fetch fails, return the original component
            console.log(`Using original component data for ${component.name}:`, {
              hasFiles: !!component.files,
              filesCount: component.files?.length || 0
            });
            return component;
          } catch (error) {
            console.warn(`Failed to fetch individual component ${component.name}:`, error);
            return component;
          }
        })
      );
    }
    
    const subdomainData = {
      emoji: '📦',
      createdAt: Date.now(),
      registry: enhancedRegistry,
      name: subdomain,
      description: `${subdomain} registry`
    };

    // Store the main registry data
    await redis.set(`subdomain:${sanitizedSubdomain}`, JSON.stringify(subdomainData));
    
    // Store individual components for faster access
    await Promise.all(
      enhancedRegistry.map(async (component: any) => {
        const componentKey = `component:${sanitizedSubdomain}:${component.name}`;
        await redis.set(componentKey, JSON.stringify(component));
      })
    );
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return {
          subdomain,
          registryUrl,
          success: false,
          error: 'Request timed out. Please try again.'
        };
      }
      
      return {
        subdomain,
        registryUrl,
        success: false,
        error: `Failed to fetch registry: ${error.message}`
      };
    }
    
    return {
      subdomain,
      registryUrl,
      success: false,
      error: 'An unexpected error occurred while fetching the registry'
    };
  }

  redirect(`${protocol}://${sanitizedSubdomain}.${rootDomain}`);
}

export async function updateComponentAction(
  subdomain: string,
  componentName: string,
  componentData: any
) {
  try {
    // Check if this is a rename operation (new name is different from old name)
    const isRename = componentData.name && componentData.name !== componentName;
    
    if (isRename) {
      // Check if a component with the new name already exists
      const existingComponent = await redis.get(`component:${subdomain}:${componentData.name}`);
      if (existingComponent) {
        return { 
          success: false, 
          error: `A component named "${componentData.name}" already exists. Please choose a different name.` 
        };
      }
    }
    
    // For new components, check if the name is already taken
    if (!componentName && componentData.name) {
      const existingComponent = await redis.get(`component:${subdomain}:${componentData.name}`);
      if (existingComponent) {
        return { 
          success: false, 
          error: `A component named "${componentData.name}" already exists. Please choose a different name.` 
        };
      }
    }

    // If this is a rename, delete the old component first
    if (isRename) {
      await redis.del(`component:${subdomain}:${componentName}`);
    }

    // Update individual component
    const componentKey = `component:${subdomain}:${componentData.name || componentName}`;
    await redis.set(componentKey, JSON.stringify(componentData));
    
    // Update component in main registry data
    const subdomainData = await redis.get(`subdomain:${subdomain}`);
    if (subdomainData) {
      const parsedData = typeof subdomainData === 'string' ? JSON.parse(subdomainData) : subdomainData;
      
      if (parsedData.registry && Array.isArray(parsedData.registry)) {
        const componentIndex = parsedData.registry.findIndex((c: any) => c.name === componentName);
        if (componentIndex !== -1) {
          // Update existing component
          parsedData.registry[componentIndex] = componentData;
        } else {
          // Add new component
          parsedData.registry.push(componentData);
        }
        
        // Update the main subdomain data
        await redis.set(`subdomain:${subdomain}`, JSON.stringify(parsedData));
      }
    }
    
    // Revalidate paths that might show this component
    revalidatePath(`/r/${subdomain}`);
    revalidatePath(`/r/${subdomain}/${componentData.name || componentName}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating component:', error);
    return { success: false, error: 'Failed to update component' };
  }
}

export async function deleteSubdomainAction(
  prevState: any,
  formData: FormData
) {
  const subdomain = formData.get('subdomain') as string;
  
  // Get the subdomain data to find all components
  const subdomainData = await redis.get(`subdomain:${subdomain}`);
  
  if (subdomainData) {
    const parsedData = typeof subdomainData === 'string' ? JSON.parse(subdomainData) : subdomainData;
    
    // Delete individual component data
    if (parsedData.registry && Array.isArray(parsedData.registry)) {
      await Promise.all(
        parsedData.registry.map(async (component: any) => {
          const componentKey = `component:${subdomain}:${component.name}`;
          await redis.del(componentKey);
        })
      );
    }
  }
  
  // Delete the main subdomain data
  await redis.del(`subdomain:${subdomain}`);
  
  revalidatePath('/admin');
  return { success: 'Domain deleted successfully' };
}

export async function checkComponentNameExists(
  subdomain: string,
  componentName: string
) {
  try {
    const componentKey = `component:${subdomain}:${componentName}`;
    const existingComponent = await redis.get(componentKey);
    return { exists: !!existingComponent };
  } catch (error) {
    console.error('Error checking component name:', error);
    return { error: 'Failed to check component name' };
  }
}
