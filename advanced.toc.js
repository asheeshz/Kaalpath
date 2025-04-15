// फ़ाइल की शुरुआत (जैसे advanced-toc.js)

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
    const postContentArea = document.getElementById('post-content-area'); // Changed this to select by ID
    let currentlyHighlightedElements = [];
    let highlightTimeout = null;
    let tocButtonObserver = null;
    const headingIcons = { 2: 'fas fa-layer-group', 3: 'fas fa-stream', 4: 'fas fa-circle-dot', 5: 'fas fa-minus', 6: 'fas fa-chevron-right' };

    // Try to find post content area by ID first, then fallback to class
    const contentArea = postContentArea || document.querySelector('.post-body'); // Fallback if ID not found

    if (tocButtonList && tocSidebarList && contentArea && tocButtonWrapper) {
        const headings = contentArea.querySelectorAll('h2, h3, h4, h5, h6');
        let hasHeadings = false;
        const fragmentButton = document.createDocumentFragment();
        const fragmentSidebar = document.createDocumentFragment();

        headings.forEach((heading) => {
             // Ignore headings inside the TOC itself (if any were accidentally nested)
             if (heading.closest('#toc-button-wrapper') || heading.closest('#toc-icon-sidebar')) {
                return;
             }

            hasHeadings = true;
            let id = heading.id;
            if (!id) {
                id = 'toc_' + (heading.textContent || 'heading').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                let counter = 1;
                let originalId = id;
                while (document.getElementById(id)) {
                    id = `${originalId}-${counter}`;
                    counter++;
                }
                heading.id = id;
            }

            const level = parseInt(heading.tagName.substring(1));
            const linkText = heading.textContent || 'Untitled Heading';
            const iconClass = headingIcons[level] || 'fas fa-circle';

            [fragmentButton, fragmentSidebar].forEach(fragment => {
                const listItem = document.createElement('li');
                listItem.classList.add('toc-list-item', `level-${level}`);
                const link = document.createElement('a');
                link.href = `#${id}`;
                link.dataset.targetId = id; // Use dataset for cleaner access

                const iconSpan = document.createElement('span');
                iconSpan.className = 'toc-item-icon';
                iconSpan.innerHTML = `<i class="${iconClass}"></i>`;

                const textSpan = document.createElement('span');
                textSpan.className = 'toc-item-text';
                textSpan.textContent = linkText;

                link.appendChild(iconSpan);
                link.appendChild(textSpan);
                listItem.appendChild(link);
                fragment.appendChild(listItem);
            });
        });

        tocButtonList.appendChild(fragmentButton);
        tocSidebarList.appendChild(fragmentSidebar);

        if (!hasHeadings) {
            tocButtonWrapper.style.display = 'none';
            floatingTocIcon.style.display = 'none';
        } else {
            checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
            checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
            setupTocButtonObserver();
            setInitialButtonTocState();
        }

    } else {
        console.warn("TOC Warning: Required elements (#toc-button-list, #toc-icon-sidebar-list, #post-content-area or .post-body) not found.");
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
    }

    // --- Event Handlers & Functions ---

    function toggleButtonToc() {
         if (!tocButtonWrapper || !tocButtonHeader) return;
         const isCollapsed = tocButtonWrapper.classList.toggle('collapsed');
         tocButtonWrapper.classList.toggle('expanded', !isCollapsed);
         tocButtonHeader.setAttribute('aria-expanded', String(!isCollapsed)); // Use String() for attribute
         tocButtonHeader.focus();
         if (!isCollapsed) { // Only check when expanding
             checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
         }
     }

     function setInitialButtonTocState() {
         if (!tocButtonWrapper || !tocButtonHeader) return;
         tocButtonWrapper.classList.add('collapsed');
         tocButtonWrapper.classList.remove('expanded');
         tocButtonHeader.setAttribute('aria-expanded', 'false');
         // Check indicator visibility after setting initial state (might be scrollable even when collapsed initially if content loads slow)
         setTimeout(() => checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator), 100);
     }


    if (tocButtonHeader) {
        tocButtonHeader.addEventListener('click', toggleButtonToc);
        tocButtonHeader.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleButtonToc();
            }
        });
    }


    function setupTocButtonObserver() {
        if (!('IntersectionObserver' in window) || !tocButtonWrapper || !floatingTocIcon) {
            console.warn("IntersectionObserver not supported or TOC button wrapper/floating icon not found.");
            // Optionally make the floating icon always visible if observer fails and button exists
            // if (tocButtonWrapper && floatingTocIcon) floatingTocIcon.classList.add('visible');
            return;
        }

        const observerOptions = {
            root: null, // relative to viewport
            rootMargin: '0px',
            threshold: 0 // as soon as 1px is out of view
        };

        tocButtonObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Show floating icon when button TOC is NOT intersecting (out of view)
                if (!entry.isIntersecting) {
                    floatingTocIcon.classList.add('visible');
                } else {
                    floatingTocIcon.classList.remove('visible');
                    // If sidebar is open and button comes back into view, maybe close sidebar? (Optional UX choice)
                    // if (tocSidebar?.classList.contains('visible')) { closeSidebar(); }
                }
            });
        }, observerOptions);

        tocButtonObserver.observe(tocButtonWrapper);
    }


    function openSidebar() {
        if (!tocSidebar || !document.body) return;
        tocSidebar.classList.add('visible');
        tocSidebar.setAttribute('aria-hidden', 'false');
        document.body.classList.add('toc-sidebar-open'); // For potential body-level styling adjustments
        tocSidebarExternalClose?.classList.add('visible');
         // Focus the internal close button shortly after opening for accessibility
        setTimeout(() => tocSidebarInternalClose?.focus(), 50); // Small delay ensures transition started
         // Add listener for clicks outside the sidebar *after* the current click event bubble phase
         setTimeout(() => {
            document.addEventListener('click', handleOutsideSidebarClick, true); // Use capture phase
         }, 10); // Minimal delay
     }

     function closeSidebar() {
         if (!tocSidebar || !document.body) return;
         tocSidebar.classList.remove('visible');
         tocSidebar.setAttribute('aria-hidden', 'true');
         document.body.classList.remove('toc-sidebar-open');
         tocSidebarExternalClose?.classList.remove('visible');
         document.removeEventListener('click', handleOutsideSidebarClick, true); // Clean up listener
         // Focus the floating icon after closing for better keyboard navigation flow
         floatingTocIcon?.focus();
     }

     // Click outside handler using event capturing
     function handleOutsideSidebarClick(event) {
         if (tocSidebar?.classList.contains('visible') &&
             !tocSidebar.contains(event.target) && // Click wasn't inside sidebar
             event.target !== floatingTocIcon && // Click wasn't on the floating icon itself
             event.target !== tocSidebarExternalClose && // Click wasn't on external close
             !tocSidebarExternalClose?.contains(event.target) // Click wasn't inside external close
             ) {
              closeSidebar();
         }
     }


    if (floatingTocIcon) {
        floatingTocIcon.addEventListener('click', (e) => {
             e.stopPropagation(); // Prevent triggering potential outside click listener immediately
            openSidebar();
        });
    }

    if (tocSidebarInternalClose) {
        tocSidebarInternalClose.addEventListener('click', closeSidebar);
    }
    if (tocSidebarExternalClose) {
        tocSidebarExternalClose.addEventListener('click', closeSidebar);
    }


    // Close sidebar on Escape key press
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (tocSidebar?.classList.contains('visible')) {
                closeSidebar();
            }
        }
    });


    // Handle clicks on TOC links (both button and sidebar)
     function handleTocLinkClick(event) {
         const linkElement = event.target.closest('a'); // Find the nearest ancestor 'a' tag

         if (linkElement && linkElement.dataset.targetId) {
             event.preventDefault(); // Prevent default anchor jump
             const targetId = linkElement.dataset.targetId;
             const targetElement = document.getElementById(targetId);

             // Add visual feedback for click
             linkElement.classList.add('toc-link-clicked');
             setTimeout(() => {
                 linkElement.classList.remove('toc-link-clicked');
             }, 400); // Duration of the visual feedback

             if (targetElement) {
                 // Close sidebar smoothly *before* scrolling starts
                 if (tocSidebar?.classList.contains('visible')) {
                     closeSidebar();
                     // Wait a bit for sidebar close animation before scrolling
                     setTimeout(() => {
                        smoothScrollTo(targetElement);
                        applyHighlight(targetElement);
                     }, 300); // Adjust timing based on sidebar transition duration
                 } else {
                     // If sidebar not open, scroll immediately
                     smoothScrollTo(targetElement);
                     applyHighlight(targetElement);
                 }
             } else {
                 console.warn(`TOC link target not found: #${targetId}`);
             }
         }
     }

     // Smooth scroll function with offset
    function smoothScrollTo(element) {
        const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 70; // 70px offset for fixed headers etc.
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
     }


    if (tocButtonList) tocButtonList.addEventListener('click', handleTocLinkClick);
    if (tocSidebarList) tocSidebarList.addEventListener('click', handleTocLinkClick);


    // --- Highlight Functionality ---

    function applyHighlight(headingElement) {
        clearHighlight(); // Clear previous highlights first

        headingElement.classList.add('toc-target-heading');
        currentlyHighlightedElements.push(headingElement);

        let nextElem = headingElement.nextElementSibling;
        const headingLevel = parseInt(headingElement.tagName.substring(1));

         // Highlight subsequent paragraphs until the next heading of same or higher level
         while (nextElem) {
            const nextHeadingMatch = nextElem.tagName.match(/^H([2-6])$/);
            if (nextHeadingMatch && parseInt(nextHeadingMatch[1]) <= headingLevel) {
                break; // Stop if we hit a heading of the same or higher level
            }

            // Check if it's a block element likely containing content related to the heading
            if (['P', 'UL', 'OL', 'DIV', 'BLOCKQUOTE', 'FIGURE', 'TABLE', 'PRE'].includes(nextElem.tagName)) {
               nextElem.classList.add('toc-target-paragraph');
               currentlyHighlightedElements.push(nextElem);
            } else if (nextElem.tagName.startsWith('H') && parseInt(nextElem.tagName.substring(1)) > headingLevel) {
               // If it's a subheading, don't highlight it as a paragraph, just continue
            } else {
               // If it's an inline element or something unexpected, stop highlighting paragraphs.
               // break; // Or continue to next sibling? Decide based on desired behavior. Let's continue for now.
            }
            nextElem = nextElem.nextElementSibling;
         }


        const highlightDuration = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toc-highlight-duration')) || 6) * 1000;

        highlightTimeout = setTimeout(() => {
             currentlyHighlightedElements.forEach(el => {
                el.classList.add('fading-out'); // Add fade-out class
                // Remove all classes after the fade-out transition (CSS transition duration is 0.5s)
                setTimeout(() => {
                   el.classList.remove('toc-target-heading', 'toc-target-paragraph', 'fading-out');
                }, 500);
             });
             currentlyHighlightedElements = []; // Clear the array after starting fade-out
        }, highlightDuration);
    }

    function clearHighlight() {
        if (highlightTimeout) {
            clearTimeout(highlightTimeout); // Cancel any pending removal
            highlightTimeout = null;
        }
        // Immediately remove classes from any currently highlighted elements
        currentlyHighlightedElements.forEach(el => {
            el.classList.remove('toc-target-heading', 'toc-target-paragraph', 'fading-out');
        });
        currentlyHighlightedElements = []; // Clear the array
    }


    // --- Scroll Indicator Functionality ---

    function checkScrollIndicatorVisibility(scrollbox, indicator) {
        if (!scrollbox || !indicator) return;

        let isVisible = false; // Track current state to avoid unnecessary class toggling

        function check() {
             // Special check for collapsed button TOC: always hide indicator
             if (scrollbox === tocButtonScrollbox && tocButtonWrapper?.classList.contains('collapsed')) {
                 if (isVisible) {
                     indicator.classList.remove('visible');
                     isVisible = false;
                 }
                 return; // Exit check if button TOC is collapsed
             }

             // Check if content height is greater than visible height (requires a small buffer for accuracy)
             const isScrollable = scrollbox.scrollHeight > scrollbox.clientHeight + 2; // Added buffer
             // Check if scrolled near the top (allow some tolerance)
             const isAtTop = scrollbox.scrollTop < 10; // Tolerance for top position
             const shouldBeVisible = isScrollable && isAtTop;

             if (shouldBeVisible && !isVisible) {
                 indicator.classList.add('visible');
                 isVisible = true;
             } else if (!shouldBeVisible && isVisible) {
                 indicator.classList.remove('visible');
                 isVisible = false;
             }
        }

        // Initial check after a short delay to allow content rendering
        setTimeout(check, 200);

         // Check on scroll events (use passive for performance)
        scrollbox.addEventListener('scroll', check, { passive: true });

         // Re-check when button TOC is toggled (after animation)
        if (scrollbox === tocButtonScrollbox && tocButtonHeader) {
            tocButtonHeader.addEventListener('click', () => setTimeout(check, 550)); // Delay matching CSS transition
        }

         // Also consider resize events, as they can change scrollability
        window.addEventListener('resize', check, { passive: true }); // Added resize listener
     }

});

// फ़ाइल का अंत
