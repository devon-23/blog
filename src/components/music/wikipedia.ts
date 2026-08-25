// Ported from Spinning's script.js — used as a fallback artist image source
// when Last.fm doesn't have a usable artist photo.

export async function getWikipediaArtistImage(artist: string): Promise<string | null> {
  const searchUrl =
    `https://en.wikipedia.org/w/api.php` +
    `?action=query&list=search&srsearch=${encodeURIComponent(artist)}&format=json&origin=*`;

  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();

  if (!searchData.query?.search?.length) return null;

  const pageTitle = searchData.query.search[0].title;
  return getWikipediaPageImage(pageTitle);
}

export async function getWikipediaPageImage(title: string): Promise<string | null> {
  const pageUrl =
    `https://en.wikipedia.org/w/api.php` +
    `?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&format=json&origin=*`;

  const response = await fetch(pageUrl);
  const data = await response.json();

  const pages = data.query?.pages;
  if (!pages) return null;

  const page = Object.values(pages)[0] as any;
  return page.original?.source || null;
}
