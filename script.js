const WORKER_PROXY_URL = 'https://channel-proxy.sendyarifin8.workers.dev/';

let player;
let currentChannelUrl = '';

async function initPlayer() {
  try {
    shaka.polyfill.installAll();
    if (!shaka.Player.isBrowserSupported()) {
      throw new Error('Browser tidak mendukung Shaka Player');
    }

    player = new shaka.Player(document.getElementById('video'));
    player.configure({
      streaming: {
        bufferingGoal: 20,
        rebufferingGoal: 2
      }
    });

  } catch (error) {
    showError(`Gagal inisialisasi: ${error.message}`);
  }
}

async function loadChannel() {
  if (!player) return;

  try {
    // Gunakan Worker Proxy URL
    const response = await fetch(`${WORKER_PROXY_URL}?t=${Date.now()}`);
    if (!response.ok) throw new Error('Gagal memuat data channel');

    const data = await response.json();
    const channelId = new URLSearchParams(location.search).get('id') || 'italia1';
    const channel = data.channels.find(c => c.id === channelId);

    if (!channel) throw new Error(`Channel ${channelId} tidak ditemukan`);

    // Update UI
    document.getElementById('channel-info').textContent = channel.name;
    document.getElementById('error').style.display = 'none';

    // Konfigurasi DRM
    if (channel.drm?.clearKeys) {
      player.configure({
        drm: {
          clearKeys: channel.drm.clearKeys
        }
      });
    }

    // Load stream jika URL berbeda
    if (currentChannelUrl !== channel.url) {
      await player.load(channel.url);
      currentChannelUrl = channel.url;
      console.log('Stream diperbarui:', new Date());
    }

  } catch (error) {
    showError(error.message);
    console.error('Detail error:', error);
  }
}

function showError(message) {
  const errorElem = document.getElementById('error');
  errorElem.textContent = message;
  errorElem.style.display = 'block';
}

// Start aplikasi
document.addEventListener('DOMContentLoaded', async () => {
  await initPlayer();
  await loadChannel();
  setInterval(loadChannel, 5000); // Polling lebih agresif (5 detik)
});