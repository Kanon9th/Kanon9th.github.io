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
// 二、歌单数据与渲染
// --------------------------------------------------------
const playlists = [
    { title: "彩虹", artist: "周杰伦", src: "assets/周杰伦-彩虹.mp3" },
    { title: "我不难过", artist: "孙燕姿", src: "assets/孙燕姿-我不难过.mp3" }
];

const musicPlayer = document.getElementById('background-music');
const progressElement = document.getElementById('music-progress');
const musicToggleBtn = document.getElementById('music-toggle-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const nowTitle = document.getElementById('now-title');
const nowArtist = document.getElementById('now-artist');
const coverRainbow = document.getElementById('cover-rainbow');
const coverBunan = document.getElementById('cover-bunan');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const listEl = document.getElementById('playlist-list');

// 浏览器安全机制：音量默认适中，避免过大
musicPlayer.volume = 0.5;

// 当前选中曲目（默认第一首）
let currentIndex = 0;

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

// 封面随歌曲切换：交叉淡入淡出
function switchCover(index) {
    coverRainbow.classList.toggle('show', index === 0);
    coverBunan.classList.toggle('show', index === 1);
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

// 播放结束回到开头
musicPlayer.addEventListener('ended', () => {
    musicPlayer.currentTime = 0;
    updatePlayIcon(false);
});

// --------------------------------------------------------
// 五、滚动动画：技术分享卡片入场（rAF 节流，滚动更流畅）
// --------------------------------------------------------
let scrollTicking = false;

function handleScroll() {
    if (scrollTicking) return;
    scrollTicking = true;

    requestAnimationFrame(() => {
        const cards = document.querySelectorAll('.tech-card');
        const triggerTop = window.innerHeight - 80;
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.top <= triggerTop && rect.bottom >= 60) {
                if (card.getAttribute('data-visible') !== 'true') {
                    card.setAttribute('data-visible', 'true');
                }
            }
        });
        scrollTicking = false;
    });
}

window.addEventListener('scroll', handleScroll, { passive: true });

// 页面加载时触发一次
window.addEventListener('DOMContentLoaded', () => {
    setRandomLyric();
    handleScroll();
    initNovel();
    renderGuestbook();
});

// --------------------------------------------------------
// 六、小说模块：章节切换 + 书籍面板
// --------------------------------------------------------
const novels = window.NOVEL_BOOKS || [];
let novelBook = 0;
let novelChapter = 0;

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

function renderNovelChapter() {
    const book = novels[novelBook];
    if (!book) {
        novelContent.innerHTML = '<p>未找到小说数据</p>';
        return;
    }
    novelTitleEl.textContent = book.title;
    novelAuthorEl.textContent = book.author;

    const ch = book.chapters[novelChapter];
    novelChapterName.textContent = ch.title;

    // 内容淡入切换（先置透明，构建内容后淡入）
    novelContent.classList.add('fading');
    // txt 段落为"每段一行"，按单个换行切分
    const paragraphs = ch.content.split(/\r?\n/);
    const frag = document.createDocumentFragment();
    for (const para of paragraphs) {
        const t = para.trim();
        if (!t) continue;
        const p = document.createElement('p');
        p.textContent = t;
        frag.appendChild(p);
    }
    novelContent.innerHTML = '';
    novelContent.appendChild(frag);
    novelContent.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => novelContent.classList.remove('fading')));

    novelPrev.disabled = novelChapter === 0;
    novelNext.disabled = novelChapter === book.chapters.length - 1;
}

function goChapter(delta) {
    const book = novels[novelBook];
    if (!book) return;
    const next = novelChapter + delta;
    if (next < 0 || next >= book.chapters.length) return;
    novelChapter = next;
    renderNovelChapter();
}

function openBookPanel() {
    novelBookPanel.classList.add('open');
    novelBookBtn.setAttribute('aria-expanded', 'true');
}

function closeBookPanel() {
    novelBookPanel.classList.remove('open');
    novelBookBtn.setAttribute('aria-expanded', 'false');
}

// 章节选择面板
function renderChapterList() {
    const book = novels[novelBook];
    if (!book) return;
    const frag = document.createDocumentFragment();
    book.chapters.forEach((ch, i) => {
        const item = document.createElement('button');
        item.className = 'chapter-item' + (i === novelChapter ? ' active' : '');
        item.textContent = ch.title;
        item.addEventListener('click', () => {
            if (i !== novelChapter) {
                novelChapter = i;
                renderNovelChapter();
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

    renderBookList();
    renderNovelChapter();
}

// --------------------------------------------------------
// 七、留言板：localStorage 本地保存
// --------------------------------------------------------
const GUESTBOOK_KEY = 'kanon_guestbook';
const guestbookForm = document.getElementById('guestbook-form');
const guestNameInput = document.getElementById('guest-name');
const guestTextInput = document.getElementById('guest-text');
const guestbookList = document.getElementById('guestbook-list');

function loadGuestbook() {
    try {
        const data = JSON.parse(localStorage.getItem(GUESTBOOK_KEY));
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function saveGuestbook(entries) {
    try {
        localStorage.setItem(GUESTBOOK_KEY, JSON.stringify(entries));
    } catch (e) {
        showToast('浏览器存储不可用，留言未能保存');
    }
}

function formatGuestTime(date) {
    const p = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
}

function renderGuestbook() {
    const entries = loadGuestbook();
    guestbookList.innerHTML = '';
    if (entries.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'guestbook-empty';
        empty.textContent = '还没有留言，来留下第一条吧。';
        guestbookList.appendChild(empty);
        return;
    }

    // 最新的留言排在最前
    const frag = document.createDocumentFragment();
    entries.slice().reverse().forEach((entry) => {
        const li = document.createElement('li');
        li.className = 'guest-item';

        const head = document.createElement('div');
        head.className = 'guest-item-head';

        const name = document.createElement('span');
        name.className = 'guest-item-name';
        name.textContent = entry.name || '匿名访客';

        const time = document.createElement('span');
        time.className = 'guest-item-time';
        time.textContent = entry.time;

        head.appendChild(name);
        head.appendChild(time);

        const text = document.createElement('p');
        text.className = 'guest-item-text';
        text.textContent = entry.text;

        li.appendChild(head);
        li.appendChild(text);
        frag.appendChild(li);
    });
    guestbookList.appendChild(frag);
}

guestbookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = guestTextInput.value.trim();
    if (!text) {
        showToast('留言内容不能为空');
        return;
    }

    const entries = loadGuestbook();
    entries.push({
        name: guestNameInput.value.trim(),
        text,
        time: formatGuestTime(new Date())
    });
    saveGuestbook(entries);

    guestTextInput.value = '';
    guestNameInput.value = '';
    renderGuestbook();
    showToast('留言已记录');
});
