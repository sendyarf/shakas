// Ganti fetch biasa dengan Worker URL
const CHANNELS_URL = 'https://channel-proxy.sendyarifin8.workers.dev/';

async function loadChannel() {
  try {
    const response = await fetch(CHANNELS_URL);
    const data = await response.json();
    
    const channelId = new URLSearchParams(location.search).get('id') || 'italia1';
    const channel = data.channels.find(c => c.id === channelId);

    // Update player (Shaka)
    if (channel) {
      await player.unload();
      if (channel.drm?.clearKeys) {
        player.configure({ drm: { clearKeys: channel.drm.clearKeys } });
      }
      await player.load(channel.url);
      console.log('Stream updated!', new Date());
    }
  } catch (error) {
    console.error('Update failed:', error);
  }
}

// Polling setiap 3 detik
setInterval(loadChannel, 3000);