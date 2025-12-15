/**
 * DOM Utilities
 * Safe alternatives to document.write and other potentially problematic DOM operations
 */

/**
 * Safely append content to an element
 */
export const safeAppendHTML = (element: HTMLElement, html: string): void => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  while (tempDiv.firstChild) {
    element.appendChild(tempDiv.firstChild);
  }
};

/**
 * Safely create and append a script tag
 */
export const safeAppendScript = (
  src: string, 
  onLoad?: () => void, 
  onError?: (error: Event) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => {
      onLoad?.();
      resolve();
    };
    
    script.onerror = (error: Event) => {
      onError?.(error);
      reject(new Error('Script failed to load'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Safely create and append a style tag
 */
export const safeAppendStyle = (css: string): void => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

/**
 * Create a new window/tab with content (safer than document.write)
 */
export const safeOpenWindow = (
  content: string, 
  title: string = 'New Window',
  features?: string
): Window | null => {
  const newWindow = window.open('', '_blank', features);
  
  if (!newWindow) {
    console.warn('Unable to open new window - popup blocked?');
    return null;
  }
  
  // Use innerHTML instead of document.write
  newWindow.document.documentElement.innerHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
  
  return newWindow;
};

/**
 * Download content as a file
 */
export const downloadAsFile = (
  content: string, 
  filename: string, 
  mimeType: string = 'text/plain'
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export default {
  safeAppendHTML,
  safeAppendScript,
  safeAppendStyle,
  safeOpenWindow,
  downloadAsFile,
  copyToClipboard,
};