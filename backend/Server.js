import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());


// --- HARDCODE YOUR CONFIG HERE ---
const IMMICH_SERVER_URL = process.env.SERVER_URL; 
const IMMICH_API_KEY = process.env.API_KEY;
// ---------------------------------

// 1. Endpoint to get all public albums and their mapped info
app.get('/api/public-albums', async (req, res) => {
    try {
        const headers = {
        'x-api-key': IMMICH_API_KEY,
        'Accept': 'application/json'
        };

        const [sharedRes, albumsRes] = await Promise.all([
            fetch(`${IMMICH_SERVER_URL}/api/shared-links`, { headers }),
            fetch(`${IMMICH_SERVER_URL}/api/albums`, { headers })
        ]);

        if (!sharedRes.ok || !albumsRes.ok) {
            throw new Error('Failed to communicate with Immich API');
        }

        const sharedLinks = await sharedRes.json();
        const albums = await albumsRes.json();

        const albumMap = new Map();
        albums.forEach(album => albumMap.set(album.id, album));

        const seenAlbums = new Set();

        const publicAlbums = sharedLinks
            .filter(link => link.type === 'ALBUM' && link.album)
            .map(link => {
                const albumData = albumMap.get(link.album.id) || link.album;
                const coverId = albumData.albumThumbnailAssetId || (albumData.assets && albumData.assets[0]?.id);

                console.log("DAT", albumData)
                return {
                    id: link.id,
                    albumId: link.album.id, // Track the unique album ID
                    name: albumData.albumName || 'Untitled Album',
                    itemCount: albumData.assetCount || albumData.assets?.length || 0,
                    sharedAt: link.createdAt,
                    takenAt: albumData.endDate,
                    shareUrl: `${IMMICH_SERVER_URL}/share/${link.key}`,
                    coverUrl: coverId ? `http://localhost:${PORT}/api/thumbnail/${coverId}` : null
                };
            })
            .sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt)) // Sort newest first
            .filter(album => {
                // Keep only the first time we see this album ID (which is the newest due to sorting above)
                if (seenAlbums.has(album.albumId)) return false;
                seenAlbums.add(album.albumId);
                return true;
            });

            console.log("GO", publicAlbums)
        res.json(publicAlbums);
    } catch (error) {
        console.error('Error fetching public albums:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. Thumbnail Proxy Endpoint (Solves the 401 Unauthorized issue)
app.get('/api/thumbnail/:assetId', async (req, res) => {
    try {
        const { assetId } = req.params;
        const response = await fetch(`${IMMICH_SERVER_URL}/api/assets/${assetId}/thumbnail?isThumb=true`, {
            headers: {
                'x-api-key': IMMICH_API_KEY
            }
        });

        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch thumbnail from Immich');
        }

        // Forward the content type (e.g., image/jpeg) and image buffer to the client
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        console.error('Error proxying thumbnail:', error);
        res.status(500).send('Error loading thumbnail');
    }
});

app.listen(PORT, () => {
    console.log(`Backend proxy running on ${PORT}`);
});