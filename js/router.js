/**
 * ==========================================================
 * VĂN ĐẠO - ROUTER MODULE (js/router.js)
 * Chức năng: Quản lý chuyển trang (ViewManager), lưu vị trí cuộn,
 * xử lý hiệu ứng Dải lụa, và hệ thống Định tuyến sâu (Deep Navigation).
 * ==========================================================
 */

// 1. IMPORT CÁC HÀM VÀ BIẾN CẦN THIẾT
import { STATE, ENCY_ITEMS_PER_PAGE } from './config.js';
import { normalizeRouteText, normalizeRouteId, normalizeRouteGroup, getRecordTitleAlias, removeAccents } from './utils.js';
import { renderEncyclopedia, sortEncyData, renderHeritage } from './render.js';

/* =====================================================================
   PHẦN 1: VIEW MANAGER (QUẢN LÝ CHUYỂN TRANG)
   ===================================================================== */
const scrollPositions = { home: 0, heritage: 0, encyclopedia: 0, analyze: 0 };
let switchToken = 0;
const wait = ms => new Promise(r => setTimeout(r, ms));

// Hàm dọn dẹp khi rời khỏi một View
export function unloadView(viewId) {
    if (viewId !== 'encyclopedia') return;
    const container = document.getElementById('encyclopedia-container');
    if (!container) return;
    // Đóng tất cả các accordion đang mở để giải phóng bộ nhớ (DOM)
    container.querySelectorAll('details[open]').forEach(details => {
        details.open = false;
        const content = details.querySelector('.accordion-content');
        if (content) { content.replaceChildren(); delete content.dataset.contentLoaded; }
    });
}

// Hàm chuyển đổi qua lại giữa các View (Home, Văn Hiến, Bách Khoa, Thi Pháp)
export async function switchView(viewId) {
    const targetView = document.getElementById(`view-${viewId}`);
    if (!targetView) return false;
    
    const token = ++switchToken;
    const activeView = document.querySelector('.view.active');
    const currentViewId = activeView ? activeView.id.replace('view-', '') : null;

    // Nếu đang ở đúng view đó rồi thì chỉ cần render lại dữ liệu (nếu chưa)
    if (currentViewId === viewId) {
        if (viewId === 'heritage') {
            const grid = document.getElementById('heritage-grid');
            if (grid && grid.dataset.rendered !== 'true') {
                grid.dataset.rendered = 'true';
                renderHeritage();
            }
        }
        if (viewId === 'encyclopedia') {
            const container = document.getElementById('encyclopedia-container');
            if (container && !container.dataset.renderedGroup) renderEncyclopedia();
        }
        return true;
    }

    // 1. Lưu lại vị trí cuộn của trang hiện tại trước khi rời đi
    if (currentViewId) {
        scrollPositions[currentViewId] = window.scrollY;
        unloadView(currentViewId);
    }

    // 2. Kích hoạt hiệu ứng Dải lụa (Silk Transition)
    const silkOverlay = document.getElementById('silkTransition');
    if (silkOverlay) {
        silkOverlay.classList.remove('entering', 'leaving', 'active');
        void silkOverlay.offsetWidth; // Ép trình duyệt reflow để nhận animation mới
        silkOverlay.classList.add('active', 'entering');
        await wait(300); // Đợi dải lụa quét qua
        if (token !== switchToken) return false; // Hủy nếu người dùng bấm quá nhanh
    }

    // 3. Ẩn tất cả các view hiện tại
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });

    // 4. Hiển thị view mới
    targetView.classList.add('active');
    const targetNav = document.getElementById(`nav-${viewId}`);
    if (targetNav) { targetNav.classList.add('active'); targetNav.setAttribute('aria-current', 'page'); }

    // Đóng menu mobile nếu đang mở
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('show');

    // 5. Render dữ liệu cho View mới (nếu chưa render)
    if (viewId === 'heritage') {
        const grid = document.getElementById('heritage-grid');
        if (grid && grid.dataset.rendered !== 'true') {
            grid.dataset.rendered = 'true';
            renderHeritage();
        }
    }
    if (viewId === 'encyclopedia') {
        const container = document.getElementById('encyclopedia-container');
        if (container && !container.dataset.renderedGroup) renderEncyclopedia();
    }

    // 6. Tắt hiệu ứng dải lụa
    if (silkOverlay) silkOverlay.classList.remove('active', 'entering');

    await new Promise(requestAnimationFrame);
    if (token !== switchToken) return false;

    // 7. Khôi phục vị trí cuộn (nếu quay lại trang cũ)
    window.scrollTo({ top: scrollPositions[viewId] || 0, behavior: 'instant' });
    return true;
}

// Hàm bật/tắt menu trên Mobile
export function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const btn = document.querySelector('.mobile-menu-btn');
    if (!navMenu) return;
    const nowOpen = navMenu.classList.toggle('show');
    if (btn) btn.setAttribute('aria-expanded', String(nowOpen));
}


/* =====================================================================
   PHẦN 2: ĐỊNH TUYẾN SÂU (DEEP NAVIGATION ROUTER)
   Dùng để nhảy thẳng tới một tác phẩm/lý thuyết từ Bói Thơ hoặc Tìm Kiếm
   ===================================================================== */
let encyclopediaNavigationToken = 0;
let lastHighlightedTarget = null;
const highlightTimers = new WeakMap();

// Hàm nhận hàm cancel từ main.js (Dùng để hủy tìm kiếm đang gõ dở)
let cancelPendingEncyclopediaSearch = () => {};
export function setCancelSearch(fn) { cancelPendingEncyclopediaSearch = fn; }

// Hàm trích xuất ID/URL
export function extractRouteLocator(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    try {
        const parsed = new URL(raw, window.location.href);
        if (parsed.hash) return decodeURIComponent(parsed.hash.slice(1));
        for (const name of ['id', 'target', 'item', 'slug', 'key']) {
            const candidate = parsed.searchParams.get(name);
            if (candidate) return candidate;
        }
        if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('/')) {
            const leaf = parsed.pathname.split('/').filter(Boolean).pop();
            return leaf ? decodeURIComponent(leaf.replace(/\.html?$/i, '')) : raw;
        }
    } catch (_) { /* Do nothing */ }
    return raw.replace(/^#/, '');
}

// Hàm phân tích Input để tìm ra Record (bài thơ/tác giả) chính xác
export function resolveEncyclopediaTarget(input) {
    if (!STATE.GLOBAL_RECORDS.length) return { ok: false, reason: 'not-ready' };

    const options = (input && typeof input === 'object') ? input : { query: input };
    let explicitGroup = normalizeRouteGroup(options.group || options.type || options.category);
    const rawKey = String(options.key || '').trim();
    let keyLocator = '';
    
    if (rawKey.includes(':')) {
        const sep = rawKey.indexOf(':');
        const keyGroup = normalizeRouteGroup(rawKey.slice(0, sep));
        if (keyGroup) { explicitGroup = explicitGroup || keyGroup; keyLocator = rawKey.slice(sep + 1); }
    }
    
    const suppliedId = extractRouteLocator(options.id || options.itemId || options.targetId || options.slug || options.anchor || options.hash || options.href || keyLocator || rawKey);
    const suppliedTitle = options.title || options.name || '';
    const suppliedAuthor = options.author || '';
    const suppliedVolume = options.volume || options.roman || '';
    const queryText = String(options.query || options.value || suppliedTitle || suppliedId || suppliedVolume || '').trim();
    const queryNorm = normalizeRouteText(queryText);
    const idNorm = normalizeRouteId(suppliedId || queryText);
    const titleNorm = normalizeRouteText(suppliedTitle || queryText);
    const authorNorm = normalizeRouteText(suppliedAuthor);

    let records = explicitGroup ? STATE.GLOBAL_RECORDS.filter(r => r.group === explicitGroup) : STATE.GLOBAL_RECORDS.slice();
    if (!records.length) return { ok: false, reason: 'group-empty' };

    // 1. Khớp chính xác cả Tác giả và Tác phẩm
    if (authorNorm && titleNorm) {
        const paired = records.filter(r => r.group === 'tinh-hoa' && normalizeRouteText(r.data.author) === authorNorm && normalizeRouteText(r.data.title) === titleNorm);
        if (paired.length === 1) return { ok: true, record: paired[0] };
        if (paired.length > 1) return { ok: false, reason: 'ambiguous', candidates: paired };
    }

    // 2. Khớp ID
    if (idNorm) {
        const exactId = records.filter(r => normalizeRouteId(r.id) === idNorm);
        if (exactId.length === 1) return { ok: true, record: exactId[0] };
        if (exactId.length > 1) return { ok: false, reason: 'ambiguous', candidates: exactId };
    }

    // 3. Khớp Số Quyển (VD: Quyển 1, Quyển I)
    const volumeText = normalizeRouteText(suppliedVolume || queryText).replace(/^quyen\s+/, '');
    const romanMatch = volumeText.match(/^([ivxlcdm]+|\d+)$/i);
    if (romanMatch && (!explicitGroup || explicitGroup === 'triet-thuyet')) {
        const volumeId = `quyen-${romanMatch[1].toLowerCase()}`;
        const volumeRecord = records.find(r => r.group === 'triet-thuyet' && normalizeRouteId(r.id) === volumeId);
        if (volumeRecord) return { ok: true, record: volumeRecord };
    }

    // 4. Khớp Tiêu đề chính xác
    const cleanQuery = removeAccents(titleNorm);
    const exactTitle = records.filter(r => {
        const itemName = r.data.title || r.data.name || '';
        const names = [itemName, getRecordTitleAlias(r.data, r.group)].filter(Boolean).map(normalizeRouteText);
        return names.includes(titleNorm) || names.map(removeAccents).includes(cleanQuery);
    });
    if (exactTitle.length === 1) return { ok: true, record: exactTitle[0] };
    if (exactTitle.length > 1) return { ok: false, reason: 'ambiguous', candidates: exactTitle };

    // 5. Khớp Hồ sơ tác giả
    const exactAuthorProfiles = records.filter(r => r.group === 'ky-tai' && normalizeRouteText(getRecordTitleAlias(r.data, r.group)) === queryNorm);
    if (exactAuthorProfiles.length === 1) return { ok: true, record: exactAuthorProfiles[0] };
    if (exactAuthorProfiles.length > 1) return { ok: false, reason: 'ambiguous', candidates: exactAuthorProfiles };

    // 6. Khớp Mờ (Tìm gần đúng)
    if (queryNorm.length >= 4) {
        const partial = records.filter(r => {
            const itemName = r.data.title || r.data.name || '';
            return normalizeRouteText(itemName).includes(queryNorm) ||
                   removeAccents(normalizeRouteText(itemName)).includes(cleanQuery) ||
                   normalizeRouteText(r.data.author).includes(queryNorm);
        });
        if (partial.length === 1) return { ok: true, record: partial[0] };
        if (partial.length > 1) return { ok: false, reason: 'ambiguous', candidates: partial };
    }

    return { ok: false, reason: 'not-found' };
}

// Hàm chính: Nhảy tới một mục trong Bách Khoa
export async function gotoEncyclopediaById(query) {
    const resolved = resolveEncyclopediaTarget(query);
    if (!resolved.ok) {
        const queryLabel = typeof query === 'object' ? (query.title || query.name || query.id || query.query || 'đích đến') : String(query ?? '');
        const message = resolved.reason === 'ambiguous'
            ? `Có nhiều mục gần khớp với “${queryLabel}”. Hãy truyền thêm nhóm hoặc tác giả.`
            : `Chưa tìm thấy mục “${queryLabel}” trong Bách Khoa.`;
        console.warn('[ROUTER]', message, resolved.candidates || '');
        const status = document.getElementById('encyclopedia-count');
        if (status) status.textContent = message;
        return { ok: false, reason: resolved.reason, candidates: resolved.candidates || [] };
    }

    const record = resolved.record;
    const token = ++encyclopediaNavigationToken;
    
    // Hủy tìm kiếm đang gõ dở (nếu có)
    cancelPendingEncyclopediaSearch();
    const searchInput = document.getElementById('encyclopedia-search');
    if (searchInput) searchInput.value = '';
    document.getElementById('clear-search-btn')?.classList.remove('show');
    const filterBar = document.getElementById('encyclopedia-filter-bar');
    if (filterBar) filterBar.style.display = 'flex';

    // Chuyển sang view Bách Khoa
    const switched = await switchView('encyclopedia');
    if (!switched || token !== encyclopediaNavigationToken) return { ok: false, reason: 'superseded' };

    const data = getRecordsForGroup(record.group);
    const sorted = sortEncyData(data.slice(), record.group);
    const itemIndex = sorted.findIndex(item => item.id === record.id);
    if (itemIndex < 0) return { ok: false, reason: 'missing-index-record' };
    
    // Tính toán xem mục này nằm ở trang thứ mấy
    const targetPage = Math.floor(itemIndex / ENCY_ITEMS_PER_PAGE) + 1;
    const container = document.getElementById('encyclopedia-container');
    
    // Kiểm tra xem DOM của mục này đã render sẵn chưa (để tái sử dụng)
    const reusableTarget = STATE.currentEncyGroup === record.group && STATE.currentEncyPage === targetPage &&
        container?.dataset.renderedGroup === record.group && container.dataset.searchMode !== 'true'
        ? findEncyclopediaDOMTarget(record) : null;

    if (!reusableTarget) {
        STATE.currentEncyGroup = record.group;
        STATE.currentEncyPage = targetPage;
        renderEncyclopedia();
    }
    updateEncyclopediaActiveFilter(record.group);

    if (!reusableTarget) {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (token !== encyclopediaNavigationToken) return { ok: false, reason: 'superseded' };
    }

    const targetEl = reusableTarget || findEncyclopediaDOMTarget(record);
    if (!targetEl) return { ok: false, reason: 'dom-not-found', record };

    // Xử lý hiển thị nhãn phụ (VD: Mục 1.3 · Thận trọng...)
    const section = query && typeof query === 'object' ? query.section : '';
    targetEl.querySelectorAll('.route-section-hint').forEach(node => node.remove());
    if (section) {
        const sectionTitle = getTheorySectionHeading(record, section);
        const summaryTitle = targetEl.querySelector('.summary-title');
        if (summaryTitle) {
            const hint = document.createElement('span');
            hint.className = 'route-section-hint';
            hint.textContent = `Mục ${section}${sectionTitle ? ` · ${sectionTitle}` : ''}`;
            summaryTitle.appendChild(hint);
        }
    }

    // Hiệu ứng Highlight tỏa sáng
    targetEl.classList.add('is-visible');
    document.querySelectorAll('#encyclopedia-container .accordion-item').forEach(item => {
        item.style.contentVisibility = 'visible';
    });

    if (lastHighlightedTarget && lastHighlightedTarget !== targetEl) {
        lastHighlightedTarget.classList.remove('highlight-target');
        lastHighlightedTarget.querySelectorAll('.route-section-hint').forEach(node => node.remove());
        lastHighlightedTarget.style.contentVisibility = '';
        const oldTimer = highlightTimers.get(lastHighlightedTarget);
        if (oldTimer) clearTimeout(oldTimer);
    }
    
    const targetTimer = highlightTimers.get(targetEl);
    if (targetTimer) clearTimeout(targetTimer);
    targetEl.classList.remove('highlight-target');
    void targetEl.offsetWidth; // Ép reflow để animation chạy lại
    targetEl.classList.add('highlight-target');
    lastHighlightedTarget = targetEl;

    // Cuộn tới mục tiêu
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const targetRect = targetEl.getBoundingClientRect();
    const destinationTop = Math.max(0, window.scrollY + targetRect.top + targetRect.height / 2 - window.innerHeight / 2);
    
    if (reducedMotion) {
        const root = document.documentElement;
        const previousBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollTo({ top: destinationTop, behavior: 'auto' });
        requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
    } else {
        window.scrollTo({ top: destinationTop, behavior: 'smooth' });
    }

    // Tắt hiệu ứng sau 2.8s
    const timer = setTimeout(() => {
        targetEl.classList.remove('highlight-target');
        if (lastHighlightedTarget === targetEl) lastHighlightedTarget = null;
    }, 2800);
    highlightTimers.set(targetEl, timer);

    const status = document.getElementById('encyclopedia-count');
    if (status) {
        const section = query && typeof query === 'object' && query.section ? ` · mục ${query.section}` : '';
        status.textContent = `Đã định vị: ${record.data.title || record.data.name}${section}`;
    }
    return { ok: true, id: record.id, group: record.group, matchedBy: resolved.matchedBy, element: targetEl };
}

// Hàm phụ: Tìm thẻ DOM đích trong container
export function findEncyclopediaDOMTarget(record) {
    const container = document.getElementById('encyclopedia-container');
    if (!container || !record) return null;
    const candidates = container.querySelectorAll('.accordion-item[data-group][data-id], .accordion-item[data-group][data-item-id]');
    for (const element of candidates) {
        const elementId = element.dataset.itemId || element.dataset.id;
        if (element.dataset.group === record.group && elementId === record.id) return element;
    }
    return null;
}

// Hàm phụ: Lấy tiêu đề của mục (VD: "Thận trọng khi sử dụng...")
export function getTheorySectionHeading(record, section) {
    if (!record || record.group !== 'triet-thuyet' || !section || !record.data?.content) return '';
    const wanted = String(section).trim().replace(/\.$/, '');
    const headings = record.data.content.match(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi) || [];
    for (const heading of headings) {
        const plain = heading.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
        const match = plain.match(/^([\d]+(?:\.[\d]+)+)\.?\s*(.*)$/);
        if (match && match[1] === wanted) return match[2].trim();
    }
    return '';
}

// Hàm phụ: Cập nhật trạng thái nút bấm bộ lọc (Active)
export function updateEncyclopediaActiveFilter(group) {
    document.querySelectorAll('#encyclopedia-filter-bar .filter-btn').forEach(button => {
        button.classList.remove('active'); button.setAttribute('aria-pressed', 'false');
    });
    const buttons = document.querySelectorAll('#encyclopedia-filter-bar .filter-btn');
    const index = { 'triet-thuyet': 0, 'ky-tai': 1, 'tinh-hoa': 2 }[group];
    if (index !== undefined && buttons[index]) {
        buttons[index].classList.add('active'); buttons[index].setAttribute('aria-pressed', 'true');
    }
}

// Hàm phụ: Lấy mảng dữ liệu gốc theo nhóm
export function getRecordsForGroup(group) {
    if (group === 'triet-thuyet') return STATE.GLOBAL_RECORDS.filter(r => r.group === 'triet-thuyet').map(r => r.data);
    if (group === 'ky-tai') return STATE.GLOBAL_RECORDS.filter(r => r.group === 'ky-tai').map(r => r.data);
    if (group === 'tinh-hoa') return STATE.GLOBAL_RECORDS.filter(r => r.group === 'tinh-hoa').map(r => r.data);
    if (group === 'the-loai') return STATE.GLOBAL_RECORDS.filter(r => r.group === 'the-loai').map(r => r.data);
    return [];
}
