async function loadChannels() {
    const response = await fetch('channels.json');
    return await response.json();
}

function showChannelNotFoundError() {
    document.getElementById('player-container').style.display = 'none';
    document.getElementById('error-container').style.display = 'block';
}

async function initPlayer(channel) {
    const video = document.getElementById('video-player');
    const container = video.parentElement;
    const player = new shaka.Player(video);
    
    const ui = new shaka.ui.Overlay(player, container, video);
    ui.getControls();

    player.addEventListener('error', onErrorEvent);

    if (channel.drm) {
        console.log('Mengkonfigurasi DRM dengan clearKeys...');
        player.configure({ drm: channel.drm });
    }

    try {
        await player.load(channel.manifestUrl);
        console.log('Video berhasil dimuat!');
    } catch (error) {
        onError(error);
    }
}

function onErrorEvent(event) {
    onError(event.detail);
}

function onError(error) {
    console.error('Shaka Player Error:', error.code, 'Object:', error);
    showChannelNotFoundError();
}

async function main() {
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
        console.error('Browser ini tidak didukung oleh Shaka Player.');
        showChannelNotFoundError();
        return;
    }

    const channels = await loadChannels();
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('id');
    const channelToPlay = channelId 
        ? channels.find(c => c.id === channelId) 
        : channels[0]; // Default ke channel pertama jika tidak ada ID

    if (channelToPlay) {
        await initPlayer(channelToPlay);
    } else {
        showChannelNotFoundError();
    }
}

document.addEventListener('DOMContentLoaded', main);