(() => {
  'use strict';
  const tracks = window.POCKET_TRACKS || [];
  const cfg = window.POCKET_ASSEMBLY || {};
  const list = document.getElementById('track-list');
  const audio = document.getElementById('audio-player');
  const audioBar = document.getElementById('audio-bar');
  const audioToggle = document.getElementById('player-toggle');
  const audioProgress = document.getElementById('player-progress');
  const nowPlaying = document.getElementById('now-playing-title');
  const timeLabel = document.getElementById('player-time');
  const toast = document.getElementById('toast');
  let playingIndex = -1;
  let toastTimeout;
  const icon = (playing) => playing ? 'Ⅱ' : '▶';
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  };
  const setButtonStates = () => {
    document.querySelectorAll('.track-row').forEach((row, i) => {
      const active = i === playingIndex;
      row.classList.toggle('is-active', active);
      const btn = row.querySelector('.track-play');
      btn.textContent = icon(active && !audio.paused);
      btn.setAttribute('aria-label', `${active && !audio.paused ? 'Pause' : 'Play'} preview: ${tracks[i].name}`);
    });
    audioToggle.textContent = icon(audio.paused);
    audioToggle.setAttribute('aria-label', audio.paused ? 'Play audio preview' : 'Pause audio preview');
  };
  function stop() {
    audio.pause();audio.removeAttribute('src');audio.load();playingIndex = -1;
    audioBar.hidden = true;setButtonStates();
  }
  function playIndex(i) {
    if (i === playingIndex) {
      if (audio.paused) audio.play().catch(() => showToast('Audio could not start. Please try again.'));
      else audio.pause();
      setButtonStates();return;
    }
    playingIndex = i;
    audio.src = tracks[i].preview;
    nowPlaying.textContent = tracks[i].name;
    audioBar.hidden = false;
    audioProgress.value = 0;
    audio.load();
    audio.play().catch(() => showToast('Audio could not start. Please try again.'));
    setButtonStates();
  }
  const timeFmt = (n) => {
    if (!Number.isFinite(n)) return '0:00';
    n = Math.floor(n); return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
  };
  tracks.forEach((t, i) => {
    const row = document.createElement('div');row.className = 'track-row';
    const button = document.createElement('button');button.type = 'button';button.className = 'track-play';button.textContent = '▶';button.setAttribute('aria-label', `Play preview: ${t.name}`);
    button.addEventListener('click',()=>playIndex(i));
    const num = document.createElement('span');num.className = 'track-no';num.textContent = String(t.num).padStart(2,'0');
    const title = document.createElement('span');title.className = 'track-title';title.textContent = t.name;
    const dur = document.createElement('span');dur.className = 'track-time';dur.textContent = t.duration;
    row.append(button,num,title,dur);list.append(row);
  });
  audioToggle.addEventListener('click', () => {if (playingIndex >= 0) playIndex(playingIndex);});
  document.getElementById('player-close').addEventListener('click',stop);
  audio.addEventListener('play',setButtonStates);audio.addEventListener('pause',setButtonStates);
  audio.addEventListener('ended',setButtonStates);
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) audioProgress.value = Math.min(100, Math.floor(100 * audio.currentTime / audio.duration));
    timeLabel.textContent = `${timeFmt(audio.currentTime)} / ${timeFmt(audio.duration)}`;
  });
  audioProgress.addEventListener('input', () => {if (audio.duration) audio.currentTime = audio.duration*Number(audioProgress.value)/100;});
  const button = document.getElementById('album-download');
  const note = document.getElementById('download-note');
  let url = typeof cfg.albumDownloadUrl === 'string' ? cfg.albumDownloadUrl.trim() : '';
  // Automatically identify the GitHub repository from its Pages website URL.
  // Examples: owner.github.io/repo/ or owner.github.io (owner.github.io repo).
  if (!url && location.hostname.toLowerCase().endsWith('.github.io')) {
    const owner = location.hostname.split('.')[0];
    const firstSegment = location.pathname.split('/').filter(Boolean)[0];
    const repo = firstSegment || `${owner}.github.io`;
    const tag = cfg.releaseTag || 'v1.0.0';
    const filename = cfg.releaseFilename || 'All-Kinds-of-Feeling-The-Pocket-Assembly.zip';
    url = `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(filename)}`;
  }
  if (/^https:\/\/[^\s]+$/i.test(url)) {
    button.href = url;button.target = '_blank';button.rel='noopener noreferrer';
    button.removeAttribute('aria-disabled');
    document.getElementById('download-button-text').textContent = 'DOWNLOAD ALL 12 TRACKS';
    note.textContent = 'Free download • Complete 12-track ZIP • Artwork included';
  } else {
    button.addEventListener('click', e => {e.preventDefault();showToast('Public album link coming soon.');});
  }
  document.getElementById('share-page').addEventListener('click', async () => {
    const details = {title: 'All Kinds of Feeling — The Pocket Assembly',text:'Listen to the record by The Pocket Assembly.',url:location.href};
    try {if (navigator.share && /^https/.test(location.protocol)) await navigator.share(details);
      else if (navigator.clipboard && /^https/.test(location.protocol)) {await navigator.clipboard.writeText(location.href);showToast('Website link copied!');}
      else showToast('Share this page once it is published online.');
    } catch (e) {if(e.name !== 'AbortError') showToast('Could not share the page.');}
  });
})();
