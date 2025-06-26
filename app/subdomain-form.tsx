'use client';

import type React from 'react';

import { useState } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { createSubdomainAction } from '@/app/actions';
import { rootDomain } from '@/lib/utils';

type CreateState = {
  error?: string;
  success?: boolean;
  subdomain?: string;
  registryJson?: string;
  name?: string;
  description?: string;
};

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

function RegistryDetailsInput({ 
  defaultName, 
  defaultDescription 
}: { 
  defaultName?: string;
  defaultDescription?: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Display Name (optional)</Label>
        <Input
          id="name"
          name="name"
          placeholder="My Component Registry"
          defaultValue={defaultName}
        />
        <p className="text-xs text-gray-500">
          Friendly name for your registry
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="A collection of beautiful UI components"
          defaultValue={defaultDescription}
        />
        <p className="text-xs text-gray-500">
          Brief description of your registry
        </p>
      </div>
    </>
  );
}

function RegistryJsonInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="registry">Registry JSON</Label>
      <Textarea
        id="registry"
        name="registry"
        placeholder='[{"name": "button", "type": "registry:ui", "files": [{"path": "ui/button.tsx", "type": "registry:ui"}]}]'
        defaultValue={defaultValue}
        className="min-h-[200px] font-mono text-sm"
        required
      />
      <p className="text-xs text-gray-500">
        Paste your shadcn registry JSON format. See{' '}
        <a 
          href="https://ui.shadcn.com/r" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          ui.shadcn.com/r
        </a>{' '}
        for the format example.
      </p>
    </div>
  );
}

export function SubdomainForm() {
  const [state, action, isPending] = useActionState<CreateState, FormData>(
    createSubdomainAction,
    {}
  );

  return (
    <form action={action} className="space-y-6">
      <SubdomainInput defaultValue={state?.subdomain} />

      <RegistryDetailsInput 
        defaultName={state?.name}
        defaultDescription={state?.description}
      />

      <RegistryJsonInput defaultValue={state?.registryJson} />

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
