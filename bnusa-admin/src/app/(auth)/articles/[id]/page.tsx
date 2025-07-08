'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DocumentTextIcon, 
  ArrowUturnLeftIcon, 
  CheckIcon, 
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { isAuthenticated } from '@/lib/auth';
import React from 'react';
import parse from 'html-react-parser';

// Define the article type
interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  description?: string;
  featuredImage?: string;
  images?: string[];
  categories: string[];
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  author: {
    _id: string;
    name: string;
    username: string;
  };
  status: 'published' | 'pending' | 'rejected' | 'draft';
  likes: number;
  comments: number;
  youtubeLinks?: string[];
  resourceLinks?: Array<{url: string, title: string, type: string}>;
}

export default function ArticleEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const articleId = params.id;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'published' | 'pending' | 'rejected' | 'draft'>('draft');
  
  // New category/tag inputs
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  
  const [imageUrl, setImageUrl] = useState('');
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [imageTestResult, setImageTestResult] = useState<'success' | 'error' | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // YouTube links
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
  const [newYoutubeLink, setNewYoutubeLink] = useState('');
  
  // Resource links
  const [resourceLinks, setResourceLinks] = useState<Array<{url: string, title: string, type: string}>>([]);
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState('pdf');
  
  // Double-check authentication on client side
  useLayoutEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);
  
  useEffect(() => {
    fetchArticle();
  }, [articleId]);
  
  const fetchArticle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Add debug info for troubleshooting
      console.log('Fetching article data for ID:', articleId);
      
      const response = await fetch(`/api/admin/articles/${articleId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch article');
      }
      
      // Enhanced debugging - log the entire raw response
      console.log('Raw API response:', JSON.stringify(data));
      
      // Check specific fields for YouTube and resource links
      console.log('Raw youtubeLinks in API response:', data.article.youtubeLinks);
      console.log('Raw resourceLinks in API response:', data.article.resourceLinks);
      
      setArticle(data.article);
      
      // Set form values
      setTitle(data.article.title || '');
      setContent(data.article.content || '');
      setDescription(data.article.description || '');
      setFeaturedImage(data.article.featuredImage || '');
      setCategories(data.article.categories || []);
      setTags(data.article.tags || []);
      setStatus(data.article.status || 'draft');
      setImages(data.article.images || []);
      
      // Ensure youtubeLinks and resourceLinks are always initialized as arrays
      // CRITICAL: These arrays must be properly handled and not lost during state transitions
      const ytLinks = Array.isArray(data.article.youtubeLinks) ? [...data.article.youtubeLinks] : [];
      const resLinks = Array.isArray(data.article.resourceLinks) ? [...data.article.resourceLinks] : [];
      
      console.log('Setting youtubeLinks from API response:', ytLinks);
      console.log('Setting resourceLinks from API response:', resLinks);
      
      // Set state directly with values from API response
      setYoutubeLinks(ytLinks);
      setResourceLinks(resLinks);
      
      // Immediate verification of state updates using a separate function 
      // to ensure we're getting fresh state values
      setTimeout(() => {
        console.log('VERIFICATION CHECK - current youtubeLinks state:', youtubeLinks);
        console.log('VERIFICATION CHECK - expected youtubeLinks:', ytLinks);
        console.log('VERIFICATION CHECK - current resourceLinks state:', resourceLinks);
        console.log('VERIFICATION CHECK - expected resourceLinks:', resLinks);
      }, 100);
      
      console.log('Article loaded successfully:', data.article.title);
      
      // Enhanced debugging for YouTube links and resource links
      console.log('Raw article data:', data.article);
      console.log('YouTube links:', ytLinks);
      console.log('Resource links:', resLinks);
      
      // Debug: Check if article has YouTube links
      if (data.article.youtubeLinks) {
        console.log(`Article has youtubeLinks property: ${typeof data.article.youtubeLinks}`);
        if (Array.isArray(data.article.youtubeLinks)) {
          console.log(`Article has ${data.article.youtubeLinks.length} YouTube links`);
        } else {
          console.log(`Article youtubeLinks is not an array: ${data.article.youtubeLinks}`);
        }
      } else {
        console.log('Article has no youtubeLinks property');
      }
      
      // Debug: Check if article has resource links
      if (data.article.resourceLinks) {
        console.log(`Article has resourceLinks property: ${typeof data.article.resourceLinks}`);
        if (Array.isArray(data.article.resourceLinks)) {
          console.log(`Article has ${data.article.resourceLinks.length} resource links`);
        } else {
          console.log(`Article resourceLinks is not an array: ${data.article.resourceLinks}`);
        }
      } else {
        console.log('Article has no resourceLinks property');
      }
      
      // Debug: Check if article has images array 
      if (data.article.images && Array.isArray(data.article.images)) {
        console.log(`Article has ${data.article.images.length} additional images`);
      }
    } catch (error: any) {
      console.error('Error fetching article:', error);
      setError(error.message || 'Failed to load article');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };
  
  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };
  
  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Ensure arrays are properly prepared before sending
      const youtubeLinksPrepared = Array.isArray(youtubeLinks) ? youtubeLinks : [];
      
      // Ensure resourceLinks have the correct structure
      let resourceLinksPrepared: Array<{url: string, title: string, type: string}> = [];
      if (Array.isArray(resourceLinks)) {
        resourceLinksPrepared = resourceLinks.map(resource => {
          // Ensure each resource has the required fields
          return {
            url: resource.url || '',
            title: resource.title || '',
            type: resource.type || 'web'
          };
        });
      }
      
      // Debug before saving
      console.log('Saving article with the following data:');
      console.log('YouTube links:', youtubeLinksPrepared, 'Count:', youtubeLinksPrepared.length);
      console.log('Resource links:', resourceLinksPrepared, 'Count:', resourceLinksPrepared.length);
      
      const articleData = {
        title,
        content,
        description,
        featuredImage,
        categories,
        tags,
        status,
        images,
        youtubeLinks: youtubeLinksPrepared,
        resourceLinks: resourceLinksPrepared
      };
      
      console.log('Full article data being sent:', articleData);
      
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });
      
      const data = await response.json();
      
      // Log response data for debugging
      console.log('Response from API:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update article');
      }
      
      // Verify the returned data to make sure YouTube and resource links are included
      console.log('YouTube links in response:', data.article?.youtubeLinks);
      console.log('Resource links in response:', data.article?.resourceLinks);
      
      setSuccess('Article updated successfully');
      
      // Reload the article to get updated data
      fetchArticle();
    } catch (error: any) {
      console.error('Error updating article:', error);
      setError(error.message || 'An error occurred while updating the article');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePreview = () => {
    setIsEditing(false);
    setPreviewMode(true);
  };
  
  const handleEditMode = () => {
    setIsEditing(true);
    setPreviewMode(false);
  };
  
  const handleOpenPreviewInNewTab = () => {
    // Open preview in a new tab
    const previewUrl = `/articles/preview/${articleId}`;
    window.open(previewUrl, '_blank');
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const handleInsertImage = () => {
    if (!imageUrl) return;
    
    // Validate the image URL
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    };
    
    if (!isValidUrl(imageUrl)) {
      alert('Please enter a valid URL for the image');
      return;
    }
    
    // Log for debugging
    console.log('Inserting image:', imageUrl);
    
    // Create the image HTML tag with proper HTML attributes for responsive behavior
    // Using simple HTML attributes instead of style properties for better compatibility
    const imgTag = `\n<img src="${imageUrl}" alt="Article image" width="100%" height="auto" style="display: block; max-width: 100%; height: auto; margin: 20px auto; border-radius: 8px;" />\n`;
    
    // Insert at cursor position if available, otherwise append to the end
    if (contentTextareaRef.current) {
      const textarea = contentTextareaRef.current;
      const cursorPos = textarea.selectionStart;
      
      const textBefore = content.substring(0, cursorPos);
      const textAfter = content.substring(cursorPos);
      
      // Set the new content with the image tag inserted
      const newContent = textBefore + imgTag + textAfter;
      setContent(newContent);
      
      // Log the new content for debugging
      console.log('Content updated with image', newContent.includes(imageUrl));
      
      // Reset the image URL input
      setImageUrl('');
      
      // Focus back on the textarea and place cursor after the inserted image
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = cursorPos + imgTag.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // If textarea ref isn't available, just append to the end
      setContent(content + imgTag);
      setImageUrl('');
    }
  };
  
  // Add more helper methods for text formatting
  const insertFormatting = (startTag: string, endTag: string = '') => {
    if (!contentTextareaRef.current) return;
    
    const textarea = contentTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const textBefore = content.substring(0, start);
    const textAfter = content.substring(end);
    
    // Insert the formatting tags around the selected text
    const newText = textBefore + startTag + selectedText + (endTag || startTag) + textAfter;
    setContent(newText);
    
    // Focus back on the textarea and maintain selection with the new tags
    setTimeout(() => {
      textarea.focus();
      const newSelectionStart = start + startTag.length;
      const newSelectionEnd = newSelectionStart + selectedText.length;
      textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
    }, 0);
  };
  
  const handleBoldClick = () => insertFormatting('<strong>', '</strong>');
  const handleItalicClick = () => insertFormatting('<em>', '</em>');
  const handleUnderlineClick = () => insertFormatting('<u>', '</u>');
  
  const handleHeadingClick = (level: number) => {
    const headingTag = `<h${level}>`;
    const closingTag = `</h${level}>`;
    insertFormatting(headingTag, closingTag);
  };
  
  const handleListClick = (type: 'ul' | 'ol') => {
    if (!contentTextareaRef.current) return;
    
    const textarea = contentTextareaRef.current;
    const start = textarea.selectionStart;
    
    let listTemplate = '';
    if (type === 'ul') {
      listTemplate = '\n<ul>\n  <li>List item 1</li>\n  <li>List item 2</li>\n  <li>List item 3</li>\n</ul>\n';
    } else {
      listTemplate = '\n<ol>\n  <li>List item 1</li>\n  <li>List item 2</li>\n  <li>List item 3</li>\n</ol>\n';
    }
    
    const textBefore = content.substring(0, start);
    const textAfter = content.substring(start);
    
    // Insert the list template
    const newText = textBefore + listTemplate + textAfter;
    setContent(newText);
    
    // Focus back on the textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + listTemplate.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  
  const handleTestImage = () => {
    if (!imageUrl) return;
    
    setIsTestingImage(true);
    setImageTestResult(null);
    
    // Create a new image element to test loading
    const img = new Image();
    
    img.onload = () => {
      console.log('Test image loaded successfully');
      setIsTestingImage(false);
      setImageTestResult('success');
    };
    
    img.onerror = () => {
      console.error('Test image failed to load');
      setIsTestingImage(false);
      setImageTestResult('error');
    };
    
    // Start loading the image
    img.src = imageUrl;
  };
  
  const handleAddImage = () => {
    if (!newImageUrl) return;
    
    // Validate URL
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    };
    
    if (!isValidUrl(newImageUrl)) {
      alert('Please enter a valid URL for the image');
      return;
    }
    
    // Add the new image URL to the images array
    setImages([...images, newImageUrl]);
    
    // Clear the input field
    setNewImageUrl('');
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  const handleAddYoutubeLink = () => {
    if (!newYoutubeLink.trim()) {
      setError('Please enter a YouTube link');
      return;
    }
    
    // Validate the YouTube link format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    if (!youtubeRegex.test(newYoutubeLink)) {
      setError('Please enter a valid YouTube video URL');
      return;
    }
    
    // Check for duplicates
    if (youtubeLinks.includes(newYoutubeLink)) {
      setError('This YouTube link is already added');
      return;
    }
    
    // Add to state
    setYoutubeLinks([...youtubeLinks, newYoutubeLink.trim()]);
    
    // Log the updated array for debugging
    console.log('YouTube link added:', newYoutubeLink.trim());
    console.log('Updated youtubeLinks array:', [...youtubeLinks, newYoutubeLink.trim()]);
    
    // Clear the input field
    setNewYoutubeLink('');
    setError(null);
  };
  
  const handleRemoveYoutubeLink = (index: number) => {
    const newLinks = [...youtubeLinks];
    newLinks.splice(index, 1);
    setYoutubeLinks(newLinks);
  };
  
  const handleAddResourceLink = () => {
    if (!newResourceUrl.trim() || !newResourceTitle.trim()) {
      setError('Please enter both URL and title for the resource');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(newResourceUrl);
    } catch (e) {
      setError('Please enter a valid URL for the resource');
      return;
    }
    
    // Check for duplicates
    if (resourceLinks.some(resource => resource.url === newResourceUrl)) {
      setError('This resource link is already added');
      return;
    }
    
    // Create a properly structured resource object
    const newResource = {
      url: newResourceUrl.trim(),
      title: newResourceTitle.trim(),
      type: newResourceType || 'web'
    };
    
    // Add to state
    setResourceLinks([...resourceLinks, newResource]);
    
    // Log the updated array for debugging
    console.log('Resource link added:', newResource);
    console.log('Updated resourceLinks array:', [...resourceLinks, newResource]);
    
    // Clear the input fields
    setNewResourceUrl('');
    setNewResourceTitle('');
    setError(null);
  };
  
  const handleRemoveResourceLink = (index: number) => {
    const newLinks = [...resourceLinks];
    newLinks.splice(index, 1);
    setResourceLinks(newLinks);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!article && !isLoading) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error || 'Article not found. It may have been deleted or you do not have permission to view it.'}
            </p>
            <div className="mt-4">
              <button
                onClick={() => router.push('/articles')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
                Back to Articles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditing ? 'Edit Article' : 'Preview Article'}
        </h1>
        
        <div className="flex space-x-3">
          <button
            onClick={() => router.push('/articles')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
            Back
          </button>
          
          {isEditing ? (
            <button
              onClick={handlePreview}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              Preview
            </button>
          ) : (
            <button
              onClick={handleEditMode}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </button>
          )}
          
          <button
            onClick={handleOpenPreviewInNewTab}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            Full Preview
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {isEditing ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-1">
                Featured Image URL
              </label>
              <input
                type="text"
                id="featuredImage"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
              {featuredImage && (
                <div className="mt-2">
                  <img 
                    src={featuredImage} 
                    alt="Featured preview" 
                    className="h-32 w-auto object-cover rounded-md" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Additional Images Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Images
              </label>
              <p className="text-sm text-gray-500 mb-2">
                These images will be displayed in a gallery in the article preview.
              </p>
              
              {/* Display existing images */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {images.map((imgUrl, index) => (
                    <div key={`img-${index}`} className="relative group">
                      <img 
                        src={imgUrl} 
                        alt={`Article image ${index + 1}`} 
                        className="h-24 w-full object-cover rounded-md border border-gray-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x150?text=Image+Not+Found';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add new image */}
              <div className="flex mt-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Image
                </button>
              </div>
            </div>
            
            {/* YouTube Links Section */}
            <div className="mb-6 border rounded-md p-4 bg-white">
              <h2 className="text-lg font-medium mb-4">YouTube Videos</h2>
              
              {/* Debug information */}
              <div className="p-2 mb-2 text-xs bg-gray-100 rounded">
                <div><strong>Debug Info:</strong></div>
                <div>youtubeLinks state variable: {JSON.stringify(youtubeLinks)}</div>
                <div>youtubeLinks length: {youtubeLinks ? youtubeLinks.length : 'undefined'}</div>
                <div>youtubeLinks is array: {Array.isArray(youtubeLinks) ? 'Yes' : 'No'}</div>
                {article && article.youtubeLinks && (
                  <div>
                    <div>Original article.youtubeLinks: {JSON.stringify(article.youtubeLinks)}</div>
                    <div>Original article.youtubeLinks is array: {Array.isArray(article.youtubeLinks) ? 'Yes' : 'No'}</div>
                    <div>Original article.youtubeLinks length: {article.youtubeLinks.length}</div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add YouTube URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={newYoutubeLink}
                    onChange={(e) => setNewYoutubeLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleAddYoutubeLink}
                    className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {youtubeLinks.length > 0 ? (
                <div className="space-y-3 mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Videos ({youtubeLinks.length})</h3>
                  {youtubeLinks.map((link, index) => {
                    // Extract video ID for thumbnail
                    const videoId = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                        <div className="flex items-center">
                          {videoId && (
                            <div className="w-16 h-10 mr-2 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                              <img 
                                src={`https://img.youtube.com/vi/${videoId[1]}/default.jpg`} 
                                alt="YouTube thumbnail" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span className="text-sm truncate max-w-xs">{link}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveYoutubeLink(index)}
                          className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded">
                  {article?.youtubeLinks && article.youtubeLinks.length > 0 ? (
                    <div className="text-center">
                      <p className="text-yellow-600 mb-2">
                        {article.youtubeLinks.length} YouTube links found in the article but not showing here. 
                      </p>
                      <button
                        type="button"
                        onClick={() => setYoutubeLinks([...article.youtubeLinks])}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700"
                      >
                        Recover {article.youtubeLinks.length} YouTube Links
                      </button>
                    </div>
                  ) : (
                    <div>No YouTube videos added yet</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Resource Links Section */}
            <div className="mb-6 border rounded-md p-4 bg-white">
              <h2 className="text-lg font-medium mb-4">Resource Links</h2>
              
              {/* Debug information */}
              <div className="p-2 mb-2 text-xs bg-gray-100 rounded">
                <div><strong>Debug Info:</strong></div>
                <div>resourceLinks state variable: {JSON.stringify(resourceLinks)}</div>
                <div>resourceLinks length: {resourceLinks ? resourceLinks.length : 'undefined'}</div>
                <div>resourceLinks is array: {Array.isArray(resourceLinks) ? 'Yes' : 'No'}</div>
                {article && article.resourceLinks && (
                  <div>
                    <div>Original article.resourceLinks: {JSON.stringify(article.resourceLinks)}</div>
                    <div>Original article.resourceLinks is array: {Array.isArray(article.resourceLinks) ? 'Yes' : 'No'}</div>
                    <div>Original article.resourceLinks length: {article.resourceLinks.length}</div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource URL
                  </label>
                  <input
                    type="text"
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    placeholder="https://example.com/document.pdf"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                    placeholder="Research Paper"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={newResourceType}
                    onChange={(e) => setNewResourceType(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">Document</option>
                    <option value="presentation">Presentation</option>
                    <option value="spreadsheet">Spreadsheet</option>
                    <option value="googledoc">Google Document</option>
                    <option value="web">Web Page</option>
                  </select>
                </div>
                
                <div className="flex items-end ml-4">
                  <button
                    type="button"
                    onClick={handleAddResourceLink}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Resource
                  </button>
                </div>
              </div>
              
              {resourceLinks.length > 0 ? (
                <div className="space-y-3 mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Resources ({resourceLinks.length})</h3>
                  {resourceLinks.map((resource, index) => (
                    <div key={index} className="flex items-start justify-between bg-gray-50 p-3 rounded border">
                      <div>
                        <div className="flex items-center">
                          {/* Icon based on resource type */}
                          <span className="mr-2">
                            {resource.type === 'pdf' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : resource.type === 'doc' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            ) : resource.type === 'presentation' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                              </svg>
                            ) : resource.type === 'spreadsheet' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            )}
                          </span>
                          <span className="font-medium text-sm">{resource.title}</span>
                        </div>
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-indigo-600 hover:text-indigo-900 hover:underline truncate block mt-1 max-w-xs"
                        >
                          {resource.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveResourceLink(index)}
                        className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded">
                  {article?.resourceLinks && article.resourceLinks.length > 0 ? (
                    <div className="text-center">
                      <p className="text-yellow-600 mb-2">
                        {article.resourceLinks.length} resource links found in the article but not showing here. 
                      </p>
                      <button
                        type="button"
                        onClick={() => setResourceLinks([...article.resourceLinks])}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700"
                      >
                        Recover {article.resourceLinks.length} Resource Links
                      </button>
                    </div>
                  ) : (
                    <div>No resource links added yet</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              
              {/* Text formatting toolbar */}
              <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2 flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={handleBoldClick}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md bg-white hover:bg-gray-50"
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={handleItalicClick}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md bg-white hover:bg-gray-50"
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  onClick={() => handleUnderlineClick()}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md bg-white hover:bg-gray-50"
                  title="Underline"
                >
                  <u>U</u>
                </button>
                <span className="border-l h-6 mx-1 border-gray-300"></span>
                <button
                  type="button"
                  onClick={() => handleHeadingClick(2)}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md bg-white hover:bg-gray-50"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => handleHeadingClick(3)}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md bg-white hover:bg-gray-50"
                  title="Heading 3"
                >
                  H3
                </button>
                <span className="border-l h-6 mx-1 border-gray-300"></span>
                <button
                  type="button"
                  onClick={() => handleListClick('ul')}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md bg-white hover:bg-gray-50"
                  title="Bullet List"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => handleListClick('ol')}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md bg-white hover:bg-gray-50"
                  title="Numbered List"
                >
                  1. List
                </button>
                <span className="border-l h-6 mx-1 border-gray-300"></span>
                <button
                  type="button"
                  onClick={() => {
                    // Focus the image URL input
                    const imageInput = document.querySelector('input[placeholder="Enter image URL to insert"]') as HTMLInputElement;
                    if (imageInput) {
                      imageInput.focus();
                    }
                  }}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md bg-white hover:bg-gray-50"
                  title="Insert Image"
                >
                  🖼️ Image
                </button>
              </div>
              
              {/* Image URL field */}
              <div className="bg-gray-50 border-l border-r border-gray-300 py-2 px-2">
                <div className="flex items-center">
                  <span className="text-xs font-medium text-gray-700 mr-2">Image URL:</span>
                  <input
                    type="text" 
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      // Reset test result when URL changes
                      setImageTestResult(null);
                    }}
                    placeholder="Enter image URL to insert"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleTestImage}
                    disabled={!imageUrl || isTestingImage}
                    className="ml-2 inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    title="Test image URL"
                  >
                    {isTestingImage ? 'Testing...' : 'Test'}
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertImage}
                    disabled={!imageUrl}
                    className={`ml-2 inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md focus:outline-none ${
                      imageTestResult === 'success' 
                        ? 'border-transparent text-white bg-green-600 hover:bg-green-700'
                        : 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                    }`}
                  >
                    Insert Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('https://via.placeholder.com/800x400?text=Sample+Image')}
                    className="ml-2 inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    title="Use sample image"
                  >
                    Sample
                  </button>
                </div>
                
                {/* Image test result */}
                {imageTestResult && (
                  <div className={`mt-2 p-2 rounded-md ${imageTestResult === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {imageTestResult === 'success' ? (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-2">
                          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-green-700">Image loaded successfully! You can insert it now.</p>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-2">
                          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <p className="text-sm text-red-700">Image failed to load. Please check the URL and try again.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Content textarea */}
              <textarea
                ref={contentTextareaRef}
                name="content"
                value={content}
                onChange={handleContentChange}
                placeholder="Write your article content here... You can use HTML tags for formatting."
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-b-md h-96"
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                You can use HTML tags for advanced formatting. Select text and use the buttons above to format.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categories.map((category) => (
                    <span 
                      key={category} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {category}
                      <button 
                        type="button"
                        onClick={() => handleRemoveCategory(category)}
                        className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                      >
                        <span className="sr-only">Remove</span>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex mt-1">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                    placeholder="Add a category"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {tag}
                      <button 
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1.5 inline-flex text-green-400 hover:text-green-600 focus:outline-none"
                      >
                        <span className="sr-only">Remove</span>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex mt-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending Review</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Preview mode */}
          <div className="p-6">
            <div className="prose max-w-none">
              {/* Featured Image (Preview Mode) */}
              {previewMode && featuredImage && (
                <div className="w-full h-64 bg-gray-200 relative mb-6">
                  <img
                    src={featuredImage}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Featured image failed to load:', featuredImage);
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x400?text=Image+Not+Found';
                    }}
                  />
                </div>
              )}
              
              {/* Title and meta */}
              <h1 className="text-3xl font-bold mb-4">{title}</h1>
              
              {article?.author && (
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <span>By {article.author.name}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    status === 'published' ? 'bg-green-100 text-green-800' :
                    status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              )}
              
              {/* Categories and tags */}
              {(categories.length > 0 || tags.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map(category => (
                    <span 
                      key={category} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {category}
                    </span>
                  ))}
                  
                  {tags.map(tag => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Description */}
              {description && (
                <div className="text-gray-700 mb-6 font-medium italic">
                  {description}
                </div>
              )}
              
              {/* Additional Images in Preview Mode */}
              {previewMode && images.length > 0 && (
                <div className="my-6">
                  <h2 className="text-xl font-semibold mb-4">Article Images</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {images.map((imgUrl, index) => (
                      <div key={`preview-img-${index}`} className="overflow-hidden rounded-lg border border-gray-200">
                        <img 
                          src={imgUrl} 
                          alt={`Article image ${index + 1}`}
                          className="w-full h-48 object-cover"
                          onLoad={() => console.log('Preview image loaded successfully:', imgUrl)}
                          onError={(e) => {
                            console.error('Preview image failed to load:', imgUrl);
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Content */}
              <div 
                className={`mb-6 ${previewMode ? 'prose prose-lg max-w-none' : ''}`}
              >
                {previewMode ? (
                  content.includes('<img') || (content.includes('<') && content.includes('>'))
                    ? parse(content, {
                        replace: (domNode) => {
                          // Log all DOM nodes for debugging
                          console.log('Preview mode parsing node:', domNode);
                          
                          if (domNode.type === 'tag' && domNode.name === 'img') {
                            const element = domNode as any;
                            // Log the image for debugging
                            console.log('Preview mode found image:', element.attribs);
                            
                            // Create a unique key for this image
                            const imageKey = `preview-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                            
                            // Add necessary attributes and error handling
                            return (
                              <div key={imageKey} className="my-6 text-center">
                                <img 
                                  src={element.attribs.src} 
                                  alt={element.attribs.alt || title}
                                  width="100%"
                                  height="auto"
                                  className="max-w-full rounded-lg mx-auto"
                                  style={{
                                    display: 'block',
                                    maxWidth: '100%',
                                    margin: '0 auto',
                                    border: '1px solid #eaeaea'
                                  }}
                                  onLoad={() => console.log('Preview image loaded successfully:', element.attribs.src)}
                                  onError={(e) => {
                                    console.error('Preview image failed to load:', element.attribs.src);
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
                                    (e.target as HTMLImageElement).style.border = '1px solid #ff0000';
                                  }}
                                />
                              </div>
                            );
                          }
                          return undefined;
                        }
                      })
                    : content.split('\n').map((paragraph, idx) => (
                        paragraph ? <p key={idx}>{paragraph}</p> : <br key={idx} />
                      ))
                ) : (
                  <></>
                )}
              </div>
              
              {/* YouTube Links Section - Preview Mode */}
              {previewMode && youtubeLinks.length > 0 && (
                <div className="my-8">
                  <h3 className="text-lg font-semibold mb-4">YouTube Videos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {youtubeLinks.map((link, index) => {
                      // Extract YouTube video ID
                      const videoId = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                      
                      return videoId ? (
                        <div key={`youtube-preview-${index}`} className="overflow-hidden rounded-lg border border-gray-200">
                          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                            <iframe 
                              src={`https://www.youtube.com/embed/${videoId[1]}`}
                              title={`YouTube video ${index + 1}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                            ></iframe>
                          </div>
                          <div className="p-2 bg-gray-50 text-xs text-gray-500 truncate">
                            {link}
                          </div>
                        </div>
                      ) : (
                        <div key={`youtube-invalid-preview-${index}`} className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-600">
                          Invalid YouTube URL: {link}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Resource Links Section - Preview Mode */}
              {previewMode && resourceLinks.length > 0 && (
                <div className="my-8">
                  <h3 className="text-lg font-semibold mb-4">Resources and Documents</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                      {resourceLinks.map((resource, index) => (
                        <li key={`resource-preview-${index}`} className="py-3 flex items-start">
                          <div className="flex-shrink-0 mr-3 mt-1">
                            {resource.type === 'pdf' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                              </svg>
                            ) : resource.type === 'doc' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            ) : resource.type === 'presentation' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                              </svg>
                            ) : resource.type === 'spreadsheet' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            ) : resource.type === 'googledoc' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1h6v1H5V6zm0 3h6v1H5V9zm0 3h6v1H5v-1z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 10-5.656-5.656l-1.102 1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                            <a 
                              href={resource.url} 
                              target="_blank"
                              rel="noopener noreferrer" 
                              className="text-xs text-indigo-600 hover:text-indigo-900 hover:underline truncate block"
                            >
                              {resource.url}
                            </a>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Open
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5z" />
                              </svg>
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Debugging info - only in preview mode */}
              {previewMode && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md text-xs text-gray-600">
                  <details>
                    <summary>Debug Info</summary>
                    <p className="mt-2"><strong>Content starts with:</strong> {content.substring(0, 100)}...</p>
                    <p className="mt-2"><strong>Contains img tags:</strong> {content.includes('<img') ? 'Yes' : 'No'}</p>
                    <p className="mt-2"><strong>Contains HTML:</strong> {content.includes('<') && content.includes('>') ? 'Yes' : 'No'}</p>
                    <p className="mt-2"><strong>Additional images:</strong> {images.length > 0 ? `${images.length} images` : 'None'}</p>
                    <p className="mt-2"><strong>YouTube links:</strong> {youtubeLinks.length > 0 ? `${youtubeLinks.length} videos` : 'None'}</p>
                    <p className="mt-2"><strong>Resource links:</strong> {resourceLinks.length > 0 ? `${resourceLinks.length} resources` : 'None'}</p>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 