import React, { useState, useEffect } from 'react';
import { Col, Row } from 'reactstrap';
import './App.css';

const App = () => {

    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`http://penguinore.net:15000/api/public-albums`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch from backend');
            return res.json();
        })
        .then(data => {
            setAlbums(data);
            setLoading(false);
        })
        .catch(err => {
            setError(err.message);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className='loading'>Loading albums...</div>;

    if (error) {
        console.log("ERR", error);
        return <div className='error'>Error</div>;
    }

    // Helper function to group albums by formatted share date string (e.g., "October 2, 2026")
    const groupAlbumsByDate = (albumList) => {
        const groups = {};
        albumList.forEach(album => {
            const dateStr = new Date(album.sharedAt).toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(album);
        });
        return groups;
    };

    const groupedAlbums = groupAlbumsByDate(albums);

    console.log("GROUP", groupedAlbums)

    return (
        <div className='page'>
            <header className='header'>
                <h1>Photo Albums</h1>
                <p>In order of most recently shared, not photo taken.</p>
                <p>Generic albums are added to over time and in parenthesis, specific events are not.</p>
            </header>
            
            {albums.length === 0 ? (
                <p className='none-found'>No shared albums found.</p>
            ) : (
                <div>
                    {Object.entries(groupedAlbums).map(([dateLabel, dateAlbums]) => (
                        <section className='albums' key={dateLabel}>
                            {/* Share Date in Top-Left Corner of the Group */}
                            <div className='date'>
                                <span>
                                    Shared on {dateLabel}
                                </span>
                            </div>

                            <Row>
                                {dateAlbums.map(album => {
                                    const takenAtStr = new Date(album.takenAt).toLocaleDateString(undefined, { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    });

                                    return (

                                        <Col className='album' lg={4}>
                                            <a 
                                                key={album.id} 
                                                href={album.shareUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                                                }}
                                            >
                                                {/* Cover Image */}
                                                <div className='cover'>
                                                    {album.coverUrl ? (
                                                        <img 
                                                            src={album.coverUrl} 
                                                            alt={album.name} 
                                                        />
                                                    ) : (
                                                        <div className='no-cover'>
                                                            No Cover Photo
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Content */}
                                                <div className='album-details'>
                                                    <h2>
                                                        {album.name}
                                                    </h2>
                                                    <p>
                                                        {album.itemCount} photos • Click to view full album
                                                    </p>
                                                    <p>
                                                        {takenAtStr}
                                                    </p>
                                                </div>
                                            </a>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
};

export default App;