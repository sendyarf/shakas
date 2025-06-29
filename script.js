const WORKER_URL = 'https://channel-proxy.sendyarifin8.workers.dev/';
let player;
let currentChannelId = '';
let channelsData = [];

async function initPlayer() {
  try {
    shaka.polyfill.installAll();
    
    if (!shaka.Player.isBrowserSupported()) {
      throw new Error('Browser tidak mendukung Shaka Player');
    }

    const video = document.getElementById('video');
    player = new shaka.Player();
    await player.attach(video);

    player.configure({
      streaming: {
        bufferingGoal: 20,
        rebufferingGoal: 2,
        retryParameters: {
          maxAttempts: 5,
          baseDelay: 1000,
          backoffFactor: 2,
          fuzzFactor: 0.5
        }
      }
    });

    // Handle error events
    player.addEventListener('error', onPlayerError);

  } catch (error) {
    showError(`Gagal inisialisasi: ${error.message}`);
  }
}

async function loadChannels() {
  try {
    const response = await fetch(WORKER_URL);
    if (!response.ok) throw new Error('Gagal memuat daftar channel');
    
    const data = await response.json();
    channelsData = data.channels;
    renderChannelList();
    
    // Load initial channel
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('id') || channelsData[0]?.id;
    if (channelId) {
      await switchChannel(channelId);
    }
  } catch (error) {
    showError(`Error: ${error.message}`);
  }
}

function renderChannelList() {
  const channelsContainer = document.getElementById('channels');
  channelsContainer.innerHTML = '';
  
  channelsData.forEach(channel => {
    const channelElement = document.createElement('div');
    channelElement.className = `channel-item ${channel.id === currentChannelId ? 'active' : ''}`;
    channelElement.textContent = channel.name;
    channelElement.onclick = () => switchChannel(channel.id);
    channelsContainer.appendChild(channelElement);
  });
}

async function switchChannel(channelId) {
  if (!player || currentChannelId === channelId) return;
  
  try {
    const channel = channelsData.find(c => c.id === channelId);
    if (!channel) throw new Error('Channel tidak ditemukan');

    document.getElementById('channel-info').textContent = `Memuat ${channel.name}...`;
    document.getElementById('error').style.display = 'none';
    
    // Update URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('id', channelId);
    window.history.pushState({}, '', newUrl);

    // Load the stream
    await player.load(channel.url);
    currentChannelId = channelId;
    
    // Update UI
    document.getElementById('channel-info').textContent = `Sekarang diputar: ${channel.name}`;
    renderChannelList(); // Update active channel in the list
    
  } catch (error) {
    showError(`Gagal memuat channel: ${error.message}`);
    console.error('Error details:', error);
  }
}

function onPlayerError(event) {
  showError(`Kesalahan pemutaran: ${event.detail.message}`);
  console.error('Error code', event.detail.code, 'object', event.detail);
}

function showError(message) {
  const errorElem = document.getElementById('error');
  errorElem.textContent = message;
  errorElem.style.display = 'block';
  console.error(message);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  await initPlayer();
  await loadChannels();
  
  // Auto-refresh channels every 5 minutes
  setInterval(loadChannels, 1 * 60 * 1000);
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const channelId = urlParams.get('id');
  if (channelId && channelId !== currentChannelId) {
    switchChannel(channelId);
  }
});