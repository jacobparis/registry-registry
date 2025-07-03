import Link from "next/link";
import { rootDomain, protocol } from "@/lib/utils";
import { CopyCommand } from "@/components/copy-command";

interface RegistryComponent {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: Array<{
    path: string;
    type: string;
    content?: string;
    target?: string;
  }>;
  cssVars?: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}

interface RegistryDisplayProps {
  subdomain: string;
  subdomainData: {
    name?: string;
    description?: string;
    emoji: string;
    createdAt: number;
    registry: RegistryComponent[];
  };
}

function ComponentCard({ 
  component, 
  subdomain 
}: { 
  component: RegistryComponent; 
  subdomain: string;
}) {
  return (
    <div className="">
      {/* Header */}
      <div className="">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link 
              href={`/items/${component.name}`}
              className="text-lg font-normal hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {component.name}
            </Link>
            {component.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {component.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Install Command */}
      <div className="-mx-4">
        <CopyCommand
          className="mt-2"
          command={`npx shadcn@latest add ${protocol}://${subdomain}.${rootDomain}/r/${component.name}`}
        />
      </div>


      {/* Dependencies */}
      {((component.dependencies && component.dependencies.length > 0) || (component.registryDependencies && component.registryDependencies.length > 0)) && (
        <div className="mt-6">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dependencies</h4>
          <div className="flex flex-wrap gap-2 -mx-2 mt-2">
            {component.dependencies?.map((dep: string, index: number) => (
              <a
                key={index}
                href={`https://www.npmjs.com/package/${dep}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors group"
              >
                {dep}
              </a>
            ))}
            {component.registryDependencies?.map((dep: string, index: number) => (
              <Link
                key={index}
                href={`/items/${dep}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <svg 
                  className="w-3 h-3 mr-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                  />
                </svg>
                {dep}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {component.files && component.files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Files</h4>
          <div className="space-y-2 mt-2">
            {component.files.map((file: any, index: number) => (
              <div key={index} className="text-sm font-mono text-gray-600 dark:text-gray-300">
                {file.path}
                {file.target && (
                  <span className="text-gray-400 dark:text-gray-500 ml-2">→ {file.target}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RegistryDisplay({
  subdomain,
  subdomainData,
}: RegistryDisplayProps) {
  const componentsCount = subdomainData.registry?.length || 0;

  // Group components by type
  const groupedComponents = subdomainData.registry?.reduce((acc, component) => {
    const type = component.type.replace('registry:', '');
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(component);
    return acc;
  }, {} as Record<string, typeof subdomainData.registry>);

  // Sort types to ensure consistent order
  const sortedTypes = Object.keys(groupedComponents || {}).sort();

  return (
    <div className="max-w-5xl mx-auto px-8 py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-normal tracking-tight mb-4">
          {subdomainData.name || `${subdomain} Registry`}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {subdomainData.description ||
            `A custom registry for distributing code using shadcn.`}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {componentsCount} component{componentsCount !== 1 ? 's' : ''}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Created {new Date(subdomainData.createdAt).toLocaleDateString()}
          </span>
        </div>
      </header>

      <main className="space-y-12">
        {subdomainData.registry && subdomainData.registry.length > 0 ? (
          sortedTypes.map((type) => (
            <section key={type}>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-4">
                {type}
              </h2>
              <div className="space-y-24">
                {groupedComponents[type].map((component, index) => (
                  <ComponentCard
                    key={component.name || index}
                    component={component}
                    subdomain={subdomain}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-12 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="space-y-2">
              <h3 className="text-xl font-normal">No Components Yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This registry doesn't have any components yet.
              </p>
            </div>
          </div>
        )}

        {/* API Endpoint Section */}
        <div className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-4">Registry Endpoint</h2>
          <CopyCommand
            command={`${protocol}://${subdomain}.${rootDomain}/r`}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Use this endpoint to fetch the registry JSON in your projects
          </p>
        </div>
      </main>
    </div>
  );
}
