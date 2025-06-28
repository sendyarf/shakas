async function fetchChannels() {
    try {
        const response = await fetch('channels.json');
        if (!response.ok) {
            throw new Error(`Gagal memuat channels.json: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Gagal memuat daftar channel:', error);
        return [];
    }
}

function showChannelNotFoundError(container) {
    container.innerHTML = `<div class="col-span-full text-center bg-red-900/50 border border-red-700 p-8 rounded-lg"><h2 class="text-2xl font-bold text-red-300">Channel Tidak Ditemukan</h2><p class="text-red-400 mt-2">ID channel yang Anda masukkan tidak valid.</p><a href="/" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Kembali ke Daftar Channel</a></div>`;
}

function showPlayerError(container, error) {
    let errorMessage = 'Gagal memutar video.';
    if (error.code === 4032) {
        errorMessage = 'Konfigurasi DRM tidak valid atau stream mem require kunci DRM yang tidak disediakan di channels.json.';
    } else if (error.code === 3015) {
        errorMessage = 'Gagal memuat stream karena masalah CORS. Pastikan server stream mengizinkan CORS.';
    } else if (error.code === 3016) {
        errorMessage = 'Gagal memuat manifest stream. Periksa URL atau format stream.';
    }
    container.innerHTML = `<div class="col-span-full text-center bg-red-900/50 border border-red-700 p-8 rounded-lg"><h2 class="text-2xl font-bold text-red-300">Gagal Memutar Video</h2><p class="text-red-400 mt-2">Error: ${errorMessage}</p><p class="text-red-400 mt-2">Kode: ${error.code} | Detail: ${JSON.stringify(error)}</p><a href="/" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Kembali ke Daftar Channel</a></div>`;
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
    const channelListContainer = document.getElementById('channel-list-container');
    const playerContainer = document.getElementById('player-container');
    channelListContainer.style.display = 'none';
    playerContainer.style.display = 'flex';

    const video = document.getElementById('video-player');
    const container = video.parentElement; 
    const player = new shaka.Player(video);
    
    const ui = new shaka.ui.Overlay(player, container, video);
    ui.getControls();

    player.addEventListener('error', (event) => onErrorEvent(event, playerContainer));

    // Konfigurasi DRM jika ada
    if (channel.drm) {
        console.log('Mengkonfigurasi DRM dengan clearKeys:', channel.drm);
        player.configure({ 
            drm: channel.drm 
        });
    } else {
        console.log('Stream tanpa DRM.');
        player.configure({
            drm: {
                clearKeys: {}, // Kosongkan konfigurasi DRM
                servers: {}, // Nonaktifkan server DRM
                advanced: {
                    'com.widevine.alpha': { distinctiveIdentifierRequired: false }
                }
            }
        });
    }

    // Konfigurasi streaming untuk DASH
    player.configure({
        streaming: {
            bufferingGoal: 60,
            rebufferingGoal: 2,
            bufferBehind: 30,
            retryParameters: {
                maxAttempts: 5,
                baseDelay: 1000,
                backoffFactor: 2,
                fuzzFactor: 0.5
            }
        }
    });

    try {
        console.log(`Memuat stream: ${channel.manifestUrl}`);
        await player.load(channel.manifestUrl);
        console.log('Video berhasil dimuat!');
    } catch (error) {
        onError(error, playerContainer);
    }
}

function onErrorEvent(event, container) {
    onError(event.detail, container);
}

function onError(error, container) {
    console.error('Shaka Player Error:', error);
    showPlayerError(container, error);
}

async function main() {
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
        console.error('Browser ini tidak didukung oleh Shaka Player.');
        const channelListContainer = document.getElementById('channel-list-container');
        channelListContainer.innerHTML = `<div class="col-span-full text-center bg-red-900/50 border border-red-700 p-8 rounded-lg"><h2 class="text-2xl font-bold text-red-300">Browser Tidak Didukung</h2><p class="text-red-400 mt-2">Browser Anda tidak mendukung Shaka Player.</p></div>`;
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('id');

    const channels = await fetchChannels();

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