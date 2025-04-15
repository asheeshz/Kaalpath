document.addEventListener('DOMContentLoaded', () => {
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
    const postContentArea = document.getElementById('post-content-area');
    let currentlyHighlightedElements = [];
    let highlightTimeout = null;
    let tocButtonObserver = null;
    const headingIcons = { 2: 'fas fa-layer-group', 3: 'fas fa-stream', 4: 'fas fa-circle-dot', 5: 'fas fa-minus', 6: 'fas fa-chevron-right' };
    if (tocButtonList && tocSidebarList && postContentArea && tocButtonWrapper) {
        const headings = postContentArea.querySelectorAll('h2, h3, h4, h5, h6');
        let hasHeadings = false;
        const fragmentButton = document.createDocumentFragment();
        const fragmentSidebar = document.createDocumentFragment();
        headings.forEach((heading) => {
            hasHeadings = true; let id = heading.id;
            if (!id) { id = 'toc_' + (heading.textContent || 'heading').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); let counter = 1; let originalId = id; while (document.getElementById(id)) { id = `${originalId}-${counter}`; counter++; } heading.id = id; }
            const level = parseInt(heading.tagName.substring(1)); const linkText = heading.textContent || 'Untitled Heading'; const iconClass = headingIcons[level] || 'fas fa-circle';
            [fragmentButton, fragmentSidebar].forEach(fragment => {
                const listItem = document.createElement('li'); listItem.classList.add('toc-list-item', `level-${level}`);
                const link = document.createElement('a'); link.href = `#${id}`; link.dataset.targetId = id;
                const iconSpan = document.createElement('span'); iconSpan.className = 'toc-item-icon'; iconSpan.innerHTML = `<i class="${iconClass}"></i>`;
                const textSpan = document.createElement('span'); textSpan.className = 'toc-item-text'; textSpan.textContent = linkText;
                link.appendChild(iconSpan); link.appendChild(textSpan); listItem.appendChild(link); fragment.appendChild(listItem);
            });
        });
        tocButtonList.appendChild(fragmentButton); tocSidebarList.appendChild(fragmentSidebar);
        if (!hasHeadings) { tocButtonWrapper.style.display = 'none'; floatingTocIcon.style.display = 'none'; }
        else { checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator); checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator); setupTocButtonObserver(); setInitialButtonTocState(); }
    } else { console.warn("Required TOC elements or Post Content Area not found."); if(tocButtonWrapper) tocButtonWrapper.style.display = 'none'; if(floatingTocIcon) floatingTocIcon.style.display = 'none'; }
    function toggleButtonToc() { if (!tocButtonWrapper || !tocButtonHeader) return; const isCollapsed = tocButtonWrapper.classList.toggle('collapsed'); tocButtonWrapper.classList.toggle('expanded', !isCollapsed); tocButtonHeader.setAttribute('aria-expanded', !isCollapsed); tocButtonHeader.focus(); if (!isCollapsed) { checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator); } }
    function setInitialButtonTocState() { tocButtonWrapper.classList.add('collapsed'); tocButtonWrapper.classList.remove('expanded'); tocButtonHeader.setAttribute('aria-expanded', 'false'); checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator); }
    if (tocButtonHeader) { tocButtonHeader.addEventListener('click', toggleButtonToc); tocButtonHeader.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleButtonToc(); } }); }
    function setupTocButtonObserver() { if (!('IntersectionObserver' in window) || !tocButtonWrapper || !floatingTocIcon) { console.warn("IntersectionObserver not supported or TOC button wrapper not found."); return; } const observerOptions = { root: null, rootMargin: '0px', threshold: 0 }; tocButtonObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (!entry.isIntersecting) { floatingTocIcon.classList.add('visible'); } else { floatingTocIcon.classList.remove('visible'); } }); }, observerOptions); tocButtonObserver.observe(tocButtonWrapper); }
    function openSidebar() { if (!tocSidebar) return; tocSidebar.classList.add('visible'); tocSidebar.setAttribute('aria-hidden', 'false'); document.body.classList.add('toc-sidebar-open'); tocSidebarExternalClose?.classList.add('visible'); setTimeout(() => tocSidebarInternalClose?.focus(), 50); setTimeout(() => { document.addEventListener('click', handleOutsideSidebarClick, true); }, 100); }
    function closeSidebar() { if (!tocSidebar) return; tocSidebar.classList.remove('visible'); tocSidebar.setAttribute('aria-hidden', 'true'); document.body.classList.remove('toc-sidebar-open'); tocSidebarExternalClose?.classList.remove('visible'); document.removeEventListener('click', handleOutsideSidebarClick, true); floatingTocIcon?.focus(); }
    function handleOutsideSidebarClick(event) { if (tocSidebar?.classList.contains('visible') && !tocSidebar.contains(event.target) && event.target !== floatingTocIcon && event.target !== tocSidebarExternalClose && !tocSidebarExternalClose?.contains(event.target)) { closeSidebar(); } }
    if (floatingTocIcon) { floatingTocIcon.addEventListener('click', (e) => { e.stopPropagation(); openSidebar(); }); }
    if (tocSidebarInternalClose) { tocSidebarInternalClose.addEventListener('click', closeSidebar); } if (tocSidebarExternalClose) { tocSidebarExternalClose.addEventListener('click', closeSidebar); }
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (tocSidebar?.classList.contains('visible')) closeSidebar(); } });
    function handleTocLinkClick(event) { const linkElement = event.target.closest('a'); if (linkElement && linkElement.dataset.targetId) { event.preventDefault(); const targetId = linkElement.dataset.targetId; const targetElement = document.getElementById(targetId); linkElement.classList.add('toc-link-clicked'); setTimeout(() => { linkElement.classList.remove('toc-link-clicked'); }, 400); if (targetElement) { setTimeout(() => { if (tocSidebar?.classList.contains('visible')) { closeSidebar(); } }, 100); const offsetTop = targetElement.offsetTop - 70; window.scrollTo({ top: offsetTop, behavior: 'smooth' }); applyHighlight(targetElement); } } }
    if (tocButtonList) tocButtonList.addEventListener('click', handleTocLinkClick); if (tocSidebarList) tocSidebarList.addEventListener('click', handleTocLinkClick);
    function applyHighlight(headingElement) { clearHighlight(); headingElement.classList.add('toc-target-heading'); currentlyHighlightedElements.push(headingElement); let nextElem = headingElement.nextElementSibling; const headingLevel = parseInt(headingElement.tagName.substring(1)); while (nextElem) { const nl = nextElem.tagName.match(/^H([2-6])$/); if (nl && parseInt(nl[1]) <= headingLevel) break; if (['P', 'UL', 'OL', 'DIV', 'BLOCKQUOTE'].includes(nextElem.tagName)) { nextElem.classList.add('toc-target-paragraph'); currentlyHighlightedElements.push(nextElem); } nextElem = nextElem.nextElementSibling; } const d = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toc-popup-highlight-duration')) || 6) * 1000; highlightTimeout = setTimeout(() => { currentlyHighlightedElements.forEach(el => { el.classList.add('fading-out'); setTimeout(() => { el.classList.remove('toc-target-heading', 'toc-target-paragraph', 'fading-out'); }, 500); }); currentlyHighlightedElements = []; }, d); }
    function clearHighlight() { if (highlightTimeout) clearTimeout(highlightTimeout); highlightTimeout = null; currentlyHighlightedElements.forEach(el => { el.classList.remove('toc-target-heading', 'toc-target-paragraph', 'fading-out'); }); currentlyHighlightedElements = []; }
    function checkScrollIndicatorVisibility(scrollbox, indicator) { if (!scrollbox || !indicator) return; let isVisible = false; function check() { if (scrollbox === tocButtonScrollbox && tocButtonWrapper?.classList.contains('collapsed')) { if (isVisible) { indicator.classList.remove('visible'); isVisible = false; } return; } const isScrollable = scrollbox.scrollHeight > scrollbox.clientHeight + 2; const isAtTop = scrollbox.scrollTop < 10; const shouldBeVisible = isScrollable && isAtTop; if (shouldBeVisible && !isVisible) { indicator.classList.add('visible'); isVisible = true; } else if (!shouldBeVisible && isVisible) { indicator.classList.remove('visible'); isVisible = false; } } setTimeout(check, 200); scrollbox.addEventListener('scroll', check, { passive: true }); if (scrollbox === tocButtonScrollbox && tocButtonHeader) { tocButtonHeader.addEventListener('click', () => setTimeout(check, 550)); } }
});
