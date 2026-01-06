import { urlParser } from '.';

export const redirectUrl = (url: string, sameTab: boolean) => {
  const parsedUrl = urlParser(url)[1];

  if (sameTab) {
    document.location.assign(parsedUrl);
  } else {
    // Use _blank with noopener for security, opens in new tab
    const newTab = window.open(parsedUrl, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      // Fallback if popup blocked - use link click method
      const link = document.createElement('a');
      link.href = parsedUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    }
  }
};
