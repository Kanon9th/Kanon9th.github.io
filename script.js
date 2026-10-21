// ========================================================
// Kanon 博客脚本：随机歌词、歌单渲染、音乐播放、滚动动画
// ========================================================

// --------------------------------------------------------
// 一、随机歌词
// --------------------------------------------------------
const lyrics = [
    "看不见你的笑 我怎么睡得着?",
    "你的声音这么近我却抱不到",
    "没有地球 太阳还是会绕",
    "没有理由 我也能自己走",
    "天亮了 你还没睡 是在悔恨过去 还是在纠结那些没有答案的问题"
];

function setRandomLyric() {
    const randomIndex = Math.floor(Math.random() * lyrics.length);
    document.getElementById('random-lyric').innerText = `"${lyrics[randomIndex]}"`;
}

// --------------------------------------------------------
// 二、歌单数据与渲染（按歌名长度排序，同长度按歌手）
// --------------------------------------------------------
const playlists = [
    { title: "玻璃", artist: "Gareth.T", src: "assets/songs/Gareth.T-玻璃.mp3", cover: "assets/covers/玻璃.jpg" },
    { title: "雨天", artist: "孙燕姿", src: "assets/songs/孙燕姿-雨天.m4a", cover: "assets/covers/孙燕姿-雨天.webp" },
    { title: "雨爱", artist: "杨丞琳", src: "assets/songs/杨丞琳-雨爱.mp3", cover: "assets/covers/雨爱.jpg" },
    { title: "彩虹", artist: "周杰伦", src: "assets/songs/周杰伦-彩虹.mp3", cover: "assets/covers/彩虹.jpg" },
    { title: "一半一半", artist: "TopBarry-INDEcompany", src: "assets/songs/TopBarry-INDEcompany-一半一半.mp3", cover: "assets/covers/一半一半.jpg" },
    { title: "半句再见", artist: "孙燕姿", src: "assets/songs/孙燕姿-半句再见.mp3", cover: "assets/covers/半句再见.jpg" },
    { title: "开始懂了", artist: "孙燕姿", src: "assets/songs/孙燕姿-开始懂了.m4a", cover: "assets/covers/孙燕姿-开始懂了.webp" },
    { title: "我不难过", artist: "孙燕姿", src: "assets/songs/孙燕姿-我不难过.mp3", cover: "assets/covers/我不难过.jpg" },
    { title: "我怀念的", artist: "孙燕姿", src: "assets/songs/孙燕姿-我怀念的.m4a", cover: "assets/covers/孙燕姿-我怀念的.webp" },
    { title: "东京不太热", artist: "封茗囧菌", src: "assets/songs/封茗囧菌-东京不太热.mp3", cover: "assets/covers/东京不太热.jpg" },
    { title: "Susan说", artist: "陶喆", src: "assets/songs/陶喆-Susan说.mp3", cover: "assets/covers/Susan说.jpg" },
    { title: "刻在我心底的名字", artist: "卢广仲", src: "assets/songs/卢广仲-刻在我心底的名字.mp3", cover: "assets/covers/刻在我心底的名字.jpg" },
    { title: "原来你什么都不要", artist: "孙燕姿", src: "assets/songs/孙燕姿-原来你什么都不要.m4a", cover: "assets/covers/孙燕姿-原来你什么都不要.webp" }
];

const musicPlayer = document.getElementById('background-music');
const progressElement = document.getElementById('music-progress');
const musicToggleBtn = document.getElementById('music-toggle-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const nowTitle = document.getElementById('now-title');
const nowArtist = document.getElementById('now-artist');
const coverImg = document.getElementById('player-cover');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const listEl = document.getElementById('playlist-list');

// 浏览器安全机制：音量默认适中，避免过大
musicPlayer.volume = 0.5;

// 当前选中曲目（默认第一首）
let currentIndex = 0;

// 听书自动续章标记：等待下一章正文渲染完成后自动从第一段开读
let pendingAutoNext = false;

// 渲染歌单列表
playlists.forEach((song, index) => {
    const li = document.createElement('li');
    li.className = 'playlist-item' + (index === currentIndex ? ' active' : '');
    li.setAttribute('role', 'button');
    li.tabIndex = 0;

    const name = document.createElement('span');
    name.className = 'pl-name';
    name.textContent = song.title;

    li.appendChild(name);
    li.addEventListener('click', () => selectSong(index));
    li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectSong(index);
        }
    });

    listEl.appendChild(li);
});

// --------------------------------------------------------
// 三、播放控制
// --------------------------------------------------------
function updatePlayIcon(isPlaying) {
    iconPlay.style.display = isPlaying ? 'none' : 'block';
    iconPause.style.display = isPlaying ? 'block' : 'none';
    musicToggleBtn.setAttribute('aria-label', isPlaying ? '暂停音乐' : '播放音乐');
    musicToggleBtn.title = isPlaying ? '暂停' : '播放';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// 封面随歌曲切换：淡入切换
function switchCover(index) {
    const cover = playlists[index].cover;
    if (coverImg.dataset.src === cover) return;
    coverImg.dataset.src = cover;
    coverImg.classList.remove('show');
    coverImg.onload = () => coverImg.classList.add('show');
    coverImg.src = cover;
}

function selectSong(index) {
    const song = playlists[index];

    // 更新"现在播放"与封面
    nowTitle.textContent = song.title;
    nowArtist.textContent = song.artist;
    switchCover(index);

    // 高亮当前曲目
    const items = listEl.querySelectorAll('.playlist-item');
    items.forEach((item, i) => item.classList.toggle('active', i === index));

    // 若已载入同一首歌，则切换播放/暂停
    if (musicPlayer.src && musicPlayer.src.indexOf(song.src) !== -1) {
        togglePlay();
        return;
    }

    // 切换到新曲目：加载后播放，并更新进度条与总时长
    musicPlayer.src = song.src;
    musicPlayer.load();
    currentIndex = index;
    progressElement.value = 0;
    timeCurrent.textContent = '0:00';
    timeTotal.textContent = '--:--';

    musicPlayer.play().then(() => {
        updatePlayIcon(true);
    }).catch(() => {
        updatePlayIcon(false);
        showToast('无法自动播放，请再次点击播放按钮');
    });
    saveMusicProgress();
}

function togglePlay() {
    if (musicPlayer.paused) {
        musicPlayer.play().then(() => {
            updatePlayIcon(true);
        }).catch(() => {
            showToast('无法自动播放，请再次点击播放按钮');
            updatePlayIcon(false);
        });
    } else {
        musicPlayer.pause();
        updatePlayIcon(false);
    }
}

// 断点续播：保存当前歌曲与进度（localStorage）
let lastMusicSave = 0;
function saveMusicProgress() {
    try {
        localStorage.setItem('kanon_music', JSON.stringify({
            index: currentIndex,
            title: playlists[currentIndex] ? playlists[currentIndex].title : '',
            artist: playlists[currentIndex] ? playlists[currentIndex].artist : '',
            currentTime: musicPlayer.currentTime || 0,
            mode: playMode
        }));
    } catch (e) { /* 存储不可用时静默跳过 */ }
}

musicToggleBtn.addEventListener('click', togglePlay);

// --------------------------------------------------------
// 四、进度条与时间显示
// --------------------------------------------------------
function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

musicPlayer.addEventListener('timeupdate', () => {
    if (musicPlayer.duration) {
        progressElement.value = musicPlayer.currentTime / musicPlayer.duration;
        timeCurrent.textContent = formatTime(musicPlayer.currentTime);
    }
    // 节流保存播放进度（每 3 秒）
    if (Date.now() - lastMusicSave > 3000) {
        lastMusicSave = Date.now();
        saveMusicProgress();
    }
});

musicPlayer.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = formatTime(musicPlayer.duration);
});

// 点击进度条跳转
progressElement.addEventListener('click', (e) => {
    const rect = progressElement.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (musicPlayer.duration) {
        musicPlayer.currentTime = ratio * musicPlayer.duration;
    }
});

// 播放模式：order（列表循环）/ once（单曲循环）/ random（随机）
// 网易云风格：一个按钮，点击循环切换，图标随模式变化
let playMode = 'order';
const modeBtn = document.getElementById('mode-btn');
const modeIcon = document.getElementById('mode-icon');
const MODE_ICONS = {
    order: '<path fill="currentColor" d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>',
    once: '<path fill="currentColor" d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/><path fill="currentColor" d="M13 15V9h-1l-2 1v1h1.5v4H13z"/>',
    random: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'
};
const MODE_NAMES = { order: '顺序播放', once: '单曲循环', random: '随机播放' };
const MODE_ORDER = ['order', 'once', 'random'];

function setPlayMode(mode, silent) {
    playMode = mode;
    modeIcon.innerHTML = MODE_ICONS[mode];
    modeBtn.title = '播放模式：' + MODE_NAMES[mode] + '（点击切换）';
    modeBtn.setAttribute('aria-label', '播放模式：' + MODE_NAMES[mode]);
    if (!silent) showToast(MODE_NAMES[mode]);
    saveMusicProgress();
}

modeBtn.addEventListener('click', () => {
    const next = MODE_ORDER[(MODE_ORDER.indexOf(playMode) + 1) % MODE_ORDER.length];
    setPlayMode(next);
});
// 初始化模式图标（不写存储，避免覆盖上次保存的播放状态）
modeIcon.innerHTML = MODE_ICONS[playMode];
modeBtn.title = '播放模式：' + MODE_NAMES[playMode] + '（点击切换）';
modeBtn.setAttribute('aria-label', '播放模式：' + MODE_NAMES[playMode]);

// 播放结束：按播放模式处理（原生 loop 已移除，统一由这里控制）
musicPlayer.addEventListener('ended', () => {
    if (playMode === 'once') {
        // 单曲循环：从头重播
        musicPlayer.currentTime = 0;
        musicPlayer.play().catch(() => {});
        updatePlayIcon(true);
    } else if (playMode === 'random') {
        // 随机：避开刚播完的这首
        let next = currentIndex;
        while (playlists.length > 1 && next === currentIndex) {
            next = Math.floor(Math.random() * playlists.length);
        }
        selectSong(next);
    } else {
        // 顺序：自动下一首，最后一首回到第一首
        selectSong((currentIndex + 1) % playlists.length);
    }
});

// --------------------------------------------------------
// 五、滚动动画：卡片入场（rAF 节流，滚动更流畅）
//     所有带 data-visible 的元素统一做淡入上浮
// --------------------------------------------------------
let scrollTicking = false;

function handleScroll() {
    if (scrollTicking) return;
    scrollTicking = true;

    requestAnimationFrame(() => {
        const cards = document.querySelectorAll('[data-visible]');
        const triggerTop = window.innerHeight - 80;
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.top <= triggerTop && rect.bottom >= 60) {
                if (card.getAttribute('data-visible') !== 'true') {
                    card.setAttribute('data-visible', 'true');
                }
            }
        });

        // 顶栏滚动后加深阴影
        const header = document.querySelector('.header');
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 10);
        }

        scrollTicking = false;
    });
}

window.addEventListener('scroll', handleScroll, { passive: true });

// --------------------------------------------------------
// 六、顶栏高度自适应：固定导航无论多高都不遮挡首屏内容
// --------------------------------------------------------
function fitHeader() {
    const header = document.querySelector('.header');
    if (header) {
        document.body.style.paddingTop = header.offsetHeight + 'px';
    }
}

window.addEventListener('resize', fitHeader);
window.addEventListener('load', fitHeader);

// 页面加载时触发一次
window.addEventListener('DOMContentLoaded', () => {
    setRandomLyric();
    handleScroll();
    initNovel();
    fitHeader();
});

// --------------------------------------------------------
// 六、小说模块：章节切换 + 书籍面板（正文分片按需加载）
// 索引（novels/index.js）小文件秒开章节列表；正文按片动态注入，跨片自动加载
// --------------------------------------------------------
const novels = window.NOVEL_INDEX || [];
let novelBook = 0;
let novelChapter = 0;
const loadedParts = {};       // 已加载分片缓存（key = 分片文件名）

const novelTitleEl = document.getElementById('novel-title');
const novelAuthorEl = document.getElementById('novel-author');
const novelChapterName = document.getElementById('novel-chapter-name');
const novelContent = document.getElementById('novel-content');
const novelPrev = document.getElementById('novel-prev');
const novelNext = document.getElementById('novel-next');
const novelBookBtn = document.getElementById('novel-book-btn');
const novelBookPanel = document.getElementById('novel-book-panel');
const bookList = document.getElementById('book-list');
const novelChapterBtn = document.getElementById('novel-chapter-btn');
const novelChapterPanel = document.getElementById('novel-chapter-panel');
const chapterList = document.getElementById('chapter-list');

// 当前章节所在分片
function partOf(chapterIdx) {
    const book = novels[novelBook];
    if (!book) return null;
    return book.parts.find(p => chapterIdx >= p.start && chapterIdx <= p.end) || null;
}

// 确保分片已加载，未加载则动态注入脚本
function ensurePart(part, cb) {
    if (loadedParts[part.file]) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'novels/' + part.file;
    s.onload = () => {
        loadedParts[part.file] = true;
        cb();
    };
    s.onerror = () => {
        novelContent.innerHTML = '<p class="novel-tip">章节加载失败，请刷新重试</p>';
    };
    document.head.appendChild(s);
}

function renderNovelChapter(keepReading) {
    if (!keepReading) stopReading();
    const book = novels[novelBook];
    if (!book) {
        novelContent.innerHTML = '<p class="novel-tip">未找到小说数据</p>';
        return;
    }
    novelTitleEl.textContent = book.title;
    novelAuthorEl.textContent = book.author;

    const targetCh = novelChapter;
    novelChapterName.textContent = book.chapters[targetCh] || '';

    // 占位提示，正文异步加载后淡入
    novelContent.classList.add('fading');
    novelContent.innerHTML = '<p class="novel-tip">章节加载中…</p>';

    const part = partOf(targetCh);
    if (!part) {
        novelContent.innerHTML = '<p class="novel-tip">章节数据缺失</p>';
        return;
    }
    ensurePart(part, () => {
        // 加载期间用户可能已切章，只渲染当前目标章
        if (novelChapter !== targetCh) return;
        const ch = (window.NOVEL_PARTS && window.NOVEL_PARTS[book.title]
            && window.NOVEL_PARTS[book.title][part.idx]
            && window.NOVEL_PARTS[book.title][part.idx][targetCh - part.start]) || null;
        if (!ch) {
            novelContent.innerHTML = '<p class="novel-tip">章节数据缺失</p>';
            return;
        }
        const paragraphs = ch.content.split(/\r?\n/);
        const frag = document.createDocumentFragment();
        for (const para of paragraphs) {
            const t = para.trim();
            if (!t) continue;
            const p = document.createElement('p');
            p.textContent = t;
            p.classList.add('para');
            frag.appendChild(p);
        }
        novelContent.innerHTML = '';
        novelContent.appendChild(frag);
        // 段落可点击：点击任意段落即从该段开始朗读
        Array.from(novelContent.querySelectorAll('p')).forEach((p, idx) => {
            p.addEventListener('click', () => onParaClick(idx));
        });
        novelContent.scrollTop = 0;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            novelContent.classList.remove('fading');
            // 自动续章：上一章读完进入下一章，正文就绪后从第一段自动开读
            if (pendingAutoNext && readState === 'playing') {
                pendingAutoNext = false;
                readingIndex = 0;
                readFrom(0);
            }
        }));
    });

    novelPrev.disabled = novelChapter === 0;
    novelNext.disabled = novelChapter === book.chapters.length - 1;
}

function goChapter(delta, keepReading) {
    const book = novels[novelBook];
    if (!book) return;
    const next = novelChapter + delta;
    if (next < 0 || next >= book.chapters.length) return;
    novelChapter = next;
    renderNovelChapter(keepReading);
    saveNovelProgress();
}

// 断点续读：保存当前书籍与章节（localStorage）
function saveNovelProgress() {
    try {
        localStorage.setItem('kanon_novel', JSON.stringify({ book: novelBook, chapter: novelChapter }));
    } catch (e) { /* 存储不可用时静默跳过 */ }
}

function openBookPanel() {
    novelBookPanel.classList.add('open');
    novelBookBtn.setAttribute('aria-expanded', 'true');
}

function closeBookPanel() {
    novelBookPanel.classList.remove('open');
    novelBookBtn.setAttribute('aria-expanded', 'false');
}

// 章节选择面板：标题来自索引，无需加载正文，秒开
function renderChapterList() {
    const book = novels[novelBook];
    if (!book) return;
    const frag = document.createDocumentFragment();
    book.chapters.forEach((title, i) => {
        const item = document.createElement('button');
        item.className = 'chapter-item' + (i === novelChapter ? ' active' : '');
        item.textContent = title;
        item.addEventListener('click', () => {
            if (i !== novelChapter) {
                novelChapter = i;
                renderNovelChapter();
                saveNovelProgress();
            }
            closeChapterPanel();
        });
        frag.appendChild(item);
    });
    chapterList.innerHTML = '';
    chapterList.appendChild(frag);
}

function openChapterPanel() {
    closeBookPanel();
    renderChapterList();
    novelChapterPanel.classList.add('open');
    novelChapterBtn.setAttribute('aria-expanded', 'true');
    // 滚动到当前章节附近
    const active = chapterList.querySelector('.chapter-item.active');
    if (active) {
        chapterList.scrollTop = Math.max(0, active.offsetTop - chapterList.clientHeight / 2);
    }
}

function closeChapterPanel() {
    novelChapterPanel.classList.remove('open');
    novelChapterBtn.setAttribute('aria-expanded', 'false');
}

function renderBookList() {
    bookList.innerHTML = '';
    novels.forEach((book, i) => {
        const item = document.createElement('button');
        item.className = 'book-item' + (i === novelBook ? ' active' : '');
        item.textContent = `${book.title} · ${book.author}`;
        item.addEventListener('click', () => {
            if (i !== novelBook) {
                novelBook = i;
                novelChapter = 0;
                renderNovelChapter();
                saveNovelProgress();
            }
            closeBookPanel();
        });
        bookList.appendChild(item);
    });
}

function initNovel() {
    novelPrev.addEventListener('click', () => goChapter(-1));
    novelNext.addEventListener('click', () => goChapter(1));

    novelBookBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (novelBookPanel.classList.contains('open')) {
            closeBookPanel();
        } else {
            closeChapterPanel();
            renderBookList();
            openBookPanel();
        }
    });

    novelChapterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (novelChapterPanel.classList.contains('open')) {
            closeChapterPanel();
        } else {
            openChapterPanel();
        }
    });

    // 点击面板外部时关闭
    document.addEventListener('click', (e) => {
        if (!novelBookPanel.contains(e.target) && !novelBookBtn.contains(e.target)) {
            closeBookPanel();
        }
        if (!novelChapterPanel.contains(e.target) && !novelChapterBtn.contains(e.target)) {
            closeChapterPanel();
        }
    });

    // 恢复上次阅读进度（书籍 + 章节），无记录则从第一本第一章开始
    try {
        const saved = JSON.parse(localStorage.getItem('kanon_novel'));
        if (saved && Number.isInteger(saved.book) && saved.book >= 0 && saved.book < novels.length
            && Number.isInteger(saved.chapter) && saved.chapter >= 0
            && saved.chapter < novels[saved.book].chapters.length) {
            novelBook = saved.book;
            novelChapter = saved.chapter;
        }
    } catch (e) { /* 忽略损坏数据 */ }

    renderBookList();
    renderNovelChapter();
}

// --------------------------------------------------------
// 八、小说听书：Web Speech API 朗读当前章节
// --------------------------------------------------------
const novelReadBtn = document.getElementById('novel-read-btn');
const novelReadBar = document.getElementById('novel-read-bar');
const readStatus = document.getElementById('read-status');
const readRateEl = document.getElementById('read-rate');
const readRateDown = document.getElementById('read-rate-down');
const readRateUp = document.getElementById('read-rate-up');
const readStopBtn = document.getElementById('read-stop');

let readState = 'idle';     // idle | playing | paused
let readingIndex = 0;       // 当前读到第几段
let speechRate = 1.0;       // 语速倍率
let speechGen = 0;          // 朗读代次：cancel 后旧回调全部失效，杜绝跳句/重复
let preferredVoice = null;  // 首选语音：云扬 Yunyang

const hasSpeech = () => typeof window.speechSynthesis !== 'undefined'
    && 'SpeechSynthesisUtterance' in window;

// 选择中文语音：优先 Edge 云扬（Yunyang），找不到则用系统默认
function loadVoice() {
    try {
        const voices = window.speechSynthesis.getVoices();
        preferredVoice = voices.find(v => /yunyang/i.test(v.name)) || null;
    } catch (e) {
        preferredVoice = null;
    }
}

if (hasSpeech()) {
    loadVoice();
    window.speechSynthesis.onvoiceschanged = loadVoice;
}

// 取消朗读并令旧回调失效
function cancelSpeech() {
    speechGen++;
    window.speechSynthesis.cancel();
}

function getParaEls() {
    return Array.from(novelContent.querySelectorAll('p'));
}

function clearHighlight() {
    const cur = novelContent.querySelector('p.reading');
    if (cur) cur.classList.remove('reading');
}

function highlightPara(i) {
    clearHighlight();
    const ps = getParaEls();
    if (ps[i]) {
        ps[i].classList.add('reading');
        ps[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function setReadUI() {
    if (readState === 'idle') {
        novelReadBtn.textContent = '听书';
        novelReadBar.classList.remove('show');
        clearHighlight();
    } else {
        novelReadBtn.textContent = readState === 'playing' ? '暂停' : '继续';
        novelReadBar.classList.add('show');
        readStatus.textContent = readState === 'playing' ? '正在朗读' : '已暂停';
    }
    readRateEl.textContent = speechRate.toFixed(1) + '×';
}

function stopReading() {
    if (readState !== 'idle') {
        cancelSpeech();
        readState = 'idle';
        readingIndex = 0;
        pendingAutoNext = false;
        setReadUI();
    }
}

// 点击正文段落：从该段开始朗读（朗读中随时切换起点，暂停态点击即续读）
function onParaClick(i) {
    if (!hasSpeech()) {
        showToast('当前浏览器不支持语音朗读');
        return;
    }
    if (novelContent.querySelector('.novel-tip')) {
        showToast('章节加载中，请稍候再听');
        return;
    }
    cancelSpeech();
    pendingAutoNext = false;
    readState = 'playing';
    setReadUI();
    readingIndex = i;
    readFrom(i);
}

function readFrom(index) {
    const paras = getParaEls();
    if (index >= paras.length) {
        // 本章读完：自动续到下一章（等待新章节正文渲染完成后自动开读）
        if (novelNext.disabled) {
            stopReading();
            showToast('本书已朗读完毕');
            return;
        }
        pendingAutoNext = true;
        goChapter(1, true);
        return;
    }
    if (readState !== 'playing') return;
    readingIndex = index;
    highlightPara(index);
    const text = paras[index].textContent.trim();
    if (!text) {
        readFrom(index + 1);
        return;
    }
    const myGen = speechGen;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = speechRate;
    if (preferredVoice) u.voice = preferredVoice;
    u.onend = () => {
        // 已被 cancel 的旧朗读忽略其回调，防止跳句与重复
        if (myGen !== speechGen) return;
        readFrom(index + 1);
    };
    u.onerror = () => {
        if (myGen !== speechGen) return;
        readFrom(index + 1);   // 个别段落出错自动跳过
    };
    window.speechSynthesis.speak(u);
}

function toggleRead() {
    if (!hasSpeech()) {
        showToast('当前浏览器不支持语音朗读');
        return;
    }
    if (readState === 'idle') {
        // 章节正文尚未加载完成时不启动朗读
        if (novelContent.querySelector('.novel-tip')) {
            showToast('章节加载中，请稍候再听');
            return;
        }
        readState = 'playing';
        readingIndex = 0;
        setReadUI();
        readFrom(0);
    } else if (readState === 'playing') {
        cancelSpeech();
        readState = 'paused';
        setReadUI();
    } else {
        // 暂停 → 继续（从当前段重新读起，绕开部分浏览器 pause/resume 卡顿）
        readState = 'playing';
        setReadUI();
        readFrom(readingIndex);
    }
}

function changeRate(delta) {
    speechRate = Math.min(1.8, Math.max(0.5, +(speechRate + delta).toFixed(1)));
    readRateEl.textContent = speechRate.toFixed(1) + '×';
    if (readState === 'playing') {
        cancelSpeech();
        readFrom(readingIndex);
    }
}

novelReadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleRead();
});

readRateDown.addEventListener('click', (e) => {
    e.stopPropagation();
    changeRate(-0.1);
});

readRateUp.addEventListener('click', (e) => {
    e.stopPropagation();
    changeRate(0.1);
});

readStopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stopReading();
    showToast('已停止朗读');
});

// 八、站点运行时间：从建站日起实时累计（秒级更新）
(function () {
    // 2026.10.17 建站
    const LAUNCH_DATE = new Date('2026-10-17T00:00:00+08:00');
    const el = document.getElementById('site-uptime');
    if (!el) return;
    const pad = (n) => String(n).padStart(2, '0');
    function update() {
        let diff = Math.max(0, Math.floor((Date.now() - LAUNCH_DATE.getTime()) / 1000));
        const days = Math.floor(diff / 86400);
        diff -= days * 86400;
        const hours = Math.floor(diff / 3600);
        diff -= hours * 3600;
        const mins = Math.floor(diff / 60);
        const secs = diff - mins * 60;
        el.innerHTML =
            '本站已运行 <span class="up-num">' + days + '</span> 天 <span class="up-num">' +
            pad(hours) + '</span> 小时 <span class="up-num">' + pad(mins) +
            '</span> 分 <span class="up-num">' + pad(secs) + '</span> 秒';
    }
    update();
    setInterval(update, 1000);
})();

// 九、断点续播：刷新/重开页面后恢复上次的歌曲、进度与播放模式（不自动播放）
(function () {
    let saved = null;
    try {
        saved = JSON.parse(localStorage.getItem('kanon_music'));
    } catch (e) { saved = null; }
    if (!saved) return;
    // 优先按 歌名+歌手 匹配（歌单排序变化时索引会错位，避免恢复错歌）
    let idx = null;
    if (typeof saved.title === 'string' && saved.title) {
        const hit = playlists.findIndex(p => p.title === saved.title && p.artist === saved.artist);
        if (hit !== -1) idx = hit;
    }
    if (idx === null && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < playlists.length) {
        idx = saved.index;
    }

    if (idx !== null) {
        const song = playlists[idx];
        currentIndex = idx;
        nowTitle.textContent = song.title;
        nowArtist.textContent = song.artist;
        switchCover(idx);
        const items = listEl.querySelectorAll('.playlist-item');
        items.forEach((item, i) => item.classList.toggle('active', i === idx));

        // 装载歌曲但不自动播放（浏览器限制），定位到保存的进度
        musicPlayer.src = song.src;
        musicPlayer.load();
        progressElement.value = 0;
        timeCurrent.textContent = '0:00';
        timeTotal.textContent = '--:--';
        if (typeof saved.currentTime === 'number' && isFinite(saved.currentTime) && saved.currentTime > 3) {
            const seek = () => {
                try {
                    if (saved.currentTime < musicPlayer.duration - 3) {
                        musicPlayer.currentTime = saved.currentTime;
                    }
                } catch (e) { /* 位置越界时忽略 */ }
            };
            if (musicPlayer.readyState >= 1) {
                seek();
            } else {
                musicPlayer.addEventListener('loadedmetadata', seek, { once: true });
            }
        }
    }

    if (saved.mode && MODE_ORDER.indexOf(saved.mode) !== -1) {
        playMode = saved.mode;
        modeIcon.innerHTML = MODE_ICONS[saved.mode];
        modeBtn.title = '播放模式：' + MODE_NAMES[saved.mode] + '（点击切换）';
        modeBtn.setAttribute('aria-label', '播放模式：' + MODE_NAMES[saved.mode]);
    }
})();
