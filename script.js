async function loadChannels() {
    const response = await fetch('channels.json');
    return await response.json();
}

function showChannelNotFoundError(container) {
    container.innerHTML = `<div class="col-span-full text-center bg-red-900/50 border border-red-700 p-8 rounded-lg"><h2 class="text-2xl font-bold text-red-300">Channel Tidak Ditemukan</h2><p class="text-red-400 mt-2">ID channel yang Anda masukkan tidak valid.</p><a href="/" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Kembali ke Daftar Channel</a></div>`;
}

function displayChannelList(channels) {
    const channelListElement = document.getElementById('channel-list');
    channelListElement.innerHTML = '';
    channels.forEach(channel => {
        const link = document.createElement('a');
        link.href = `?id=${channel.id}`;
        link.className = 'block bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300';
        const name = document.createElement('h3');
        name.className = 'text-xl font-semibold text-white';
        name.textContent = channel.name;
        const drmStatus = document.createElement('p');
        drmStatus.className = 'text-sm mt-2';
        drmStatus.textContent = channel.drm ? '🔒 Dilindungi DRM' : '🔓 Terbuka';
        drmStatus.style.color = channel.drm ? '#facc15' : '#4ade80';
        link.appendChild(name);
        link.appendChild(drmStatus);
        channelListElement.appendChild(link);
    });
}

async function initPlayer(channel) {
    document.getElementById('channel-list-container').style.display = 'none';
    document.getElementById('player-container').style.display = 'block';

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
}

async function main() {
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
        console.error('Browser ini tidak didukung oleh Shaka Player.');
        return;
    }

    const channels = await loadChannels();
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('id');

    if (channelId) {
        const channelToPlay = channels.find(c => c.id === channelId);
        if (channelToPlay) {
            await initPlayer(channelToPlay);
        } else {
            const channelListContainer = document.getElementById('channel-list');
            showChannelNotFoundError(channelListContainer);
        }
    } else {
        displayChannelList(channels);
    }
}

document.addEventListener('DOMContentLoaded', main);