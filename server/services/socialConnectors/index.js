const YouTubeConnector = require('./YouTubeConnector');
const MetaConnector = require('./MetaConnector');
const XConnector = require('./XConnector');
const TikTokConnector = require('./TikTokConnector');

const connectors = {
    youtube: new YouTubeConnector(),
    facebook: new MetaConnector(),
    instagram: new MetaConnector(),
    twitter: new XConnector(),
    tiktok: new TikTokConnector()
};

function getConnector(platform) {
    const key = (platform || '').toLowerCase();
    if (key === 'x') return connectors['twitter'];
    if (connectors[key]) return connectors[key];
    throw new Error(`Plataforma ${platform} no soportada por el sistema de conectores oficiales.`);
}

function getAllConnectors() {
    return connectors;
}

module.exports = {
    getConnector,
    getAllConnectors,
    YouTubeConnector,
    MetaConnector,
    XConnector,
    TikTokConnector
};
