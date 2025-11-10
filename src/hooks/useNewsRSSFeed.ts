import { useQuery } from '@tanstack/react-query';

export interface NewsItem {
  title: string;
  description: string;
  image: string;
  source: string;
  url: string;
  pubDate: Date;
}

interface RSS2JSONResponse {
  status: string;
  feed: {
    title: string;
    link: string;
    image: string;
  };
  items: Array<{
    title: string;
    description: string;
    content: string;
    link: string;
    pubDate: string;
    thumbnail?: string;
    enclosure?: {
      link: string;
    };
  }>;
}

const extractImageFromContent = (content: string): string | null => {
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
};

const fetchNewsRSS = async (): Promise<NewsItem[]> => {
  // Usando RSS2JSON para converter feed RSS em JSON
  const rssUrl = encodeURIComponent('https://g1.globo.com/rss/g1/');
  const response = await fetch(
    `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&api_key=public&count=20`
  );
  
  if (!response.ok) {
    throw new Error('Falha ao buscar notícias');
  }
  
  const data: RSS2JSONResponse = await response.json();
  
  // Filtrar apenas notícias com imagem e limitar a 10
  const newsWithImages = data.items
    .map(item => {
      const image = item.thumbnail || 
                   item.enclosure?.link || 
                   extractImageFromContent(item.content || item.description);
      
      return {
        title: item.title,
        description: item.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
        image: image || '',
        source: 'G1',
        url: item.link,
        pubDate: new Date(item.pubDate)
      };
    })
    .filter(item => item.image) // Apenas notícias com imagem
    .slice(0, 10);
  
  return newsWithImages;
};

export const useNewsRSSFeed = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['newsRSS'],
    queryFn: fetchNewsRSS,
    staleTime: 300000, // 5 minutos
    refetchInterval: 600000, // Refetch a cada 10 minutos
    retry: 2
  });

  return {
    news: data || [],
    loading: isLoading,
    error: error?.message || null,
    refresh: refetch
  };
};
