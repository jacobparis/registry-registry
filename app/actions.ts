'use server';

import { redis } from '@/lib/redis';
import { isValidIcon, isValidRegistry } from '@/lib/subdomains';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { rootDomain, protocol } from '@/lib/utils';

export async function createSubdomainAction(
  prevState: any,
  formData: FormData
) {
  const subdomain = formData.get('subdomain') as string;
  const icon = formData.get('icon') as string;
  const registryJson = formData.get('registry') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!subdomain || !icon || !registryJson) {
    return { success: false, error: 'Registry name, icon, and registry JSON are required' };
  }

  if (!isValidIcon(icon)) {
    return {
      subdomain,
      icon,
      registryJson,
      name,
      description,
      success: false,
      error: 'Please enter a valid emoji (maximum 10 characters)'
    };
  }

  if (!isValidRegistry(registryJson)) {
    return {
      subdomain,
      icon,
      registryJson,
      name,
      description,
      success: false,
      error: 'Please provide a valid shadcn registry JSON format'
    };
  }

  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (sanitizedSubdomain !== subdomain) {
    return {
      subdomain,
      icon,
      registryJson,
      name,
      description,
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
      icon,
      registryJson,
      name,
      description,
      success: false,
      error: 'This registry name is already taken'
    };
  }

  try {
    const registry = JSON.parse(registryJson);
    
    const subdomainData = {
      emoji: icon,
      createdAt: Date.now(),
      registry,
      name: name || subdomain,
      description: description || `${subdomain} registry`
    };

    await redis.set(`subdomain:${sanitizedSubdomain}`, JSON.stringify(subdomainData));
  } catch (error) {
    return {
      subdomain,
      icon,
      registryJson,
      name,
      description,
      success: false,
      error: 'Failed to parse registry JSON. Please check the format.'
    };
  }

  redirect(`${protocol}://${sanitizedSubdomain}.${rootDomain}`);
}

export async function deleteSubdomainAction(
  prevState: any,
  formData: FormData
) {
  const subdomain = formData.get('subdomain');
  await redis.del(`subdomain:${subdomain}`);
  revalidatePath('/admin');
  return { success: 'Domain deleted successfully' };
}
