import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'かみしばい - Kamishibai',
        short_name: 'かみしばい',
        description: '子供のための安全な紙芝居動画プラットフォーム',
        start_url: '/',
        display: 'standalone',
        background_color: '#fdfbf7',
        theme_color: '#b1a08a',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
