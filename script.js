let player;
let currentChannelUrl = '';

// Inisialisasi player
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

    player.addEventListener('error', event => {
      showError(`Kesalahan Player: ${event.detail.code}`);
    });

  } catch (error) {
    showError(`Gagal inisialisasi: ${error.message}`);
  }
}

// Memuat channel
async function loadChannel() {
  if (!player) return;

  try {
    const channelId = new URLSearchParams(location.search).get('id') || 'italia1';
    const response = await fetch('channels.json?t=' + Date.now());
    const data = await response.json();
    const channel = data.channels.find(c => c.id === channelId);

    if (!channel) throw new Error(`Channel ${channelId} tidak ditemukan`);

    // Update UI
    document.getElementById('channel-info').textContent = channel.name;
    document.getElementById('error').style.display = 'none';

    // Konfigurasi DRM jika ada
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
    }

  } catch (error) {
    showError(error.message);
  }
}

function showError(message) {
  const errorElem = document.getElementById('error');
  errorElem.textContent = message;
  errorElem.style.display = 'block';
  console.error(message);
}

// Start aplikasi
document.addEventListener('DOMContentLoaded', async () => {
  await initPlayer();
  await loadChannel();
  setInterval(loadChannel, 30000); // Polling setiap 30 detik
});