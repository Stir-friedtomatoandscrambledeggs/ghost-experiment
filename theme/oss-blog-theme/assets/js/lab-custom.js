/* ============================================================
   oss-blog-theme 二次开发交互脚本
   1) “/” 或 Ctrl/⌘+K 打开站内搜索（输入框聚焦除外）
   2) 搜索弹窗出现后自动聚焦输入框（键盘可直接输入）
   原生搜索弹窗仍由 Ghost(sodo-search) 提供，本文件只增强入口与可达性
   ============================================================ */
(function () {
    'use strict';

    function focusSearchInput() {
        var el = document.querySelector(
            '.sodo-search-root input, .sodo-search input, input[type="search"]'
        );
        if (el) { el.focus(); }
    }

    function openSearch() {
        var btn = document.querySelector('[data-ghost-search]');
        if (btn) {
            btn.click();
            setTimeout(focusSearchInput, 80);
        }
    }

    document.addEventListener('keydown', function (e) {
        var t = e.target;
        var tag = (t && t.tagName || '').toLowerCase();
        var typing = tag === 'input' || tag === 'textarea' || (t && t.isContentEditable);
        var slash = e.key === '/';
        var ctrlK = (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K');
        if (!typing && (slash || ctrlK)) {
            e.preventDefault();
            openSearch();
        }
    });

    // 无论用哪种方式打开弹窗，都自动把焦点放进输入框，保证纯键盘可用
    var observer = new MutationObserver(function () {
        if (document.querySelector('.sodo-search-root')) {
            focusSearchInput();
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
