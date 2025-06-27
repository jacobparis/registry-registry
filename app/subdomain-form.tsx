'use client';

import type React from 'react';

import { useState } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSubdomainAction } from '@/app/actions';
import { rootDomain } from '@/lib/utils';

type CreateState = {
  error?: string;
  success?: boolean;
  subdomain?: string;
  registryUrl?: string;
};

const POPULAR_REGISTRIES = [
  {
    name: 'shadcn/ui',
    url: 'https://ui.shadcn.com/r',
    description: 'Official shadcn/ui registry'
  },
  {
    name: 'Magic UI',
    url: 'https://magicui.design/r',
    description: 'Animated components'
  },
  {
    name: 'Origin UI',
    url: 'https://originui.com/r',
    description: 'Beautiful components'
  }
];

function SubdomainInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="subdomain">Registry Name</Label>
      <div className="flex items-center">
        <div className="relative flex-1">
          <Input
            id="subdomain"
            name="subdomain"
            placeholder="your-registry"
            defaultValue={defaultValue}
            className="w-full rounded-r-none focus:z-10"
            required
          />
        </div>
        <span className="bg-gray-100 px-3 border border-l-0 border-input rounded-r-md text-gray-500 min-h-[36px] flex items-center">
          .{rootDomain}
        </span>
      </div>
    </div>
  );
}

function RegistryUrlInput({ 
  defaultUrl,
  onUrlChange
}: { 
  defaultUrl?: string;
  onUrlChange: (url: string) => void;
}) {
  const [url, setUrl] = useState(defaultUrl || '');

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    onUrlChange(newUrl);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="registryUrl">Registry URL</Label>
        <Input
          id="registryUrl"
          name="registryUrl"
          placeholder="https://ui.shadcn.com/r"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          type="url"
          required
        />
        <p className="text-xs text-gray-500">
          Enter a URL that returns a shadcn registry JSON. We'll fetch it server-side when you publish.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Popular Registries</Label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_REGISTRIES.map((registry) => (
            <button
              key={registry.name}
              type="button"
              onClick={() => handleUrlChange(registry.url)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              title={registry.description}
            >
              {registry.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SubdomainForm() {
  const [state, action, isPending] = useActionState<CreateState, FormData>(
    createSubdomainAction,
    {}
  );

  const [registryUrl, setRegistryUrl] = useState(state?.registryUrl || '');

  return (
    <form action={action} className="space-y-6">
      <SubdomainInput defaultValue={state?.subdomain} />

      <RegistryUrlInput 
        defaultUrl={state?.registryUrl}
        onUrlChange={setRegistryUrl}
      />

      {state?.error && (
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md">
          {state.error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Publishing...' : 'Publish Registry'}
      </Button>
    </form>
  );
}
