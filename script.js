let player;
let currentStreamUrl = '';

async function loadChannel() {
  try {
    const channelId = new URLSearchParams(window.location.search).get('id') || 'italia1';
    const response = await fetch(`channels.json?t=${Date.now()}`);
    const { channels } = await response.json();
    const channel = channels.find(c => c.id === channelId);

    if (!channel?.url) return;
    if (currentStreamUrl === channel.url) return; // Skip jika URL sama

    // Konfigurasi DRM (jika ada)
    if (channel.drm?.clearKeys) {
      player.configure({ drm: { clearKeys: channel.drm.clearKeys } });
    }

    await player.load(channel.url);
    currentStreamUrl = channel.url;
    console.log(`Stream diperbarui: ${new Date().toLocaleTimeString()}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', async () => {
  shaka.polyfill.installAll();
  player = new shaka.Player(document.getElementById('video'));
  await loadChannel();
  setInterval(loadChannel, 30000); // Polling setiap 30 detik
});