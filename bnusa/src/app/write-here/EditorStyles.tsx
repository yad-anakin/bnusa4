'use client';

import React from 'react';

export default function EditorStyles() {
  return (
    <style jsx global>{`
      /* Editor container */
      .editor-container {
        position: relative !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 0.375rem !important;
        overflow: hidden !important;
      }
      
      /* Fullscreen mode */
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

      /* Editor toolbar */
      .editor-toolbar {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 0.25rem !important;
        padding: 0.75rem !important;
        background-color: #f9fafb !important;
        border-bottom: 1px solid #e5e7eb !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 10 !important;
      }

      /* Editor content area */
      .editor-content {
        min-height: 300px !important;
        padding: 1rem !important;
        outline: none !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
        font-size: 1rem !important;
        line-height: 1.5 !important;
        color: #333 !important;
        direction: rtl !important;
        caret-color: var(--primary) !important; /* Make cursor more visible */
      }

      /* Better selection styling */
      .editor-content ::selection {
        background-color: rgba(79, 70, 229, 0.2) !important; /* Primary color with opacity */
        color: inherit !important;
      }
      
      /* Improve selection visibility when color pickers are open */
      .editor-content:focus-within ::selection {
        background-color: rgba(79, 70, 229, 0.3) !important; /* Slightly more visible */
      }
      
      /* Even more visible selection when actively changing text color */
      body:has(.editor-content:focus-within + div [class*="color-picker"]) .editor-content ::selection {
        background-color: rgba(79, 70, 229, 0.4) !important;
        outline: 1px solid rgba(79, 70, 229, 0.5) !important;
      }
      
      /* Color picker styling */
      .absolute.min-w-\[180px\] {
        max-height: 80vh !important;
        overflow-y: auto !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Responsive handling for color pickers on mobile */
      @media (max-width: 640px) {
        .absolute.min-w-\[180px\] {
          position: fixed !important;
          top: auto !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          transform: none !important;
          width: 100% !important;
          max-width: 100% !important;
          border-radius: 0.5rem 0.5rem 0 0 !important;
          max-height: 70vh !important;
        }
      }

      /* Toggle button */
      .fullscreen-toggle {
        position: absolute !important;
        top: 0.75rem !important;
        left: 0.75rem !important;
        z-index: 20 !important;
        background-color: rgba(255, 255, 255, 0.8) !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 0.25rem !important;
        padding: 0.25rem !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }

      /* Headings */
      .editor-content h1,
      [contenteditable="true"] h1 {
        font-size: 2rem !important;
        font-weight: 700 !important;
        margin-top: 1.5rem !important;
        margin-bottom: 1rem !important;
        line-height: 1.2 !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
      }
      
      .editor-content h2,
      [contenteditable="true"] h2 {
        font-size: 1.75rem !important;
        font-weight: 600 !important;
        margin-top: 1.25rem !important;
        margin-bottom: 0.75rem !important;
        line-height: 1.3 !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
      }
      
      .editor-content h3,
      [contenteditable="true"] h3 {
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        margin-top: 1rem !important;
        margin-bottom: 0.5rem !important;
        line-height: 1.4 !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
      }
      
      /* Paragraphs */
      .editor-content p,
      [contenteditable="true"] p {
        font-family: var(--font-rabar), system-ui, sans-serif !important;
        line-height: 1.6 !important;
        margin-bottom: 1rem !important;
      }
      
      /* Lists */
      .editor-content ul,
      [contenteditable="true"] ul {
        list-style-type: disc !important;
        padding-right: 2rem !important;
        margin: 1rem 0 !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
      }
      
      .editor-content ol,
      [contenteditable="true"] ol {
        list-style-type: decimal !important;
        padding-right: 2rem !important;
        margin: 1rem 0 !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
      }
      
      .editor-content li,
      [contenteditable="true"] li {
        margin-bottom: 0.5rem !important;
        display: list-item !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
      }
      
      /* Blockquote */
      .editor-content blockquote,
      [contenteditable="true"] blockquote {
        border-right: 3px solid #ddd !important;
        padding-right: 1rem !important;
        margin: 1rem 0 !important;
        font-style: italic !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
      }
      
      /* Preview mode */
      .article-preview {
        font-family: var(--font-rabar), system-ui, sans-serif !important;
        font-size: 1.125rem !important;
        line-height: 1.8 !important;
        color: #333 !important;
        direction: rtl !important;
        -webkit-font-smoothing: antialiased !important;
      }
      
      /* Improved text styles for preview mode */
      .article-preview strong, 
      .article-preview b {
        font-weight: 700 !important;
        color: #000 !important;
      }
      
      .article-preview em, 
      .article-preview i {
        font-style: italic !important;
        color: inherit !important;
      }
      
      .article-preview u {
        text-decoration: underline !important;
        text-decoration-thickness: 1px !important;
      }
      
      /* Preserve colors in the preview */
      .article-preview [style*="color"] {
        /* Use the inline style as is */
        display: inline !important;
      }
      
      .article-preview [style*="background-color"],
      .article-preview [style*="background"] {
        /* Use the inline style as is */
        display: inline !important;
        padding: 0 2px !important;
        border-radius: 2px !important;
        box-decoration-break: clone !important;
        -webkit-box-decoration-break: clone !important;
      }
      
      /* Legacy attributes support */
      .article-preview font[color] {
        /* Use the color attribute with the font tag */
        display: inline !important;
      }
      
      .article-preview [bgcolor] {
        /* Use the bgcolor attribute */
        display: inline !important;
        padding: 0 2px !important;
        border-radius: 2px !important;
      }
      
      .article-preview h1,
      .article-preview h2,
      .article-preview h3,
      .article-preview h4,
      .article-preview h5,
      .article-preview h6 {
        color: #111 !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
        font-weight: 700 !important;
      }
      
      .article-preview p {
        margin-bottom: 1.5rem !important;
        line-height: 1.8 !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
      }
      
      .article-preview ul,
      .article-preview ol {
        color: #333 !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
        margin: 1.5rem 0 !important;
        padding-right: 2.5rem !important;
      }
      
      .article-preview li {
        margin-bottom: 0.75rem !important;
        font-family: var(--font-rabar), system-ui, sans-serif !important;
        line-height: 1.7 !important;
        display: list-item !important;
      }
      
      /* Alignment */
      [style*="text-align: right"] {
        text-align: right !important;
      }
      
      [style*="text-align: center"] {
        text-align: center !important;
      }
      
      [style*="text-align: left"] {
        text-align: left !important;
      }
      
      /* Text formatting */
      .editor-content strong,
      [contenteditable="true"] strong,
      .article-preview strong {
        font-weight: 700 !important;
      }
      
      .editor-content em,
      [contenteditable="true"] em,
      .article-preview em {
        font-style: italic !important;
      }
      
      .editor-content u,
      [contenteditable="true"] u,
      .article-preview u {
        text-decoration: underline !important;
      }

      /* Better color highlighting */
      [style*="background-color"] {
        padding: 0 0.1em !important;
        border-radius: 0.15em !important;
      }
      
      [style*="color:"] {
        padding: 0 0.1em !important;
      }
      
      /* Improve toolbar button feedback */
      .editor-toolbar button:active {
        transform: scale(0.95) !important;
      }
      
      /* Waiting cursor during format operations */
      .formatting-in-progress {
        cursor: wait !important;
      }
    `}</style>
  );
} 