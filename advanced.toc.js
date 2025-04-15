// script.js - ब्लॉगर TOC के लिए GitHub होस्टेड JS (सिलेक्टर अपडेटेड)

document.addEventListener('DOMContentLoaded', () => {
    // --- तत्व चयन ---
    const tocButtonWrapper = document.getElementById('toc-button-wrapper');
    const tocButtonHeader = document.getElementById('toc-button-header');
    const tocButtonScrollbox = document.getElementById('toc-button-scrollbox');
    const tocButtonList = document.getElementById('toc-button-list');
    const buttonScrollIndicator = document.getElementById('button-scroll-indicator');
    const floatingTocIcon = document.getElementById('floating-toc-icon');
    const tocSidebar = document.getElementById('toc-icon-sidebar');
    const tocSidebarInternalClose = document.getElementById('toc-sidebar-internal-close');
    const tocSidebarExternalClose = document.getElementById('toc-sidebar-external-close');
    const tocSidebarList = document.getElementById('toc-icon-sidebar-list');
    const tocSidebarScrollbox = document.getElementById('toc-icon-sidebar-scrollbox');
    const sidebarScrollIndicator = document.getElementById('sidebar-scroll-indicator');

    // *** बदला हुआ पोस्ट कंटेंट एरिया सेलेक्टर ***
    // आपके ब्लॉग (kaalpath.blogspot.com) के लिए अनुशंसित सेलेक्टर
    const postContentArea = document.querySelector('.post-body.entry-content')
                           || document.querySelector("div[itemprop='articleBody']") // एक और सामान्य विकल्प
                           || document.body; // अंतिम फॉलबैक

    // यदि कंटेंट एरिया नहीं मिला तो चेतावनी दें
    if (!postContentArea || postContentArea === document.body || !postContentArea.classList.contains('post-body')) {
         console.warn("TOC Script Warning: Could not reliably identify the main post content area using '.post-body.entry-content'. TOC might not work correctly or might include unwanted headings. Check if the selector is correct for your theme or consider adding id='post-content-area' manually.");
         // यदि body ही मिला है, तो शायद रुक जाना बेहतर है
         if (postContentArea === document.body) {
             if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
             if (floatingTocIcon) floatingTocIcon.style.display = 'none';
             return; // स्क्रिप्ट को आगे चलने से रोकें
         }
    }

    // --- ग्लोबल वेरिएबल्स (अपरिवर्तित) ---
    let currentlyHighlightedElements = [];
    let highlightTimeout = null;
    let tocButtonObserver = null;
    const headingIcons = { 2: 'fas fa-layer-group', 3: 'fas fa-stream', 4: 'fas fa-circle-dot', 5: 'fas fa-minus', 6: 'fas fa-chevron-right' };

    // --- TOC जेनरेशन (अपरिवर्तित) ---
    function generateToc() {
        if (!tocButtonList || !tocSidebarList || !postContentArea || !tocButtonWrapper) {
            console.warn("TOC Generation Error: Required elements not found during generation.");
            if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
            if (floatingTocIcon) floatingTocIcon.style.display = 'none';
            return;
        }
        const headings = postContentArea.querySelectorAll('h2, h3, h4, h5, h6');
        let hasHeadings = false;
        const fragmentButton = document.createDocumentFragment();
        const fragmentSidebar = document.createDocumentFragment();
        headings.forEach((heading) => {
            const headingText = (heading.textContent || heading.innerText || '').trim();
            if (!headingText) { return; }
            hasHeadings = true; let id = heading.id;
            if (!id) {
                id = 'toc_' + headingText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                if (!id || id === 'toc_') { id = 'toc-heading-' + Math.random().toString(36).substring(2, 7); }
                let counter = 1; let originalId = id;
                while (document.getElementById(id)) { id = `${originalId}-${counter}`; counter++; }
                heading.id = id;
            }
            const level = parseInt(heading.tagName.substring(1)); const linkText = headingText; const iconClass = headingIcons[level] || 'fas fa-circle';
            [fragmentButton, fragmentSidebar].forEach(fragment => {
                const listItem = document.createElement('li'); listItem.classList.add('toc-list-item', `level-${level}`);
                const link = document.createElement('a'); link.href = `#${id}`; link.dataset.targetId = id;
                const iconSpan = document.createElement('span'); iconSpan.className = 'toc-item-icon'; iconSpan.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
                const textSpan = document.createElement('span'); textSpan.className = 'toc-item-text'; textSpan.textContent = linkText;
                link.appendChild(iconSpan); link.appendChild(textSpan); listItem.appendChild(link); fragment.appendChild(listItem);
            });
        });
        tocButtonList.innerHTML = ''; tocSidebarList.innerHTML = '';
        tocButtonList.appendChild(fragmentButton); tocSidebarList.appendChild(fragmentSidebar);
        if (!hasHeadings) {
            console.log("No valid headings found for TOC.");
            if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
            if (floatingTocIcon) floatingTocIcon.style.display = 'none';
        } else {
            checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
            checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
            setupTocButtonObserver();
            setInitialButtonTocState();
        }
    }

    // --- बटन TOC टॉगल लॉजिक (अपरिवर्तित) ---
    function toggleButtonToc() { if (!tocButtonWrapper || !tocButtonHeader) return; const isCollapsed = tocButtonWrapper.classList.toggle('collapsed'); tocButtonWrapper.classList.toggle('expanded', !isCollapsed); tocButtonHeader.setAttribute('aria-expanded', String(!isCollapsed)); tocButtonHeader.focus(); checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator); }
    function setInitialButtonTocState() { if (!tocButtonWrapper || !tocButtonHeader) return; tocButtonWrapper.classList.add('collapsed'); tocButtonWrapper.classList.remove('expanded'); tocButtonHeader.setAttribute('aria-expanded', 'false'); checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator); }

    // --- फ्लोटिंग आइकन दृश्यता ऑब्जर्वर (अपरिवर्तित) ---
    function setupTocButtonObserver() {
        if (!('IntersectionObserver' in window) || !tocButtonWrapper || !floatingTocIcon) {
            console.warn("IntersectionObserver not supported or required elements not found for observer.");
            return;
        }
        if (tocButtonObserver) { tocButtonObserver.disconnect(); }
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0 };
        tocButtonObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => { floatingTocIcon.classList.toggle('visible', !entry.isIntersecting); });
        }, observerOptions);
        tocButtonObserver.observe(tocButtonWrapper);
    }

    // --- साइडबार खोलें/बंद करें (अपरिवर्तित) ---
    function openSidebar() { if (!tocSidebar) return; tocSidebar.classList.add('visible'); tocSidebar.setAttribute('aria-hidden', 'false'); document.body.classList.add('toc-sidebar-open'); tocSidebarExternalClose?.classList.add('visible'); setTimeout(() => tocSidebarInternalClose?.focus(), 50); setTimeout(() => { document.addEventListener('click', handleOutsideSidebarClick, { capture: true, once: false }); }, 100); }
    function closeSidebar() { if (!tocSidebar) return; tocSidebar.classList.remove('visible'); tocSidebar.setAttribute('aria-hidden', 'true'); document.body.classList.remove('toc-sidebar-open'); tocSidebarExternalClose?.classList.remove('visible'); document.removeEventListener('click', handleOutsideSidebarClick, { capture: true }); floatingTocIcon?.focus(); }
    function handleOutsideSidebarClick(event) { if (tocSidebar?.classList.contains('visible') && !tocSidebar.contains(event.target) && event.target !== floatingTocIcon && !floatingTocIcon?.contains(event.target) && event.target !== tocSidebarExternalClose && !tocSidebarExternalClose?.contains(event.target)) { closeSidebar(); } }

    // --- Esc कुंजी से बंद करें (अपरिवर्तित) ---
    function handleEscKey(event) { if (event.key === 'Escape' || event.key === 'Esc') { if (tocSidebar?.classList.contains('visible')) { closeSidebar(); } } }

    // --- TOC लिंक क्लिक हैंडलर (अपरिवर्तित) ---
    function handleTocLinkClick(event) {
        const linkElement = event.target.closest('a');
        if (!linkElement || !linkElement.dataset.targetId) return;
        event.preventDefault();
        const targetId = linkElement.dataset.targetId;
        const targetElement = document.getElementById(targetId);
        linkElement.classList.add('toc-link-clicked');
        setTimeout(() => { linkElement.classList.remove('toc-link-clicked'); }, 400);
        if (targetElement) {
            if (tocSidebar?.classList.contains('visible')) { setTimeout(closeSidebar, 100); }
            const targetOffsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
            const headerOffset = 70; // Adjust this based on your sticky header height, if any
            const offsetPosition = targetOffsetTop - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            applyHighlight(targetElement);
        } else { console.warn(`TOC link target element with ID "${targetId}" not found.`); }
    }

    // --- हाइलाइटिंग लॉजिक (अपरिवर्तित) ---
    function applyHighlight(headingElement) { clearHighlight(); headingElement.classList.add('toc-target-heading'); currentlyHighlightedElements.push(headingElement); let nextElem = headingElement.nextElementSibling; const headingLevel = parseInt(headingElement.tagName.substring(1)); while (nextElem) { const nl = nextElem.tagName.match(/^H([2-6])$/); if (nl && parseInt(nl[1]) <= headingLevel) break; if (['P', 'UL', 'OL', 'DIV', 'BLOCKQUOTE', 'FIGURE', 'TABLE'].includes(nextElem.tagName)) { nextElem.classList.add('toc-target-paragraph'); currentlyHighlightedElements.push(nextElem); } nextElem = nextElem.nextElementSibling; } const d = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toc-popup-highlight-duration')) || 6) * 1000; highlightTimeout = setTimeout(() => { currentlyHighlightedElements.forEach(el => { el.classList.add('fading-out'); setTimeout(() => { el.classList.remove('toc-target-heading', 'toc-target-paragraph', 'fading-out'); }, 500); }); currentlyHighlightedElements = []; }, d); }
    function clearHighlight() { if (highlightTimeout) clearTimeout(highlightTimeout); highlightTimeout = null; currentlyHighlightedElements.forEach(el => { el.classList.remove('toc-target-heading', 'toc-target-paragraph', 'fading-out'); }); currentlyHighlightedElements = []; }

    // --- स्क्रॉल इंडिकेटर दृश्यता (अपरिवर्तित) ---
    function checkScrollIndicatorVisibility(scrollbox, indicator) {
        if (!scrollbox || !indicator) return;
        let isVisible = indicator.classList.contains('visible');
        const check = () => {
            if (scrollbox === tocButtonScrollbox && tocButtonWrapper?.classList.contains('collapsed')) { if (isVisible) { indicator.classList.remove('visible'); isVisible = false; } return; }
            const isScrollable = scrollbox.scrollHeight > scrollbox.clientHeight + 2; const isAtTop = scrollbox.scrollTop < 10; const shouldBeVisible = isScrollable && isAtTop;
            if (shouldBeVisible && !isVisible) { indicator.classList.add('visible'); isVisible = true; }
            else if (!shouldBeVisible && isVisible) { indicator.classList.remove('visible'); isVisible = false; }
        };
        requestAnimationFrame(() => setTimeout(check, 150));
        scrollbox.addEventListener('scroll', check, { passive: true });
        if (scrollbox === tocButtonScrollbox && tocButtonHeader) { tocButtonHeader.addEventListener('click', () => setTimeout(check, 550)); }
        let resizeTimeout; window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(check, 200); }, { passive: true });
    }

    // --- इवेंट लिस्नर जोड़ें ---
    function addEventListeners() {
        if (tocButtonHeader) { tocButtonHeader.addEventListener('click', toggleButtonToc); tocButtonHeader.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleButtonToc(); } }); }
        if (floatingTocIcon) { floatingTocIcon.addEventListener('click', (e) => { e.stopPropagation(); openSidebar(); }); }
        if (tocSidebarInternalClose) { tocSidebarInternalClose.addEventListener('click', closeSidebar); }
        if (tocSidebarExternalClose) { tocSidebarExternalClose.addEventListener('click', closeSidebar); }
        document.addEventListener('keydown', handleEscKey);
        if (tocButtonList) { tocButtonList.addEventListener('click', handleTocLinkClick); }
        if (tocSidebarList) { tocSidebarList.addEventListener('click', handleTocLinkClick); }
    }

    // --- इनिशियलाइज़ेशन ---
    // DOM तैयार होने के बाद ही चलाएं
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize(); // DOM पहले से ही तैयार है
    }

    function initialize() {
        generateToc(); // TOC बनाएं
        addEventListeners(); // इवेंट लिस्नर जोड़ें
    }

}); // DOMContentLoaded End Wrapper
