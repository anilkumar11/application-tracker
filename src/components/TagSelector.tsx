import { useState, useEffect, useRef } from 'react';
import { Tag as TagIcon, X, Plus, Check } from 'lucide-react';
import { tagsApi } from '../lib/tagsApi';
import type { Tag } from '../lib/database.types';
import { useToast } from '../contexts/ToastContext';

interface TagSelectorProps {
  applicationId: string;
  selectedTags: Tag[];
  onTagsChange: () => void;
}

export default function TagSelector({ applicationId, selectedTags, onTagsChange }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  async function loadTags() {
    try {
      setLoading(true);
      const tags = await tagsApi.getAll();
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }

  async function toggleTag(tag: Tag) {
    const isSelected = selectedTags.some(t => t.id === tag.id);

    try {
      if (isSelected) {
        await tagsApi.removeFromApplication(applicationId, tag.id);
        toast.success(`Removed tag: ${tag.name}`);
      } else {
        await tagsApi.addToApplication(applicationId, tag.id);
        toast.success(`Added tag: ${tag.name}`);
      }
      onTagsChange();
    } catch (error) {
      console.error('Failed to toggle tag:', error);
      toast.error('Failed to update tag');
    }
  }

  async function createNewTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const newTag = await tagsApi.create(newTagName.trim(), newTagColor);
      await tagsApi.addToApplication(applicationId, newTag.id);
      toast.success(`Created and added tag: ${newTag.name}`);
      setNewTagName('');
      setNewTagColor('#3b82f6');
      setShowCreateForm(false);
      await loadTags();
      onTagsChange();
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error('Failed to create tag');
    }
  }

  const selectedTagIds = selectedTags.map(t => t.id);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-150"
      >
        <TagIcon className="w-3 h-3" />
        Tags
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Loading tags...</div>
          ) : (
            <>
              {allTags.length === 0 && !showCreateForm ? (
                <div className="px-4 py-3 text-sm text-gray-500">No tags available</div>
              ) : (
                <div className="space-y-1 px-2">
                  {allTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTag(tag);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-gray-700">{tag.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-green-600" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-gray-200 mt-2 pt-2 px-2">
                {showCreateForm ? (
                  <form onSubmit={createNewTag} className="space-y-2 px-1">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Tag name"
                      autoFocus
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <button
                        type="submit"
                        className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewTagName('');
                          setNewTagColor('#3b82f6');
                        }}
                        className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreateForm(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create new tag
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
