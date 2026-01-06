export const isUrlOrIp = (data: string): boolean => {
  const regex =
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?|^((http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/i;

  return regex.test(data);
};

export const isUrl = (data: string): boolean => {
  const regex =
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/i;

  return regex.test(data);
};

export const isImage = (data: string): boolean => {
  const regex = /.(jpeg|jpg|png|ico)$/i;

  return regex.test(data);
};

export const isSvg = (data: string): boolean => {
  const regex = /.(svg)$/i;

  return regex.test(data);
};

// Check if icon string is a JSON fetched-icon format
export const isFetchedIcon = (data: string): boolean => {
  if (!data) return false;
  try {
    const parsed = JSON.parse(data);
    return parsed && (parsed.white || parsed.black || parsed.original);
  } catch {
    return false;
  }
};

// Parse fetched icon JSON and return the selected variant path
export interface FetchedIconData {
  white: string | null;
  black: string | null;
  original: string | null;
  selected?: 'white' | 'black' | 'original';
}

export const parseFetchedIcon = (data: string): { path: string; isImage: boolean } | null => {
  try {
    const parsed: FetchedIconData = JSON.parse(data);
    const variant = parsed.selected || 'white';
    const path = parsed[variant];
    
    if (!path) {
      // Fallback to first available
      const fallbackPath = parsed.white || parsed.black || parsed.original;
      if (!fallbackPath) return null;
      return {
        path: `/fetched-icons/${fallbackPath}`,
        isImage: fallbackPath.endsWith('.png') || fallbackPath.endsWith('.ico')
      };
    }
    
    return {
      path: `/fetched-icons/${path}`,
      isImage: path.endsWith('.png') || path.endsWith('.ico')
    };
  } catch {
    return null;
  }
};
