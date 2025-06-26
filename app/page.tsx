import Link from 'next/link';
import { SubdomainForm } from './subdomain-form';
import { rootDomain, protocol } from '@/lib/utils';
import { getSubdomainData } from '@/lib/subdomains';
import { notFound } from 'next/navigation';
import { extractSubdomainFromHeaders } from '@/lib/utils';
import { headers } from 'next/headers';

export default async function HomePage() {
  const subdomain = await extractSubdomainFromHeaders(await headers());
  
  // If we're on a subdomain, show registry details
  if (subdomain) {
    const subdomainData = await getSubdomainData(subdomain);
    if (!subdomainData) {
      notFound();
    }

    const componentsCount = subdomainData.registry?.length || 0;

    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="absolute top-4 right-4">
          <Link
            href={`${protocol}://${rootDomain}`}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {rootDomain}
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-4xl">
            <div className="text-9xl mb-6">{subdomainData.emoji}</div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              {subdomainData.name || `${subdomain} Registry`}
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              {subdomainData.description || `Welcome to the ${subdomain} registry`}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Registry Details */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Registry Details</h2>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{subdomainData.name || subdomain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Icon:</span>
                    <span className="text-2xl">{subdomainData.emoji}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Components:</span>
                    <span className="font-medium">{componentsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(subdomainData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">URL:</span>
                    <span className="font-medium text-blue-600 break-all">
                      {subdomain}.{rootDomain}
                    </span>
                  </div>
                </div>
              </div>

              {/* Component List */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Components</h2>
                {componentsCount > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {subdomainData.registry.map((component, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{component.name}</span>
                          <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            {component.type}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {component.files?.length || 0} files
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No components found in this registry.</p>
                )}
              </div>
            </div>

            {/* Registry JSON Endpoint */}
            <div className="bg-white shadow-md rounded-lg p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">API Endpoint</h2>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                {protocol}://{subdomain}.{rootDomain}/r
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use this endpoint to fetch the registry JSON in your projects
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we're on the root domain, show the form to create a new registry
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 relative">
      <div className="absolute top-4 right-4">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Admin
        </Link>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {rootDomain}
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Create and publish your own shadcn/ui component registry
          </p>
        </div>

        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <SubdomainForm />
        </div>
      </div>
    </div>
  );
}
