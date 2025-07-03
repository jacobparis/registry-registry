'use client';

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { rootDomain, protocol, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ArrowLeft, Plus, X, Pencil, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateComponentAction } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RegistryComponent } from "@/lib/subdomains";

interface RegistryItemFile {
  path: string;
  type: string;
  content?: string;
  target?: string;
}

interface RegistryItemData {
  $schema?: string;
  name: string;
  title?: string;
  description?: string;
  type: string;
  author?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryItemFile[];
  tailwind?: {
    config?: any;
  };
  cssVars?: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  css?: Record<string, any>;
  docs?: string;
  categories?: string[];
  meta?: Record<string, any>;
}


const REGISTRY_TYPES = [
  'registry:block',
  'registry:component', 
  'registry:lib',
  'registry:hook',
  'registry:ui',
  'registry:page',
  'registry:file',
  'registry:style',
  'registry:theme'
];

const FILE_TYPES = [
  'registry:component',
  'registry:ui',
  'registry:hook',
  'registry:lib',
  'registry:page',
  'registry:file',
  'registry:style',
  'registry:theme',
  'registry:example'
];




export function ComponentDetail({ component: initialComponent, subdomain, registryData }: {
  component: RegistryItemData;
  subdomain: string;
  registryData: {
    name?: string;
    description?: string;
    emoji: string;
    createdAt: number;
    registry: RegistryItemData[];
  };
}) {
  const [component, setComponent] = useState<RegistryItemData>(initialComponent);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);


  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      setTimeout(() => setCopiedText(null), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };











  const updateCssVar = (section: 'theme' | 'light' | 'dark', key: string, value: string) => {
    setComponent(prev => ({
      ...prev,
      cssVars: {
        ...prev.cssVars,
        [section]: {
          ...prev.cssVars?.[section],
          [key]: value
        }
      }
    }));
  };



  const installCommand = `npx shadcn@latest add ${protocol}://${subdomain}.${rootDomain}/r/${component.name}`;

  const ViewMode = () => {
    const [editingFile, setEditingFile] = useState<number | null>(null);
    const [localFiles, setLocalFiles] = useState(component.files || []);
    const [isSaving, setIsSaving] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<number | null>(null);


    const hasDependencies = (component.dependencies && component.dependencies.length > 0) || 
      (component.registryDependencies && component.registryDependencies.length > 0);

    const handleSaveFile = async () => {
      setIsSaving(true);
      try {
        const result = await updateComponentAction(subdomain, component.name, {
          ...component,
          files: localFiles
        });
        if (result.success) {
          setComponent(prev => ({ ...prev, files: localFiles }));
          setEditingFile(null);
        }
      } catch (error) {
        console.error('Failed to save file:', error);
      } finally {
        setIsSaving(false);
      }
    };

    const addFile = () => {
      const newFiles = [...localFiles, { path: '', type: 'registry:component', content: '' }];
      setLocalFiles(newFiles);
      setEditingFile(newFiles.length - 1);
    };

    const removeFile = async (index: number) => {
      const newFiles = localFiles.filter((_, i) => i !== index);
      try {
        const result = await updateComponentAction(subdomain, component.name, {
          ...component,
          files: newFiles
        });
        if (result.success) {
          setLocalFiles(newFiles);
          setComponent(prev => ({ ...prev, files: newFiles }));
        }
      } catch (error) {
        console.error('Failed to remove file:', error);
      }
    };

    const updateFile = (index: number, field: keyof RegistryItemFile, value: string) => {
      setLocalFiles(prev => 
        prev.map((file, i) => i === index ? { ...file, [field]: value } : file)
      );
    };


    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-mono">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-normal">{component.name}</h1>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Edit Settings
              </Button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{component.author || subdomain}</p>
          </div>

          {/* Installation */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Install</h2>
              <button
                onClick={() => handleCopy(installCommand, "install")}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {copiedText === "install" ? (
                  <span className="text-xs">copied</span>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-950 px-3 py-2 rounded">
              <code className="text-sm text-gray-800 dark:text-gray-300">{installCommand}</code>
            </div>
          </div>

          {/* Dependencies */}
          {hasDependencies && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Dependencies</h2>
              </div>
              <div className="bg-gray-100 dark:bg-gray-950 px-3 py-2 rounded space-y-3">
                {component.dependencies && component.dependencies.length > 0 && (
                  <div>
                    <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">NPM</h3>
                    <div className="flex flex-wrap gap-2">
                      {component.dependencies.map((dep, index) => (
                        <code key={index} className="text-sm text-gray-800 dark:text-gray-300">
                          {dep}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
                {component.registryDependencies && component.registryDependencies.length > 0 && (
                  <div>
                    <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Registry</h3>
                    <div className="flex flex-wrap gap-2">
                      {component.registryDependencies.map((dep, index) => (
                        <code key={index} className="text-sm text-gray-800 dark:text-gray-300">
                          {dep}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CSS Variables */}
          {component.cssVars && (Object.keys(component.cssVars.theme || {}).length > 0 || 
                               Object.keys(component.cssVars.light || {}).length > 0 || 
                               Object.keys(component.cssVars.dark || {}).length > 0) && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">CSS Variables</h2>
              </div>
              <div className="bg-gray-100 dark:bg-gray-950 px-3 py-2 rounded space-y-3">
                {component.cssVars.theme && Object.keys(component.cssVars.theme).length > 0 && (
                  <div>
                    <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Theme</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(component.cssVars.theme).map(([key, value]) => (
                        <div key={key} className="contents">
                          <code className="text-sm text-gray-800 dark:text-gray-300">{key}</code>
                          <code className="text-sm text-gray-600 dark:text-gray-400">{value}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {component.cssVars.light && Object.keys(component.cssVars.light).length > 0 && (
                  <div>
                    <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Light Mode</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(component.cssVars.light).map(([key, value]) => (
                        <div key={key} className="contents">
                          <code className="text-sm text-gray-800 dark:text-gray-300">{key}</code>
                          <code className="text-sm text-gray-600 dark:text-gray-400">{value}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {component.cssVars.dark && Object.keys(component.cssVars.dark).length > 0 && (
                  <div>
                    <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Dark Mode</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(component.cssVars.dark).map(([key, value]) => (
                        <div key={key} className="contents">
                          <code className="text-sm text-gray-800 dark:text-gray-300">{key}</code>
                          <code className="text-sm text-gray-600 dark:text-gray-400">{value}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Files */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Files</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={addFile}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Add File
              </Button>
            </div>

            {localFiles.length === 0 ? (
              <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-lg px-3 py-8">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No files added yet</p>
                </div>
              </div>
            ) : (
              localFiles.map((file, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900">
                    {editingFile === index ? (
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          value={file.path}
                          onChange={(e) => updateFile(index, 'path', e.target.value)}
                          placeholder="path/to/file.tsx"
                          className="text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                        />
                        <Select
                          value={file.type}
                          onValueChange={(value) => updateFile(index, 'type', value)}
                        >
                          <SelectTrigger className="text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FILE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.replace('registry:', '')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{file.path}</span>
                        <Badge variant="secondary" className="text-xs">
                          {file.type.replace('registry:', '')}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {editingFile === index ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            onClick={() => {
                              setLocalFiles(component.files || []);
                              setEditingFile(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7"
                            onClick={handleSaveFile}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingFile(index)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleCopy(file.content || '', `file-${index}`)}
                          >
                            {copiedText === `file-${index}` ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    Delete File
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete File</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{file.path}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                                      onClick={() => removeFile(index)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {editingFile === index ? (
                    <div className="px-3 py-2">
                      {(file.type === 'registry:page' || file.type === 'registry:file') && (
                        <Input
                          value={file.target || ''}
                          onChange={(e) => updateFile(index, 'target', e.target.value)}
                          placeholder="Target path"
                          className="mb-2 text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                        />
                      )}
                      <Textarea
                        value={file.content || ''}
                        onChange={(e) => updateFile(index, 'content', e.target.value)}
                        placeholder="File content"
                        className="font-mono text-sm bg-gray-100 dark:bg-gray-950 border-0 min-h-[200px]"
                      />
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-950">
                      <pre className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed overflow-x-auto">
                        <code>{file.content}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const EditMode = () => {
    // Track local state separately from server state
    const [localComponent, setLocalComponent] = useState(component);
    const [isSaving, setIsSaving] = useState(false);

    // Reset local state when switching to edit mode
    useEffect(() => {
      setLocalComponent(component);
    }, [component]);

    const handleSave = async () => {
      setIsSaving(true);
      try {
        const result = await updateComponentAction(subdomain, component.name, {
          ...localComponent,
          files: component.files // Preserve existing files, don't edit them here
        });
        if (result.success) {
          setComponent(localComponent);
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Failed to save changes:', error);
      } finally {
        setIsSaving(false);
      }
    };

    const addDependency = (type: 'dependencies' | 'registryDependencies') => {
      setLocalComponent(prev => ({
        ...prev,
        [type]: [...(prev[type] || []), '']
      }));
    };

    const removeDependency = (type: 'dependencies' | 'registryDependencies', index: number) => {
      setLocalComponent(prev => ({
        ...prev,
        [type]: prev[type]?.filter((_, i) => i !== index)
      }));
    };

    const updateDependency = (type: 'dependencies' | 'registryDependencies', index: number, value: string) => {
      setLocalComponent(prev => ({
        ...prev,
        [type]: prev[type]?.map((dep, i) => i === index ? value : dep)
      }));
    };

    const handleDeleteItem = async () => {
      try {
        const result = await updateComponentAction(subdomain, component.name, {
          deleted: true
        });
        if (result.success) {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    };

    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-mono">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-1">
              <h1 className="text-2xl font-normal">{localComponent.name}</h1>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Type</label>
                <Select
                  value={localComponent.type}
                  onValueChange={(value) => setLocalComponent(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGISTRY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('registry:', '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Author</label>
                <Input
                  value={localComponent.author || ''}
                  onChange={(e) => setLocalComponent(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Author name"
                  className="text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Documentation</label>
                <Input
                  value={localComponent.docs || ''}
                  onChange={(e) => setLocalComponent(prev => ({ ...prev, docs: e.target.value }))}
                  placeholder="Documentation URL"
                  className="text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Description</h2>
            </div>
            <Textarea
              value={localComponent.description || ''}
              onChange={(e) => setLocalComponent(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Component description"
              className="min-h-[80px] text-sm bg-gray-100 dark:bg-gray-950 border-0"
            />
          </div>

          {/* Dependencies */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Dependencies</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">NPM</h3>
                <div className="space-y-1">
                  {localComponent.dependencies?.map((dep, index) => (
                    <div key={index} className="flex gap-1">
                      <Input
                        value={dep}
                        onChange={(e) => updateDependency('dependencies', index, e.target.value)}
                        className="flex-1 text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDependency('dependencies', index)}
                        className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addDependency('dependencies')}
                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors h-7"
                  >
                    Add NPM Dependency
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Registry</h3>
                <div className="space-y-1">
                  {localComponent.registryDependencies?.map((dep, index) => (
                    <div key={index} className="flex gap-1">
                      <Input
                        value={dep}
                        onChange={(e) => updateDependency('registryDependencies', index, e.target.value)}
                        className="flex-1 text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDependency('registryDependencies', index)}
                        className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addDependency('registryDependencies')}
                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors h-7"
                  >
                    Add Registry Dependency
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* CSS Variables */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">CSS Variables</h2>
            </div>
            <div className="space-y-4">
              {/* Theme Variables */}
              <div>
                <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Theme</h3>
                <div className="space-y-1">
                  {Object.entries(localComponent.cssVars?.theme || {}).map(([key, value]) => (
                    <div key={key} className="flex gap-1">
                      <Input
                        value={key}
                        readOnly
                        placeholder="Variable name"
                        className="flex-1 text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                      />
                      <Input
                        value={value}
                        onChange={(e) => setLocalComponent(prev => ({
                          ...prev,
                          cssVars: {
                            ...prev.cssVars,
                            theme: {
                              ...(prev.cssVars?.theme || {}),
                              [key]: e.target.value
                            }
                          }
                        }))}
                        placeholder="Value"
                        className="flex-1 text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setLocalComponent(prev => {
                            const newCssVars = { ...prev.cssVars };
                            if (newCssVars.theme) {
                              const { [key]: _, ...rest } = newCssVars.theme;
                              newCssVars.theme = rest;
                            }
                            return { ...prev, cssVars: newCssVars };
                          });
                        }}
                        className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLocalComponent(prev => ({
                        ...prev,
                        cssVars: {
                          ...prev.cssVars,
                          theme: {
                            ...(prev.cssVars?.theme || {}),
                            '--new-var': ''
                          }
                        }
                      }));
                    }}
                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors h-7"
                  >
                    Add Theme Variable
                  </Button>
                </div>
              </div>

              {/* Light Mode Variables */}
              <div>
                <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Light Mode</h3>
                <div className="space-y-1">
                  {Object.entries(localComponent.cssVars?.light || {}).map(([key, value]) => (
                    <div key={key} className="flex gap-1">
                      <Input
                        value={key}
                        readOnly
                        placeholder="Variable name"
                        className="flex-1 text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                      />
                      <Input
                        value={value}
                        onChange={(e) => setLocalComponent(prev => ({
                          ...prev,
                          cssVars: {
                            ...prev.cssVars,
                            light: {
                              ...(prev.cssVars?.light || {}),
                              [key]: e.target.value
                            }
                          }
                        }))}
                        placeholder="Value"
                        className="flex-1 text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setLocalComponent(prev => {
                            const newCssVars = { ...prev.cssVars };
                            if (newCssVars.light) {
                              const { [key]: _, ...rest } = newCssVars.light;
                              newCssVars.light = rest;
                            }
                            return { ...prev, cssVars: newCssVars };
                          });
                        }}
                        className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLocalComponent(prev => ({
                        ...prev,
                        cssVars: {
                          ...prev.cssVars,
                          light: {
                            ...(prev.cssVars?.light || {}),
                            '--new-var': ''
                          }
                        }
                      }));
                    }}
                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors h-7"
                  >
                    Add Light Mode Variable
                  </Button>
                </div>
              </div>

              {/* Dark Mode Variables */}
              <div>
                <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Dark Mode</h3>
                <div className="space-y-1">
                  {Object.entries(localComponent.cssVars?.dark || {}).map(([key, value]) => (
                    <div key={key} className="flex gap-1">
                      <Input
                        value={key}
                        readOnly
                        placeholder="Variable name"
                        className="flex-1 text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                      />
                      <Input
                        value={value}
                        onChange={(e) => setLocalComponent(prev => ({
                          ...prev,
                          cssVars: {
                            ...prev.cssVars,
                            dark: {
                              ...(prev.cssVars?.dark || {}),
                              [key]: e.target.value
                            }
                          }
                        }))}
                        placeholder="Value"
                        className="flex-1 text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setLocalComponent(prev => {
                            const newCssVars = { ...prev.cssVars };
                            if (newCssVars.dark) {
                              const { [key]: _, ...rest } = newCssVars.dark;
                              newCssVars.dark = rest;
                            }
                            return { ...prev, cssVars: newCssVars };
                          });
                        }}
                        className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLocalComponent(prev => ({
                        ...prev,
                        cssVars: {
                          ...prev.cssVars,
                          dark: {
                            ...(prev.cssVars?.dark || {}),
                            '--new-var': ''
                          }
                        }
                      }));
                    }}
                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors h-7"
                  >
                    Add Dark Mode Variable
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Component ID */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Component ID</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Change the unique identifier for this component
                </p>
              </div>
            </div>
            <form 
              action={async (formData: FormData) => {
                const newId = formData.get('componentId') as string;
                if (newId && newId !== component.name) {
                  const result = await updateComponentAction(subdomain, component.name, {
                    ...localComponent,
                    name: newId
                  });
                  if (result.success) {
                    window.location.href = `/items/${newId}`;
                  }
                }
              }}
              className="flex gap-1"
            >
              <Input
                name="componentId"
                defaultValue={localComponent.name}
                placeholder="component-id"
                className="flex-1 text-sm bg-gray-100 dark:bg-gray-950 border-0 h-8"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors h-8"
              >
                Save & Update URL
              </Button>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Note: This will change the component's URL and installation path
            </p>
          </div>

          {/* Delete Item */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Delete Item</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Permanently remove this component from the registry
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  Delete Item
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Item</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{localComponent.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    onClick={handleDeleteItem}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalComponent(component); // Reset to server state
                setIsEditing(false);
              }}
              className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors h-7"
            >
              Back to View
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors h-7"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-8">
      {isEditing ? <EditMode /> : <ViewMode />}
    </div>
  );
} 