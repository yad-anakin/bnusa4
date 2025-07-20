'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback';
import { uploadImage, uploadMultipleImages } from '@/utils/imageUpload';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import EditorStyles from './EditorStyles';
import { sanitizeInput, validateInput, secureSanitize } from '@/utils/sanitize';
import { ArrowRightOnRectangleIcon, UserPlusIcon } from '@heroicons/react/24/solid';

// Import DOMPurify safely for client-side only
let DOMPurify: any;
if (typeof window !== 'undefined') {
  DOMPurify = require('dompurify');
}

// CSS for animations
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); }
    to { transform: translateY(0); }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  .scale-up {
    animation: scaleIn 0.3s ease-out;
  }
  
  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  
  .article-preview {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .article-preview img {
    max-width: 100% !important;
    height: auto !important;
    display: block !important;
  }
  
  .article-preview * {
    max-width: 100% !important;
    white-space: normal !important;
  }
  
  .article-preview h1, 
  .article-preview h2, 
  .article-preview h3, 
  .article-preview h4, 
  .article-preview h5, 
  .article-preview h6, 
  .article-preview p, 
  .article-preview ul, 
  .article-preview ol,
  .article-preview div,
  .article-preview span,
  .article-preview pre,
  .article-preview code {
    overflow-wrap: break-word !important;
    word-wrap: break-word !important;
    -ms-word-break: break-word !important;
    word-break: break-word !important;
    white-space: pre-wrap !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .article-preview table {
    table-layout: fixed !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
    display: block !important;
  }
  
  .article-preview td,
  .article-preview th {
    word-break: break-word !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  
  .article-preview pre {
    white-space: pre-wrap !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
  }
  
  .fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 9999 !important;
    background: white !important;
    padding: 2rem !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }
  
  /* Aspect ratio utilities */
  .aspect-w-16 {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  }
  
  .aspect-w-16.aspect-h-9 {
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  }
  
  .aspect-w-16.aspect-h-9 > * {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
`;

export default function WriteHerePage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  
  // Changed to true to show the editor by default
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  
  // Article state with sample content
  const [title, setTitle] = useState('سەردێڕی وتارەکەت لێرە بنووسە');
  const [description, setDescription] = useState('کورتەیەک دەربارەی وتارەکەت بنووسە کە سەرنجی خوێنەران ڕادەکێشێت...');
  const [content, setContent] = useState(`<h1>سەردێڕی سەرەکی</h1>
<h2>بەشی یەکەم</h2>
<p>لێرە ناوەڕۆکی وتارەکەت دەست پێ دەکەیت. ئەمە تەنها نموونەیەکە، دەتوانیت بیگۆڕیت.</p>
<h2>بەشی دووەم</h2>
<ul>
  <li>خاڵی یەکەم</li>
  <li>خاڵی دووەم</li>
  <li>خاڵی سێیەم</li>
</ul>
<p><em>دەقی لار</em> و <strong>دەقی تۆخ</strong> دەتوانیت بەکار بهێنیت.</p>`);
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
  const [youtubeError, setYoutubeError] = useState('');
  
  // Resource links state
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState('auto');
  const [resourceLinks, setResourceLinks] = useState<Array<{url: string; title: string; type: string;}>>([]);
  const [resourceError, setResourceError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageRef = useRef<HTMLInputElement>(null);
  
  // Selected categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Added a reference to store selection
  const savedSelectionRef = useRef<Range | null>(null);
  
  // Reset error message when user makes changes to required fields
  useEffect(() => {
    if (submissionError) {
      setSubmissionError('');
    }
  }, [title, description, content, coverImage, selectedCategories, submissionError]);
  
  // Toggle category selection
  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };
  
  // Mock login (just for demo)
  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  
  // Add a resetForm function
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContent('');
    setImages([]);
    setCoverImage('');
    setSelectedCategories([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };
  
  // Success Modal Component
  const SuccessModal = () => {
    if (!showSuccessModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md mx-auto relative animate-success-appear">
          <div className="text-center mb-6">
            <div className="rounded-full bg-green-100 p-3 mx-auto w-24 h-24 flex items-center justify-center mb-4">
              <svg className="w-16 h-16 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">وتارەکەت بە سەرکەوتوویی نێردرا!</h2>
            <p className="text-gray-600 mb-4">
              سوپاس بۆ ناردنی وتارەکەت. وتارەکەت ئێستا لە دۆخی <strong>چاوەڕوانی پێداچوونەوە</strong>دایە و پێویستی بە پەسەندکردنی بەڕێوبەر هەیە پێش بڵاوکردنەوە.
            </p>
            <p className="text-gray-600 mb-4">
              دۆخی وتارەکەت دەتوانیت لە پرۆفایلەکەتدا ببینیت. ئێمە هەوڵ دەدەین وتارەکەت زوو بە زوو پێداچوونەوەی بۆ بکەین.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Link href="/profile" className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors">
              پرۆفایلەکەم ببینە
            </Link>
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                resetForm();
                router.push('/');
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              بگەڕێوە بۆ سەرەتا
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Execute commands for the editor
  const executeCommand = (command: string, value: string = '') => {
    // First focus the editor to make sure it's active
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    // Restore saved selection if available
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(savedSelectionRef.current);
        } catch (e) {
          console.error('Error restoring selection:', e);
        }
      }
    }
    
    // Security check: Validate command to prevent injection
    const validCommands = [
      'bold', 'italic', 'underline', 
      'justifyLeft', 'justifyRight', 'justifyCenter', 'justifyFull',
      'insertUnorderedList', 'insertOrderedList', 
      'indent', 'outdent', 
      'formatBlock', 'removeFormat',
      'hiliteColor', 'foreColor',
      'createLink', 'insertImage'
    ];
    
    if (!validCommands.includes(command)) {
      console.error('Invalid command rejected for security:', command);
      return;
    }
    
    // Sanitize any value input to prevent script injection
    let safeValue = value;
    
    // Special sanitization for formatBlock command
    if (command === 'formatBlock') {
      // Only allow specific HTML tags for formatting
      const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'blockquote', 'div'];
      if (!allowedTags.includes(value)) {
        console.error('Blocked formatBlock with unsafe value:', value);
        return;
      }
      safeValue = value;
    }
    
    // Special sanitization for color commands
    if (command === 'hiliteColor' || command === 'foreColor') {
      // Ensure value is a valid color
      if (!/^#[0-9A-F]{6}$/i.test(value) && 
          !/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(value) &&
          !/^[a-z]+$/i.test(value)) {
        console.error('Blocked color command with unsafe value:', value);
        return;
      }
      safeValue = value;
    }
    
    // Save the current selection before applying command
    const selection = window.getSelection();
    let savedSelection = null;
    if (selection && selection.rangeCount > 0) {
      savedSelection = selection.getRangeAt(0).cloneRange();
    }
    
    // Apply the command immediately using document.execCommand
    try {
      if (command === 'formatBlock') {
        // For headings and paragraphs
        document.execCommand('formatBlock', false, `<${safeValue}>`);
      } else if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
        // For lists
        document.execCommand(command, false, '');
        
        // Then ensure proper styling
        setTimeout(() => {
          if (editorRef.current) {
            const lists = editorRef.current.querySelectorAll('ul, ol');
            lists.forEach(list => {
              if (list instanceof HTMLElement) {
                list.style.paddingRight = '2rem';
                list.style.margin = '1rem 0';
                
                const items = list.querySelectorAll('li');
                items.forEach(item => {
                  if (item instanceof HTMLElement) {
                    item.style.marginBottom = '0.5rem';
                    item.style.display = 'list-item';
                  }
                });
              }
            });
          }
        }, 10);
      } else if (command === 'bold' || command === 'italic' || command === 'underline') {
        // Simple formatting commands
        document.execCommand(command, false, '');
      } else if (command === 'hiliteColor' || command === 'foreColor') {
        // Apply colors
        document.execCommand(command, false, safeValue);
      } else {
        // For all other commands
        document.execCommand(command, false, safeValue);
      }
      
      // Update content after command execution
      if (editorRef.current) {
        // Save the new content
        setContent(editorRef.current.innerHTML);
        
        // Restore selection if available
        if (savedSelection) {
          setTimeout(() => {
            const selection = window.getSelection();
            if (selection) {
              try {
                selection.removeAllRanges();
                selection.addRange(savedSelection);
                // Save the restored selection for future use
                savedSelectionRef.current = savedSelection;
                // Focus the editor to make the selection visible
                editorRef.current?.focus();
              } catch (e) {
                console.error('Error restoring selection after command:', e);
              }
            }
          }, 10);
        }
      }
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
    }
  };
  
  // Helper function to ensure links open in a new tab
  const ensureLinksOpenInNewTab = () => {
    if (editorRef.current) {
      const links = editorRef.current.querySelectorAll('a');
      links.forEach(link => {
        if (link instanceof HTMLAnchorElement) {
          link.target = '_blank';
          // Add rel attribute for security
          link.rel = 'noopener noreferrer';
        }
      });
    }
  };

  // Handle content change with enhanced link handling
  const handleContentChange = () => {
    if (editorRef.current) {
      // First ensure all links have target="_blank"
      ensureLinksOpenInNewTab();
      
      // Save current selection position before updating content
      const selection = window.getSelection();
      let savedCursorPosition: Range | null = null;
      
      if (selection && selection.rangeCount > 0) {
        savedCursorPosition = selection.getRangeAt(0).cloneRange();
      }
      
      // Then update content only when it actually changes
      const newContent = editorRef.current.innerHTML;
      if (newContent !== content) {
        // Enter fullscreen mode if not already in fullscreen
        if (!isFullscreen) {
          setIsFullscreen(true);
        }
        
        // Sanitize the HTML content to prevent XSS
        let sanitizedContent = newContent;
        
        // Only use DOMPurify on the client side
        if (typeof window !== 'undefined' && DOMPurify) {
          sanitizedContent = DOMPurify.sanitize(newContent, {
            ALLOWED_TAGS: [
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'br', 'a', 
              'strong', 'em', 'u', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 
              'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
            ],
            ALLOWED_ATTR: [
              'href', 'src', 'alt', 'title', 'style', 'target', 'rel', 'class',
              'width', 'height'
            ],
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'style'],
            FORBID_ATTR: [
              'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown',
              'onkeydown', 'onkeypress', 'onkeyup', 'onchange', 'onfocus', 'onblur'
            ],
            ADD_ATTR: ['target']
          });
        } else {
          // Fallback basic sanitization if DOMPurify is not available
          sanitizedContent = sanitizeInput(newContent);
        }
        
        // Update content state without changing DOM
        setContent(sanitizedContent);
        
        // Restore cursor position after state update
        if (savedCursorPosition && editorRef.current) {
          setTimeout(() => {
            if (selection && editorRef.current) {
              selection.removeAllRanges();
              selection.addRange(savedCursorPosition!);
              editorRef.current.focus();
            }
          }, 0);
        }
      }
    }
  };

  // Enhanced function to focus the editor at the selection point
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      // If we have a saved selection, restore it
      if (savedSelectionRef.current) {
        const selection = window.getSelection();
        if (selection) {
          try {
            selection.removeAllRanges();
            selection.addRange(savedSelectionRef.current);
          } catch (e) {
            console.error('Error restoring selection during focus:', e);
          }
        }
      }
    }
  };

  // Save selection when editor loses focus
  const handleEditorBlur = () => {
    const selection = window.getSelection();
    if (selection && 
        selection.rangeCount > 0 && 
        editorRef.current?.contains(selection.anchorNode)) {
      // Only save selections that are inside the editor
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  // Handle click inside editor
  const handleEditorClick = () => {
    // When clicking in the editor, update the current selection reference
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && 
          selection.rangeCount > 0 && 
          editorRef.current?.contains(selection.anchorNode)) {
        savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
      } else {
        // If clicked but no selection, clear saved selection
        savedSelectionRef.current = null;
      }
    }, 50); // Small delay to ensure selection is fully established
  };
  
  // Handle image uploads
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    // Limit to 5 images (changed from 10)
    if (images.length + files.length > 5) {
      setSubmissionError('ببوورە، تەنها دەتوانیت ٥ وێنە زیاد بکەیت.');
      setTimeout(() => setSubmissionError(''), 3000);
      return;
    }
    
    try {
      // Show loading state
      setIsUploading(true);
      
      // Check browser cache for these images first (using file metadata)
      const filesArray = Array.from(files);
      const cacheKeys = filesArray.map(file => `img_cache_${file.name}_${file.size}_${file.lastModified}`);
      
      // Try to get cached URLs first
      const cachedUrls: string[] = [];
      const filesToUpload: File[] = [];
      
      cacheKeys.forEach((key, index) => {
        const cachedUrl = localStorage.getItem(key);
        if (cachedUrl) {
          cachedUrls.push(cachedUrl);
        } else {
          filesToUpload.push(filesArray[index]);
        }
      });
      
      // Upload each non-cached image individually with proper error handling
      const uploadPromises = filesToUpload.map(async (file, index) => {
        try {
          // Use the API utility for uploads
          const result = await api.uploadImage(file, 'articles');
          
          // Save the URL to cache for future use
          const cacheKey = `img_cache_${file.name}_${file.size}_${file.lastModified}`;
          localStorage.setItem(cacheKey, result.imageUrl);
          
          console.log('Upload successful, image URL:', result.imageUrl);
          return result.imageUrl;
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          // Return a fallback image or null
          return null;
        }
      });
      
      // Wait for all uploads to complete
      const uploadedUrls = (await Promise.all(uploadPromises)).filter(url => url !== null);
      
      // Combine cached and newly uploaded URLs
      const allUrls = [...cachedUrls, ...uploadedUrls];
      
      if (allUrls.length === 0) {
        throw new Error('هیچ وێنەیەک بە سەرکەوتوویی بار نەکرا');
      }
      
      // Add the new URLs to the existing images array
      setImages([...images, ...allUrls]);
      
      if (uploadedUrls.length < filesToUpload.length) {
        setSubmissionError(`هەندێک وێنە بار نەبوون. ${uploadedUrls.length} لە ${filesToUpload.length} وێنە بە سەرکەوتوویی بار کران.`);
        setTimeout(() => setSubmissionError(''), 5000);
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      setSubmissionError(`ببوورە، کێشەیەک هەبوو لە باکردنی وێنەکان: ${error.message}`);
      setTimeout(() => setSubmissionError(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files[0]) return;
    
    const file = files[0];
    
    try {
      // Show loading state
      setIsUploading(true);
      
      // Check if this image is already in the browser cache
      const cacheKey = `cover_img_cache_${file.name}_${file.size}_${file.lastModified}`;
      const cachedUrl = localStorage.getItem(cacheKey);
      
      if (cachedUrl) {
        // console.log('Using cached cover image URL:', cachedUrl);
        setCoverImage(cachedUrl);
        return;
      }
      
      // Log info about the file being uploaded
      //      console.log(`Uploading cover image: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
      
      // Use the API utility for uploads
      const result = await api.uploadImage(file, 'covers');
      
      // Save the URL to cache for future use
      localStorage.setItem(cacheKey, result.imageUrl);
      
      //      console.log('Upload successful, image URL:', result.imageUrl);
      setCoverImage(result.imageUrl);
    } catch (error: any) {
      console.error('Error uploading cover image:', error);
      setSubmissionError(`ببوورە، کێشەیەک هەبوو لە باکردنی وێنەی سەرەکی: ${error.message}`);
      setTimeout(() => setSubmissionError(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  // Function to extract YouTube video ID from various YouTube URL formats
  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Function to validate YouTube URL
  const validateYoutubeUrl = (url: string): boolean => {
    // Check if URL contains youtube domain
    const isYoutubeUrl = url.includes('youtube.com') || url.includes('youtu.be');
    // Check if we can extract a valid video ID
    const videoId = extractYoutubeId(url);
    return isYoutubeUrl && videoId !== null;
  };

  // Function to handle adding YouTube links
  const handleAddYoutubeLink = () => {
    // Trim the input
    const trimmedInput = youtubeUrl.trim();
    
    // Check if input is empty
    if (!trimmedInput) {
      setYoutubeError('تکایە بەستەری یوتیوب دابنێ');
      return;
    }
    
    // Validate YouTube URL
    if (!validateYoutubeUrl(trimmedInput)) {
      setYoutubeError('ئەمە بەستەرێکی دروستی یوتیوب نییە');
      return;
    }
    
    // Check if already added (to prevent duplicates)
    if (youtubeLinks.includes(trimmedInput)) {
      setYoutubeError('ئەم بەستەرە پێشتر زیادکراوە');
      return;
    }
    
    // Limit the number of links
    if (youtubeLinks.length >= 3) {
      setYoutubeError('ناتوانیت زیاتر لە 3 بەستەری یوتیوب زیاد بکەیت');
      return;
    }
    
    // Create a new array to avoid reference issues
    const updatedLinks = [...youtubeLinks, trimmedInput];
    
    // Update state
    setYoutubeLinks(updatedLinks);
    
    // Clear input and error
    setYoutubeUrl('');
    setYoutubeError('');
  };

  // Function to remove a YouTube link
  const handleRemoveYoutubeLink = (index: number) => {
    const newLinks = [...youtubeLinks];
    newLinks.splice(index, 1);
    setYoutubeLinks(newLinks);
  };
  
  // Function to validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Function to detect resource type from URL
  const detectResourceType = (url: string): string => {
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.endsWith('.pdf')) return 'pdf';
    if (lowercaseUrl.endsWith('.doc') || lowercaseUrl.endsWith('.docx')) return 'doc';
    if (lowercaseUrl.endsWith('.ppt') || lowercaseUrl.endsWith('.pptx')) return 'presentation';
    if (lowercaseUrl.endsWith('.xls') || lowercaseUrl.endsWith('.xlsx')) return 'spreadsheet';
    if (lowercaseUrl.includes('drive.google.com')) return 'googledoc';
    return 'web';
  };

  // Function to handle adding resource links
  const handleAddResourceLink = () => {
    // Trim inputs
    const trimmedUrl = resourceUrl.trim();
    const trimmedTitle = resourceTitle.trim();
    
    // Validate URL
    if (!trimmedUrl) {
      setResourceError('تکایە بەستەری سەرچاوە دابنێ');
      return;
    }
    
    if (!isValidUrl(trimmedUrl)) {
      setResourceError('ئەمە بەستەرێکی دروست نییە');
      return;
    }
    
    // Validate title
    if (!trimmedTitle) {
      setResourceError('تکایە ناونیشانی سەرچاوە دابنێ');
      return;
    }
    
    // Check for duplicates
    if (resourceLinks.some(link => link.url === trimmedUrl)) {
      setResourceError('ئەم بەستەرە پێشتر زیادکراوە');
      return;
    }

    // Limit the number of links to 5
    if (resourceLinks.length >= 5) {
      setResourceError('ناتوانیت زیاتر لە 5 سەرچاوە زیاد بکەیت');
      return;
    }
    
    // Auto-detect type if not specified
    const type = resourceType === 'auto' ? detectResourceType(trimmedUrl) : resourceType;
    
    // Create a new resource link object
    const newResource = {
      url: trimmedUrl,
      title: trimmedTitle,
      type
    };
    
    // Create a new array to avoid reference issues
    const updatedLinks = [...resourceLinks, newResource];
    
    // Update state
    setResourceLinks(updatedLinks);
    
    // Clear inputs and error
    setResourceUrl('');
    setResourceTitle('');
    setResourceError('');
  };

  // Function to remove a resource link
  const handleRemoveResourceLink = (index: number) => {
    const newLinks = [...resourceLinks];
    newLinks.splice(index, 1);
    setResourceLinks(newLinks);
  };

  // Function to get icon for resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
          </svg>
        );
      case 'doc':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 5v14l8 3 8-3V5l-8-3zm0 2.8L17 7v10l-5 1.9L7 17V7l5-2.2z" />
          </svg>
        );
      case 'presentation':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22a10 10 0 110-20 10 10 0 010 20zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
          </svg>
        );
      case 'spreadsheet':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM7 15h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
          </svg>
        );
      case 'googledoc':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 2H8C5.79 2 4 3.79 4 6v12c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4zm-8 18c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H8zm3-10h4c.55 0 1 .45 1 1s-.45 1-1 1h-4c-.55 0-1-.45-1-1s.45-1 1-1zm0 3h6c.55 0 1 .45 1 1s-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1zm0 3h2c.55 0 1 .45 1 1s-.45 1-1 1h-2c-.55 0-1-.45-1-1s.45-1 1-1z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
          </svg>
        );
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous error messages
    setSubmissionError('');
    
    // Form validation checks
    if (!coverImage) {
      setSubmissionError('پێویستە وێنەی سەرەکی وتارەکە دابنێیت');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (!title || title.trim() === '') {
      setSubmissionError('پێویستە سەردێڕی وتارەکە بنووسیت');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (!description || description.trim() === '') {
      setSubmissionError('پێویستە کورتەی وتارەکە بنووسیت');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (!content || content.trim() === '') {
      setSubmissionError('پێویستە ناوەڕۆکی وتارەکە بنووسیت');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (selectedCategories.length === 0) {
      setSubmissionError('پێویستە لانیکەم یەک جۆری بابەت هەڵبژێریت');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Function to generate a SEO-friendly slug
    const generateSlug = (text: string) => {
      // Basic slug generation
      const slug = text
        .toLowerCase()
        .replace(/[^\w\sا-ی]/g, '') // Remove special chars except Arabic/Kurdish chars
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/-+/g, '-'); // Replace multiple dashes with single dash
        
      // Add timestamp to ensure uniqueness
      const timestamp = Date.now().toString().slice(-6);
      return `${slug}-${timestamp}`;
    };
    
    try {
      // Ensure arrays are properly prepared 
      const cleanYoutubeLinks = Array.isArray(youtubeLinks) ? [...youtubeLinks] : [];
      const cleanResourceLinks = Array.isArray(resourceLinks) ? [...resourceLinks] : [];
      const cleanImages = Array.isArray(images) ? [...images] : [];

      // Sanitize text inputs for security
      const sanitizedTitle = sanitizeInput(title);
      const sanitizedDescription = sanitizeInput(description);
      // Content is already sanitized by DOMPurify in the editor
      
      // Sanitize resource links data
      const sanitizedResourceLinks = cleanResourceLinks.map(link => ({
        url: sanitizeInput(link.url),
        title: sanitizeInput(link.title),
        type: sanitizeInput(link.type)
      }));
      
      // Prepare article data with clean arrays and sanitized inputs
      const articleData = {
        title: sanitizedTitle,
        description: sanitizedDescription,
        content: content, // Already sanitized by DOMPurify
        categories: selectedCategories,
        coverImage,
        images: cleanImages,
        youtubeLinks: cleanYoutubeLinks.map(url => sanitizeInput(url)),
        resourceLinks: sanitizedResourceLinks,
        status: 'pending',
        author: currentUser?.uid || '',
        // Assign a temporary unique slug to avoid duplicate key errors
        slug: `temp-${Date.now()}-${Math.floor(Math.random() * 100000)}`
      };
      
      // Start loading state
      setIsUploading(true);
      
      // Use the API utility
      const data = await api.post('/api/articles', articleData);
      
      // Show the success modal
      setShowSuccessModal(true);
      
      // Scroll to top to make sure modal is visible
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
    } catch (error) {
      console.error('Error submitting article:', error);
      setSubmissionError('خەتایەک ڕوویدا لە کاتی ناردنی وتارەکە. تکایە دووبارە هەوڵبدەوە');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Toggle fullscreen mode for the editor
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Focus the editor after toggling fullscreen
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 100);
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    // Lock body scroll when in fullscreen mode
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);
  
  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && content && activeTab === 'edit') {
      // Only set inner HTML if the editor is empty
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML === '<br>') {
        editorRef.current.innerHTML = content;
      }
    }
  }, [activeTab]);
  
  // Focus the editor on page load
  useEffect(() => {
    if (editorRef.current && activeTab === 'edit') {
      // Allow time for the component to be fully rendered
      setTimeout(() => {
        if (editorRef.current) {
          // Place cursor at the end of content
          const range = document.createRange();
          const selection = window.getSelection();
          
          if (editorRef.current.childNodes.length > 0) {
            const lastChild = editorRef.current.lastChild;
            if (lastChild) {
              range.setStartAfter(lastChild);
            } else {
              range.setStart(editorRef.current, 0);
            }
          } else {
            range.setStart(editorRef.current, 0);
          }
          
          range.collapse(true);
          
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          
          editorRef.current.focus();
        }
      }, 500);
    }
  }, [activeTab]);
  
  // Authentication check
  if (!currentUser) {
    return (
      <div className="container mx-auto py-16 relative overflow-hidden">
        {/* Subtle background elements - blue only */}
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <span className="inline-block text-sm font-semibold py-1 px-3 rounded-full bg-blue-50 text-blue-600 mb-3">چوونە ژوورەوە</span>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-blue-600">
              بەشداری لە بنووسە بکە
          </h1>
            <p className="text-lg mb-8 text-gray-600 max-w-xl mx-auto">
              بۆ نووسین و ناردنی وتار، پێویستە سەرەتا چوونە ژوورەوە بکەیت یان هەژمارێک درووست بکەیت. بنووسە پلاتفۆرمی نووسەرانی کوردە.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <Link href="/signin" className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200 w-auto min-w-[120px] justify-center">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  چوونە ژوورەوە
              </Link>
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors duration-200 w-auto min-w-[120px] justify-center">
              <UserPlusIcon className="h-5 w-5" />
              خۆت تۆمار بکە
                </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // If logged in, show the article editor
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Include EditorStyles at the top level */}
      <EditorStyles />
      
      {/* Success modal */}
      {showSuccessModal && <SuccessModal />}
      
      {/* Main content */}
      <div className="container mx-auto py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            <span className="text-[var(--primary)]">وتارێک</span> بنووسە
          </h1>
          <p className="text-[var(--grey-dark)] text-center max-w-2xl mx-auto mb-6">
            زانیاری و شارەزاییەکانت بەشداری پێ بکە لەگەڵ کۆمەڵگای گەشەسەندوومان. فۆرمەکەی خوارەوە پڕ بکەوە بۆ ناردنی وتارەکەت بۆ بنووسە.
          </p>
          
          {/* Article Submission Rules */}
          <div className="bg-gradient-to-r from-[var(--primary-light)]/10 to-[var(--secondary-light)]/5 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-3 text-[var(--primary)]">ڕێساکانی ناردنی وتار</h2>
            <ul className="space-y-2 text-[var(--grey-dark)]">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>بەدواداچوونی دۆخی وتار:</strong> دەتوانیت دۆخی وتارەکانت (چاوەڕوانی پێداچوونەوە، بڵاوکراوە، یان ڕەتکراوە) لە پرۆفایلەکەتدا ببینیت. ئێمە هەوڵ دەدەین وتارەکەت زوو بە زوو پێداچوونەوەی بۆ بکەین.</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>ناوەڕۆکی مرۆیی:</strong> وتاری بەرهەمهێنراو لەلایەن کەرەستەکانی دەستکردەوە (AI) وەرناگیرێت. هەموو ناوەڕۆکەکان دەبێت بە تەواوی لەلایەن مرۆڤەوە نووسرابن. وتارەکان لەلایەن پسپۆڕانەوە پێداچوونەوەیان بۆ دەکرێت.</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>مافی لەبەرگرتنەوە:</strong> نابێت ناوەڕۆکی کەسانی تر بدزیت. هەر وتارێک دەبێت کاری ڕەسەنی خۆت بێت، یان بە ڕێگەی یاسایی مۆڵەتی لێوەرگیرابێت و بە دروستی سەرچاوەکانی ئاماژە پێکرابێت.</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>پاراستنی ژینگەی سەلامەت:</strong> هەموو دەستکارییەکان و گۆڕانکارییەکانیش پێویستیان بە پێداچوونەوە هەیە بۆ دڵنیابوون لە پاراستنی ژینگەیەکی سەلامەت دژی خراپ بەکارهێنان.</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>پێداویستییەکانی ناردنی وتار:</strong> ئەو بەشانەی کە بە ئەستێرە (*) نیشانە کراون پێویستە بۆ ناردنی وتارەکەت پڕیان بکەیتەوە. بەشەکانی تر ئارەزوومەندانەن و دەتوانیت بەپێی ویستی خۆت زیادیان بکەیت.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[var(--grey-light)] p-8">
            {/* Error message with improved styling */}
            {submissionError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 animate-pulse">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500 ml-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">{submissionError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Cover Image Upload */}
              <div>
                <label className="block text-[var(--grey-dark)] mb-2 font-semibold">
                  وێنەی سەرەکی وتار <span className="text-red-500">*</span> <span className="text-xs text-red-500 mr-1">(پێویستە بۆ ناردنی وتارەکەت)</span>
                </label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition ${coverImage ? 'border-[var(--primary)]' : 'border-gray-300'}`}
                  onClick={() => !isUploading && coverImageRef.current?.click()}
                >
                  {coverImage ? (
                    <div className="relative">
                      <img 
                        src={coverImage} 
                        alt="Cover preview" 
                        className="max-h-[200px] mx-auto rounded" 
                      />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverImage('');
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : isUploading ? (
                    <div className="py-8">
                      <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
                      <p className="text-[var(--grey-dark)] mt-2">وێنە باردەکرێت...</p>
                    </div>
                  ) : (
                    <div className="py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[var(--grey-dark)]">داگرتنی وێنەی سەرەکی وتار</p>
                      <p className="text-sm text-gray-400">وێنەیەکی جوان هەڵبژێرە (پێشنیار: نیسبەتی 16:9)</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={coverImageRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleCoverImageUpload} 
                    disabled={isUploading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">وێنەی سەرەکی وتار پێویستە بۆ ناردنی وتارەکەت</p>
              </div>
              
              {/* Article Title */}
              <div>
                <label htmlFor="title" className="block text-[var(--grey-dark)] mb-2 font-semibold">
                  سەردێڕی وتار <span className="text-red-500">*</span> <span className="text-xs text-red-500 mr-1">(پێویستە بۆ ناردنی وتارەکەت)</span>
                </label>
                <input 
                  type="text" 
                  id="title" 
                  value={title}
                  onChange={(e) => {
                    // Sanitize title input on the fly
                    const inputValue = e.target.value;
                    // Allow only safe characters for title
                    if (validateInput(inputValue)) {
                      setTitle(inputValue);
                    }
                  }}
                  className="w-full px-4 py-3 border rounded-md focus:border-[var(--primary)] focus:outline-none font-rabar" 
                  placeholder="سەردێڕێکی ڕاکێشەر بنووسە..."
                  required
                />
              </div>
              
              {/* Article Description */}
              <div>
                <label htmlFor="description" className="block text-[var(--grey-dark)] mb-2 font-semibold">
                  کورتەی وتار <span className="text-red-500">*</span> <span className="text-xs text-red-500 mr-1">(پێویستە بۆ ناردنی وتارەکەت)</span>
                </label>
                <textarea 
                  id="description" 
                  value={description}
                  onChange={(e) => {
                    // Sanitize description input on the fly
                    const inputValue = e.target.value;
                    // Allow only safe characters for description
                    if (validateInput(inputValue)) {
                      setDescription(inputValue);
                    }
                  }}
                  className="w-full px-4 py-3 border rounded-md focus:border-[var(--primary)] focus:outline-none font-rabar" 
                  placeholder="کورتەیەک دەربارەی وتارەکەت بنووسە..."
                  rows={3}
                  required
                ></textarea>
              </div>
              
              {/* Content editor with tabs */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[var(--grey-dark)] font-semibold">
                    ناوەڕۆکی وتار <span className="text-red-500">*</span> <span className="text-xs text-red-500 mr-1">(پێویستە بۆ ناردنی وتارەکەت)</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        activeTab === 'edit' 
                          ? 'bg-[var(--primary)] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="hidden sm:inline">نووسین</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        activeTab === 'preview' 
                          ? 'bg-[var(--primary)] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="hidden sm:inline">پێشبینین</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className={`editor-container relative ${isFullscreen ? 'fullscreen' : 'border rounded-md'}`}>
                  {activeTab === 'edit' ? (
                    <button 
                      type="button"
                      className="fullscreen-toggle"
                      onClick={toggleFullscreen}
                      title={isFullscreen ? "گەڕانەوە بۆ دۆخی ئاسایی" : "فراوانبوونی پڕ شاشە"}
                    >
                      {isFullscreen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                      )}
                    </button>
                  ) : (
                    <button 
                      type="button"
                      className="fullscreen-toggle"
                      onClick={toggleFullscreen}
                      title={isFullscreen ? "گەڕانەوە بۆ دۆخی ئاسایی" : "فراوانبوونی پڕ شاشە"}
                    >
                      {isFullscreen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                      )}
                    </button>
                  )}
                  
                  {/* Editor styles are now imported as a component */}
                  
                  {activeTab === 'edit' && (
                    <div className="editor-toolbar">
                      {/* Heading dropdown */}
                      <select 
                        className="px-2 py-1 border rounded text-sm bg-white"
                        onChange={(e) => executeCommand('formatBlock', e.target.value)}
                      >
                        <option value="">سەردێڕ...</option>
                        <option value="h1">سەردێڕی 1</option>
                        <option value="h2">سەردێڕی 2</option>
                        <option value="h3">سەردێڕی 3</option>
                        <option value="p">پەرەگراف</option>
                      </select>
                      
                      {/* Bold */}
                      <button 
                        type="button"
                        onClick={() => {
                          // Save current selection
                          const selection = window.getSelection();
                          if (selection && selection.rangeCount > 0 && 
                              editorRef.current?.contains(selection.anchorNode)) {
                            savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
                          }
                          executeCommand('bold');
                        }}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="تۆخ"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M8 11h4.5a2.5 2.5 0 0 0 0-5H8v5Zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5ZM8 13v5h5.5a2.5 2.5 0 0 0 0-5H8Z"/>
                        </svg>
                      </button>
                      
                      {/* Italic */}
                      <button 
                        type="button"
                        onClick={() => {
                          // Save current selection
                          const selection = window.getSelection();
                          if (selection && selection.rangeCount > 0 && 
                              editorRef.current?.contains(selection.anchorNode)) {
                            savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
                          }
                          executeCommand('italic');
                        }}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="لار"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15v2Z"/>
                        </svg>
                      </button>
                      
                      {/* Underline */}
                      <button 
                        type="button"
                        onClick={() => {
                          // Save current selection
                          const selection = window.getSelection();
                          if (selection && selection.rangeCount > 0 && 
                              editorRef.current?.contains(selection.anchorNode)) {
                            savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
                          }
                          executeCommand('underline');
                        }}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="ژێرهێڵ"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M8 3v9a4 4 0 1 0 8 0V3h2v9a6 6 0 1 1-12 0V3h2ZM4 20h16v2H4v-2Z"/>
                        </svg>
                      </button>
                      
                      <div className="w-px h-8 bg-gray-300 mx-1"></div>
                      
                      {/* Text align */}
                      <button 
                        type="button"
                        onClick={() => executeCommand('justifyRight')}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="ڕاستەوە"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M3 4h18v2H3V4Zm4 4h14v2H7V8Zm-4 4h18v2H3v-2Zm4 4h14v2H7v-2Z"/>
                        </svg>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => executeCommand('justifyCenter')}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="ناوەڕاست"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M3 4h18v2H3V4Zm4 4h10v2H7V8Zm-4 4h18v2H3v-2Zm4 4h10v2H7v-2Z"/>
                        </svg>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => executeCommand('justifyLeft')}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="چەپەوە"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M3 4h18v2H3V4Zm0 4h14v2H3V8Zm0 4h18v2H3v-2Zm0 4h14v2H3v-2Z"/>
                        </svg>
                      </button>
                      
                      <div className="w-px h-8 bg-gray-300 mx-1"></div>
                      
                      {/* Lists */}
                      <button 
                        type="button"
                        onClick={() => executeCommand('insertUnorderedList')}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="لیستەی خاڵدار"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M8 4h13v2H8V4ZM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM4.5 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM4.5 20.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z"/>
                        </svg>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => executeCommand('insertOrderedList')}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="لیستەی ژمارەدار"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M3 4h2v2H4v1h1v1H3V7zm18 4H8V6h13v2zm-18 3h1.5v1H3v1h2v1H3v2h3v-5H3v-1zm18 4H8v-2h13v2zm-18 3h1v1H3v1h2v-3H3v-1zm18 4H8v-2h13v2z"/>
                        </svg>
                      </button>
                      
                      <div className="w-px h-8 bg-gray-300 mx-1"></div>
                      
                      {/* Additional styling buttons */}
                      <button 
                        type="button"
                        onClick={() => executeCommand('outdent')}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="کەمکردنەوەی بۆشایی"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M3 4h18v2H3V4zm0 15h18v2H3v-2zm8-5h10v2H11v-2zm0-5h10v2H11V9zm-8 3.5L7 9v7l-4-3.5z"/>
                        </svg>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => executeCommand('indent')}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="زیادکردنی بۆشایی"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M3 4h18v2H3V4zm0 15h18v2H3v-2zm8-5h10v2H11v-2zm0-5h10v2H11V9zm-4 3.5L3 9v7l4-3.5z"/>
                        </svg>
                      </button>
                      
                      <div className="w-px h-8 bg-gray-300 mx-1"></div>
                      
                      {/* Text Color */}
                      <div className="relative">
                        <button 
                          type="button"
                          className={`w-8 h-8 flex items-center justify-center border rounded ${showTextColorPicker ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
                          onClick={() => {
                            // Save the current selection before showing color picker
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
                              savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
                            }
                            setShowTextColorPicker(!showTextColorPicker);
                          }}
                          title="ڕەنگی تێکست"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 7h6l-3 10-3-10z" />
                            <path d="M5 21h14" />
                          </svg>
                        </button>
                        
                        {showTextColorPicker && (
                          <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md p-2 z-10 min-w-[180px]">
                            <div className="mb-2 text-sm font-medium text-gray-700">هەڵبژاردنی ڕەنگی تێکست</div>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                {color: '#000000', name: 'ڕەش'},
                                {color: '#0000FF', name: 'شین'},
                                {color: '#FF0000', name: 'سور'},
                                {color: '#008000', name: 'سەوز'},
                                {color: '#800080', name: 'مۆر'},
                                {color: '#FFA500', name: 'پرتەقاڵی'},
                                {color: '#A52A2A', name: 'قاوەیی'},
                                {color: '#808080', name: 'خۆڵەمێشی'},
                                {color: '#4B0082', name: 'شینی تۆخ'},
                                {color: '#006400', name: 'سەوزی تۆخ'},
                                {color: '#8B0000', name: 'سوری تۆخ'},
                                {color: '#2F4F4F', name: 'ڕەشی کاڵ'},
                                {color: '#FF1493', name: 'پەمەیی'},
                                {color: '#FFD700', name: 'زەرد'},
                                {color: '#00FFFF', name: 'فیروزەیی'},
                                {color: '#FFFFFF', name: 'سپی'}
                              ].map(item => (
                                <button
                                  key={item.color}
                                  type="button"
                                  className="flex flex-col items-center p-1 rounded hover:bg-gray-100"
                                  onClick={() => {
                                    // First restore the saved selection
                                    if (savedSelectionRef.current) {
                                      const selection = window.getSelection();
                                      if (selection) {
                                        selection.removeAllRanges();
                                        selection.addRange(savedSelectionRef.current);
                                        
                                        // Focus editor and apply the text color
                                        if (editorRef.current) {
                                          editorRef.current.focus();
                                        }
                                        
                                        // Apply the text color
                                        executeCommand('foreColor', item.color);
                                        
                                        // Keep focus in editor
                                        setTimeout(() => {
                                          if (editorRef.current) {
                                            editorRef.current.focus();
                                          }
                                        }, 10);
                                        
                                        // Hide the color picker
                                        setShowTextColorPicker(false);
                                      }
                                    } else {
                                      // If no selection, inform user they need to select text
                                      alert('تکایە دەقێک دیاری بکە بۆ گۆڕینی ڕەنگ');
                                      setShowTextColorPicker(false);
                                    }
                                  }}
                                  title={`گۆڕینی ڕەنگ بۆ ${item.name}`}
                                >
                                  <div 
                                    className={`w-6 h-6 rounded-sm border ${item.color === '#FFFFFF' ? 'border-gray-300' : 'border-gray-200'} mb-1`}
                                    style={{ backgroundColor: item.color }}
                                  ></div>
                                  <span className="text-xs">{item.name}</span>
                                </button>
                              ))}
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between">
                              <button
                                type="button"
                                className="px-2 py-1 text-xs text-white bg-[var(--primary)] rounded hover:bg-[var(--primary-dark)]"
                                onClick={() => {
                                  // First, restore the saved selection
                                  if (savedSelectionRef.current) {
                                    const selection = window.getSelection();
                                    if (selection) {
                                      selection.removeAllRanges();
                                      selection.addRange(savedSelectionRef.current);
                                      
                                      // Focus the editor
                                      if (editorRef.current) {
                                        editorRef.current.focus();
                                      }
                                      
                                      // Reset the text color to default
                                      document.execCommand('foreColor', false, '#000000');
                                      
                                      // Hide the color picker
                                      setShowTextColorPicker(false);
                                    }
                                  } else {
                                    // If no selection, inform user
                                    alert('تکایە دەقێک دیاری بکە بۆ گەڕاندنەوەی ڕەنگ');
                                    setShowTextColorPicker(false);
                                  }
                                }}
                              >
                                گەڕاندنەوەی ڕەنگی ئاسایی
                              </button>
                              <button
                                type="button"
                                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                onClick={() => setShowTextColorPicker(false)}
                              >
                                داخستن
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Highlight Color - Improved implementation */}
                      <div className="relative">
                        <button 
                          type="button"
                          className={`w-8 h-8 flex items-center justify-center border rounded ${showHighlightPicker ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
                          onClick={() => {
                            // Save the current selection before showing color picker
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
                              savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
                            }
                            setShowHighlightPicker(!showHighlightPicker);
                          }}
                          title="نیشانکردنی تێکست"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13l-5 5v-3.5l5-5" />
                            <path d="M14 13l5 5v-3.5l-5-5" />
                            <rect x="7" y="6" width="10" height="4" fill="yellow" stroke="currentColor" />
                          </svg>
                        </button>
                        
                        {showHighlightPicker && (
                          <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md p-2 z-10 min-w-[180px]">
                            <div className="mb-2 text-sm font-medium text-gray-700">هەڵبژاردنی ڕەنگی نیشانکردن</div>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                {color: '#FFFF00', name: 'زەرد'},
                                {color: '#00FFFF', name: 'شین'},
                                {color: '#FF00FF', name: 'پەمەیی'},
                                {color: '#FF9966', name: 'پرتەقاڵی'},
                                {color: '#99FF99', name: 'سەوز'},
                                {color: '#FFCC99', name: 'خۆڵەمێشی'},
                                {color: '#CCCCFF', name: 'مۆر'},
                                {color: '#FF9999', name: 'سور'}
                              ].map(item => (
                                <button
                                  key={item.color}
                                  type="button"
                                  className="flex flex-col items-center p-1 rounded hover:bg-gray-100"
                                  onClick={() => {
                                    // First restore the saved selection
                                    if (savedSelectionRef.current) {
                                      const selection = window.getSelection();
                                      if (selection) {
                                        selection.removeAllRanges();
                                        selection.addRange(savedSelectionRef.current);
                                        
                                        // Focus editor and apply the highlight
                                        if (editorRef.current) {
                                          editorRef.current.focus();
                                        }
                                        
                                        // Apply the highlight color
                                        executeCommand('hiliteColor', item.color);
                                        
                                        // Keep focus in editor
                                        setTimeout(() => {
                                          if (editorRef.current) {
                                            editorRef.current.focus();
                                          }
                                        }, 10);
                                        
                                        // Hide the color picker
                                        setShowHighlightPicker(false);
                                      }
                                    } else {
                                      // If no selection, inform user they need to select text
                                      alert('تکایە دەقێک دیاری بکە بۆ جەختکردنەوە');
                                      setShowHighlightPicker(false);
                                    }
                                  }}
                                  title={`نیشانکردن بە ڕەنگی ${item.name}`}
                                >
                                  <div 
                                    className="w-6 h-6 rounded-sm border border-gray-300 mb-1" 
                                    style={{ backgroundColor: item.color }}
                                  ></div>
                                  <span className="text-xs">{item.name}</span>
                                </button>
                              ))}
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between">
                              <button
                                type="button"
                                className="px-2 py-1 text-xs text-white bg-[var(--primary)] rounded hover:bg-[var(--primary-dark)]"
                                onClick={() => {
                                  // First, restore the saved selection
                                  if (savedSelectionRef.current) {
                                    const selection = window.getSelection();
                                    if (selection) {
                                      selection.removeAllRanges();
                                      selection.addRange(savedSelectionRef.current);
                                      
                                      // Focus the editor
                                      if (editorRef.current) {
                                        editorRef.current.focus();
                                      }
                                      
                                      // Remove the highlight
                                      document.execCommand('hiliteColor', false, 'transparent');
                                      
                                      // Hide the color picker
                                      setShowHighlightPicker(false);
                                    }
                                  } else {
                                    // If no selection, inform user
                                    alert('تکایە دەقێک دیاری بکە بۆ لابردنی نیشانکردن');
                                    setShowHighlightPicker(false);
                                  }
                                }}
                              >
                                لابردنی نیشانکردن
                              </button>
                              <button
                                type="button"
                                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                onClick={() => setShowHighlightPicker(false)}
                              >
                                داخستن
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Clear formatting */}
                      <button 
                        type="button"
                        onClick={() => executeCommand('removeFormat')}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
                        title="سڕینەوەی فۆرماتەکان"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="m12.651 14.065-2.256-2.66 1.37-4.642a9.27 9.27 0 0 0-2.47-.67l-1.362 4.62-2.452-2.89a9.271 9.271 0 0 0-1.708 1.9l3.456 4.066-4.569 3.437a7.5 7.5 0 0 0 13.52 4.468 9.273 9.273 0 0 0 2.39-2.018l-5.919-5.61ZM2.5 12a9.51 9.51 0 0 1 .113-1.454l2.727 3.21-2.408 1.811a7.48 7.48 0 0 0-.432-3.567ZM12 2.5a9.51 9.51 0 0 1 5.139 1.5 9.478 9.478 0 0 1 3.515 4.206l-3.391 1.186a7.5 7.5 0 0 0-10.86-3.519l.33 1.121a9.275 9.275 0 0 0-1.854 1.11l-1.046-1.23a9.478 9.478 0 0 1 8.167-4.374Z"/>
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {activeTab === 'edit' && (
                    <div
                      ref={editorRef}
                      className="editor-content"
                      contentEditable
                      onInput={handleContentChange}
                      onBlur={handleEditorBlur}
                      onClick={handleEditorClick}
                      onFocus={() => {
                        // Reset selection on focus if needed
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                          savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
                        }
                      }}
                    ></div>
                  )}
                  
                  {activeTab === 'preview' && (
                    <div 
                      className="editor-content article-preview"
                      dangerouslySetInnerHTML={{ 
                        __html: typeof window !== 'undefined' && DOMPurify 
                          ? DOMPurify.sanitize(content, {
                              ALLOWED_TAGS: [
                                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'br', 'a', 
                                'strong', 'em', 'u', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 
                                'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'font', 'b', 'i'
                              ],
                              ALLOWED_ATTR: [
                                'href', 'src', 'alt', 'title', 'style', 'target', 'rel', 'class',
                                'width', 'height', 'color', 'bgcolor', 'background-color', 'align', 'face'
                              ],
                              ADD_ATTR: ['target'],
                              // Allow all styles including colors
                              ADD_TAGS: ['font'], 
                              USE_PROFILES: {
                                html: true,
                                svg: false,
                                svgFilters: false,
                                mathMl: false
                              },
                              // Keep all formatting styles
                              KEEP_CONTENT: true,
                              WHOLE_DOCUMENT: false,
                              SANITIZE_DOM: true,
                              // Forbid dangerous event handlers
                              FORBID_ATTR: [
                                'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown',
                                'onkeydown', 'onkeypress', 'onkeyup', 'onchange', 'onfocus', 'onblur'
                              ]
                            })
                          : content // Fallback to unsanitized content if DOMPurify is not available
                      }}
                    />
                  )}
                  
                  <p className="text-xs text-[var(--grey-dark)] mt-2">
                    تێبینی: دەتوانیت ئامرازەکانی سەرەوە بەکاربهێنیت بۆ داڕشتنی وتارەکەت، دەقی تۆخ، لار، سەردێڕ و لیستەکان زیاد بکەیت.
                  </p>
                </div>
              </div>
              
              {/* YouTube Videos Section */}
              <div className="mt-8">
                <label className="block text-[var(--grey-dark)] mb-2 font-semibold">ڤیدیۆکانی یوتیوب ({youtubeLinks.length}/3)</label>
                <p className="text-sm text-[var(--grey-dark)] mb-3">دەتوانیت هەتا ٣ ڤیدیۆی یوتیوب زیاد بکەیت کە پەیوەندیدارن بە وتارەکەت.</p>
                
                {/* Enhanced YouTube URL input section */}
                <div className="bg-gray-50 border rounded-md p-4 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-[var(--grey-dark)] mb-1">بەستەری ڤیدیۆ</label>
                      <input 
                        type="text" 
                        value={youtubeUrl}
                        onChange={(e) => {
                          // Sanitize URL input and only allow valid characters
                          const inputValue = e.target.value;
                          // Use a regex to ensure only valid URL characters are allowed
                          if (/^[a-zA-Z0-9\-_./:?&=@%+]*$/.test(inputValue)) {
                            setYoutubeUrl(inputValue);
                          }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddYoutubeLink()}
                        className="w-full px-3 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none font-rabar"
                        placeholder="https://www.youtube.com/watch?v=..."
                        disabled={youtubeLinks.length >= 3 || isUploading}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button 
                        type="button" 
                        onClick={handleAddYoutubeLink}
                        disabled={!youtubeUrl || isUploading || youtubeLinks.length >= 3}
                        className="btn bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        زیادکردنی ڤیدیۆ
                      </button>
                    </div>
                  </div>
                  
                  {/* Error message */}
                  {youtubeError && (
                    <p className="text-red-500 text-sm mb-2">{youtubeError}</p>
                  )}
                </div>
                
                {/* List of added YouTube videos with preview */}
                <div className="space-y-4 mt-4">
                  {youtubeLinks.map((link, index) => {
                    const videoId = extractYoutubeId(link);
                    return (
                      <div key={index} className="relative bg-gray-50 border rounded-md p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-[var(--grey-dark)] truncate pr-8">{link}</h4>
                          <button 
                            type="button"
                            onClick={() => handleRemoveYoutubeLink(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            title="سڕینەوە"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Video preview */}
                        {videoId && (
                          <div className="rounded-md overflow-hidden border border-gray-200 bg-black shadow-sm">
                            <div className="aspect-w-16 aspect-h-9">
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title="YouTube video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                                loading="lazy"
                              ></iframe>
                            </div>
                            <div className="p-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs">
                              <div className="flex items-center">
                                <svg className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                </svg>
                                <span>YouTube</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {youtubeLinks.length === 0 && (
                    <div className="py-8 text-center border border-dashed rounded-md bg-gray-50">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-[var(--grey-dark)] mb-1">هیچ ڤیدیۆیەک زیاد نەکراوە</h4>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">ڤیدیۆی یوتیوب زیاد بکە بۆ پشتگیریکردنی ناوەڕۆکی وتارەکەت و دەوڵەمەندکردنی وتارەکەت</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Resource Links Section */}
              <div className="mt-8">
                <label className="block text-[var(--grey-dark)] mb-2 font-semibold">سەرچاوەکان و بەڵگەنامەکان ({resourceLinks.length}/5)</label>
                <p className="text-sm text-[var(--grey-dark)] mb-3">دەتوانیت بەستەری PDF، بەڵگەنامە یان سەرچاوەی دیکە زیاد بکەیت بۆ پشتیوانی زیاتری وتارەکەت.</p>
                
                {/* Form for adding resource links */}
                <div className="bg-gray-50 border rounded-md p-4 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm text-[var(--grey-dark)] mb-1">بەستەری سەرچاوە</label>
                      <input 
                        type="text" 
                        value={resourceUrl}
                        onChange={(e) => {
                          // Sanitize URL input and only allow valid characters
                          const inputValue = e.target.value;
                          // Use a regex to ensure only valid URL characters are allowed
                          if (/^[a-zA-Z0-9\-_./:?&=@%+]*$/.test(inputValue)) {
                            setResourceUrl(inputValue);
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none font-rabar"
                        placeholder="https://example.com/document.pdf"
                        disabled={resourceLinks.length >= 5 || isUploading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--grey-dark)] mb-1">ناونیشان</label>
                      <input 
                        type="text" 
                        value={resourceTitle}
                        onChange={(e) => {
                          // Sanitize title input 
                          const inputValue = e.target.value;
                          if (validateInput(inputValue)) {
                            setResourceTitle(inputValue);
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none font-rabar"
                        placeholder="پوختەی توێژینەوە"
                        disabled={resourceLinks.length >= 5 || isUploading}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between md:items-end gap-3">
                    <div className="md:w-1/3">
                      <label className="block text-sm text-[var(--grey-dark)] mb-1">جۆری سەرچاوە</label>
                      <select
                        value={resourceType}
                        onChange={(e) => setResourceType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none font-rabar"
                        disabled={resourceLinks.length >= 5 || isUploading}
                      >
                        <option value="auto">دۆزینەوەی خۆکار</option>
                        <option value="pdf">PDF</option>
                        <option value="doc">بەڵگەنامە</option>
                        <option value="presentation">پێشکەشکردن</option>
                        <option value="spreadsheet">خشتەی داتا</option>
                        <option value="googledoc">گووگڵ دۆکیومێنت</option>
                        <option value="web">ماڵپەڕ</option>
                      </select>
                    </div>
                    
                    <div className="flex">
                      <button
                        type="button"
                        onClick={handleAddResourceLink}
                        disabled={resourceLinks.length >= 5 || isUploading}
                        className={`px-4 py-2 rounded-md font-rabar ${
                          resourceLinks.length >= 5 || isUploading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                        }`}
                      >
                        زیادکردنی سەرچاوە
                      </button>
                    </div>
                  </div>
                  
                  {/* Error message */}
                  {resourceError && (
                    <div className="text-red-500 text-sm mt-2">{resourceError}</div>
                  )}
                </div>
                
                {/* List of added resource links */}
                <div className="space-y-2">
                  {resourceLinks.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between bg-white border rounded-md p-3 hover:bg-gray-50 transition">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-[var(--grey-dark)]">{resource.title}</h4>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate block max-w-md">
                            {resource.url}
                          </a>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveResourceLink(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="سڕینەوە"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {resourceLinks.length === 0 && (
                    <div className="text-center border border-dashed rounded-md p-6 bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-[var(--grey-dark)]">هیچ سەرچاوەیەک زیاد نەکراوە</p>
                      <p className="text-sm text-gray-400">بەستەری PDF و سەرچاوەکانی دیکە زیاد بکە بۆ پشتگیریکردنی وتارەکەت</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="block text-[var(--grey-dark)] mb-2 font-semibold">وێنەکانی ناو وتار ({images.length}/5)</label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                  {/* Display uploaded images */}
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Uploaded ${index}`} 
                        className="w-full h-24 object-cover rounded border" 
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* Upload button */}
                  {images.length < 5 && (
                    <div 
                      className={`border-2 border-dashed border-gray-300 rounded flex items-center justify-center h-24 ${isUploading ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50'} transition`}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
                      ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                      </svg>
                      )}
                      <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                        disabled={isUploading}
                      />
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-[var(--grey-dark)]">دەتوانیت هەتا ٥ وێنە زیاد بکەیت. بۆ زیادکردنی وێنە لە ناوەڕۆکی وتارەکەت، ئاماژە بە ژمارەی وێنەکە بکە.</p>
              </div>
              
              {/* Categories - Using toggles instead of checkboxes */}
              <div>
                <label className="block text-[var(--grey-dark)] mb-2 font-semibold">
                  پۆلەکان <span className="text-red-500">*</span> <span className="text-xs text-red-500 mr-1">(پێویستە بۆ ناردنی وتارەکەت)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    {name: 'زانست', icon: 'beaker', color: 'bg-blue-500'},
                    {name: 'مێژوو', icon: 'clock', color: 'bg-amber-600'},
                    {name: 'هونەر', icon: 'paint-brush', color: 'bg-pink-500'},
                    {name: 'فەلسەفە', icon: 'lightbulb', color: 'bg-violet-600'},
                    {name: 'تەکنەلۆژیا', icon: 'device-mobile', color: 'bg-teal-500'},
                    {name: 'ئەدەب', icon: 'book', color: 'bg-emerald-500'},
                    {name: 'سیاسەت', icon: 'scale', color: 'bg-red-500'},
                    {name: 'ئابووری', icon: 'chart-line', color: 'bg-green-600'},
                    {name: 'تەندروستی', icon: 'heart', color: 'bg-rose-500'},
                    {name: 'وەرزش', icon: 'flame', color: 'bg-orange-500'},
                    {name: 'ژینگە', icon: 'globe', color: 'bg-cyan-600'},
                    {name: 'گەشتیاری', icon: 'map', color: 'bg-fuchsia-500'},
                  ].map((category) => {
                    const isSelected = selectedCategories.includes(category.name);
                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => toggleCategory(category.name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all font-rabar ${
                          isSelected 
                            ? `${category.color} text-white shadow-md` 
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {/* Category icon */}
                        <span className={`w-5 h-5 flex items-center justify-center ${isSelected ? 'text-white' : ''}`}>
                          {/* Insert the right icon based on category.icon */}
                        {category.icon === 'beaker' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7 2a1 1 0 0 0-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
                          </svg>
                        )}
                        {category.icon === 'clock' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 002 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                          </svg>
                        )}
                          {/* Add the rest of the icons */}
                          {category.icon === 'paint-brush' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M4 1h6a1 1 0 0 1 1 1v4h6a1 1 0 0 1 1 1v6a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V2a1 1 0 0 1 1-1zm1 3a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2H5z" />
                              <path d="M13 8V5h3v3h-3z" />
                            </svg>
                          )}
                          {category.icon === 'lightbulb' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                            </svg>
                          )}
                          {category.icon === 'device-mobile' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          )}
                          {category.icon === 'book' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                          )}
                          {category.icon === 'scale' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                            </svg>
                          )}
                          {category.icon === 'chart-line' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {category.icon === 'heart' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                          )}
                          {category.icon === 'flame' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        {category.name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">پێویستە لانیکەم یەک جۆری بابەت هەڵبژێریت</p>
              </div>
              
              {/* Submit button */}
              <div className="text-center pt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary px-12 py-3 text-lg"
                  disabled={isUploading}
                >
                  {isUploading ? 'لە پرۆسەی ناردندایە...' : 'ناردنی وتار'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-[var(--grey-dark)]">
            <p>
              ئەگەر هەر پرسیارێکت هەیە، تکایە پەیوەندیمان پێوە بکە لە{' '}
              <a href="contact@bunsa.net" className="text-[var(--primary)] hover:underline">
                contact@bunsa.net
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 