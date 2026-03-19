export async function fetchUnsplashImages(query: string, count: number = 3): Promise<string[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey || accessKey.trim() === '') {
    throw new Error("UNSPLASH_ACCESS_KEY is missing. Please add it to your AI Studio secrets.");
  }

  const url = new URL('https://api.unsplash.com/photos/random');
  url.searchParams.append('query', query);
  url.searchParams.append('orientation', 'portrait');
  url.searchParams.append('count', count.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Client-ID ${accessKey}`,
      'Accept-Version': 'v1'
    }
  });

  if (!response.ok) {
    let errorMessage = `Unsplash API error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.errors && errorData.errors.length > 0) {
        errorMessage += ` - ${errorData.errors.join(', ')}`;
      }
    } catch (e) {
      // Ignore JSON parse error
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // Return an array of regular size image URLs
  return data.map((photo: any) => photo.urls.regular);
}
