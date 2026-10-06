(() => {
  const base = 'https://video.akamai.steamstatic.com/store_trailers/';
  const trailers = {
    '4601470': '4601470/2053159072/3a647a9192c292740722774dfd2d1d0aacc858a1/1779974140/',
    '1591760': '1591760/698464/3a9967d934ba8576a870b724ee26588a9d16712a/1751007366/',
    '3698900': '3698900/588760320/6ac4f90deea2ed28dd86adcd61d0e5b7c5aab2ce/1750423137/',
    '2863350': '2863350/673928/f42bf61a6ec262ebd03a5f0ed01720e9f53aa050/1750948574/',
    '1612900': '1612900/438509/d376aade978fa6f2ac51baf81710e69c4843b97e/1751009940/'
  };
  let library;
  function loadHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (!library) library = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.13/dist/hls.min.js';
      script.onload = () => window.Hls ? resolve(window.Hls) : reject(new Error('Player unavailable'));
      script.onerror = () => { script.remove(); library = null; reject(new Error('Player unavailable')); };
      document.head.append(script);
    });
    return library;
  }
  document.querySelectorAll('#games .project-card').forEach(card => {
    const link = card.querySelector('a[href*="store.steampowered.com/app/"]');
    const appId = link?.href.match(/\/app\/(\d+)/)?.[1];
    if (!trailers[appId]) return;
    const media = card.querySelector('.project-media');
    const cover = media.querySelector('img');
    const title = card.querySelector('h4').textContent;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'trailer-trigger';
    trigger.setAttribute('aria-label', `Watch ${title} trailer`);
    trigger.innerHTML = '<span class="trailer-play" aria-hidden="true">▶</span><span>Watch trailer</span>';
    media.append(trigger);
    const status = document.createElement('p');
    status.className = 'trailer-status';
    status.setAttribute('role', 'status');
    status.hidden = true;
    card.append(status);
    let player, video, timer;
    function clean() {
      clearTimeout(timer);
      if (player) { player.destroy(); player = null; }
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); video.remove(); video = null; }
    }
    function fail() {
      clean();
      cover.hidden = false; trigger.hidden = false; trigger.disabled = false;
      status.textContent = 'Trailer unavailable. Try again or watch it on the Steam page.';
      status.hidden = false;
    }
    trigger.addEventListener('click', async () => {
      trigger.disabled = true;
      status.hidden = false; status.textContent = 'Loading trailer…';
      video = document.createElement('video');
      video.controls = true; video.playsInline = true; video.preload = 'none';
      video.poster = cover.currentSrc || cover.src;
      video.setAttribute('aria-label', `${title} trailer`);
      media.append(video); cover.hidden = true; trigger.hidden = true;
      video.addEventListener('error', fail, {once:true});
      video.addEventListener('playing', () => {
        clearTimeout(timer); status.hidden = true;
        document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
      });
      const start = () => {
        clearTimeout(timer); status.hidden = true;
        video.play().catch(() => { status.hidden = false; status.textContent = 'Press play to start the trailer.'; });
      };
      timer = setTimeout(fail, 25000);
      const src = base + trailers[appId] + 'hls_264_master.m3u8';
      try {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.addEventListener('loadedmetadata', start, {once:true});
          video.src = src;
          video.load();
        } else {
          const Hls = await loadHls();
          if (!video) return;
          if (!Hls.isSupported()) { fail(); return; }
          player = new Hls({maxBufferLength:20,maxMaxBufferLength:30,capLevelToPlayerSize:true});
          player.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) fail(); });
          player.on(Hls.Events.MANIFEST_PARSED, start);
          player.loadSource(src); player.attachMedia(video);
        }
      } catch { fail(); }
    });
  });
})();
