'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { deleteSubdomainAction } from '@/app/actions';
import { rootDomain, protocol } from '@/lib/utils';

type Tenant = {
  subdomain: string;
  emoji: string;
  createdAt: number;
  componentsCount: number;
  name: string;
  description: string;
};

function DashboardHeader() {
  // TODO: You can add authentication here with your preferred auth provider

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Registry Management</h1>
      <div className="flex items-center gap-4">
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {rootDomain}
        </Link>
      </div>
    </div>
  );
}

function TenantGrid({
  tenants,
  action,
  isPending
}: {
  tenants: Tenant[];
  action: (formData: FormData) => void;
  isPending: boolean;
}) {
  if (tenants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No registries found</p>
        <p className="text-gray-400 text-sm mt-2">
          Create your first registry to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tenants.map((tenant) => (
        <Card key={tenant.subdomain} className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium truncate">
              {tenant.name}
            </CardTitle>
            <form action={action}>
              <input type="hidden" name="subdomain" value={tenant.subdomain} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">{tenant.emoji}</div>
              <div className="text-right">
                <div className="text-sm font-medium">{tenant.componentsCount} components</div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(tenant.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 line-clamp-2">
                {tenant.description}
              </p>
              
              <div className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded truncate">
                {tenant.subdomain}.{rootDomain}
              </div>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <a
                href={`${protocol}://${tenant.subdomain}.${rootDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm flex-1"
              >
                Visit registry →
              </a>
              
              <a
                href={`${protocol}://${tenant.subdomain}.${rootDomain}/r`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:underline text-sm"
              >
                JSON API
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Dashboard({ tenants }: { tenants: Tenant[] }) {
  const [, action, isPending] = useActionState(deleteSubdomainAction, { success: '' });

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader />
      <TenantGrid tenants={tenants} action={action} isPending={isPending} />
    </div>
  );
}
