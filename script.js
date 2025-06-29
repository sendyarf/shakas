const WORKER_URL = 'https://channel-proxy.sendyarifin8.workers.dev/';
let player;
let currentChannelUrl = '';

async function initPlayer() {
  try {
    shaka.polyfill.installAll();
    
    if (!shaka.Player.isBrowserSupported()) {
      throw new Error('Browser not supported');
    }

    // Inisialisasi cara baru
    player = new shaka.Player();
    await player.attach(document.getElementById('video'));

    player.configure({
      streaming: {
        bufferingGoal: 20,
        rebufferingGoal: 2
      }
    });

  } catch (error) {
    showError(`Init failed: ${error.message}`);
  }
}

async function loadChannel() {
  if (!player) return;

  try {
    const response = await fetch(WORKER_URL);
    if (!response.ok) throw new Error('Network error');
    
    const data = await response.json();
    const channelId = new URLSearchParams(location.search).get('id') || 'italia1';
    const channel = data.channels.find(c => c.id === channelId);

    if (!channel) throw new Error('Channel not found');

    // Update UI
    document.getElementById('channel-info').textContent = channel.name;
    document.getElementById('error').style.display = 'none';

    // Load stream jika URL berbeda
    if (currentChannelUrl !== channel.url) {
      await player.load(channel.url);
      currentChannelUrl = channel.url;
    }

  } catch (error) {
    showError(error.message);
    console.error('Error details:', error);
  }
}

function showError(message) {
  const errorElem = document.getElementById('error');
  errorElem.textContent = message;
  errorElem.style.display = 'block';
}

// Start app
document.addEventListener('DOMContentLoaded', async () => {
  await initPlayer();
  await loadChannel();
  setInterval(loadChannel, 5000); // Polling setiap 5 detik
});