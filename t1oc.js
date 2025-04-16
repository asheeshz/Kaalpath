/* ==========================================================================
   Stylish TOC JavaScript for Blogger (v1.0 - Prefixed with stoc-)
   Host this file on GitHub Gist or similar.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- एलिमेंट चयन (stoc- प्रीफिक्स के साथ) ---
    const tocButtonWrapper = document.getElementById('stoc-toc-button-wrapper');
    const tocButtonHeader = document.getElementById('stoc-toc-button-header');
    const tocButtonScrollbox = document.getElementById('stoc-toc-button-scrollbox');
    const tocButtonList = document.getElementById('stoc-toc-button-list');
    const buttonScrollIndicator = document.getElementById('stoc-button-scroll-indicator');
    const floatingTocIcon = document.getElementById('stoc-floating-toc-icon');
    const tocSidebar = document.getElementById('stoc-toc-icon-sidebar');
    const tocSidebarInternalClose = document.getElementById('stoc-toc-sidebar-internal-close');
    const tocSidebarExternalClose = document.getElementById('stoc-toc-sidebar-external-close');
    const tocSidebarList = document.getElementById('stoc-toc-icon-sidebar-list');
    const tocSidebarScrollbox = document.getElementById('stoc-toc-icon-sidebar-scrollbox');
    const sidebarScrollIndicator = document.getElementById('stoc-sidebar-scroll-indicator');

    // --- ब्लॉगर पोस्ट कंटेंट एरिया का चयन ---
    // !!! महत्वपूर्ण: अपनी थीम के अनुसार सही सेलेक्टर डालें !!!
    // अपनी थीम के HTML को इंस्पेक्ट करके पोस्ट कंटेंट वाले div का क्लास या आईडी पता करें।
    // आम सेलेक्टर: '.post-body', '.entry-content', '.article-content', '#post-body'
    // यदि आपको सही सेलेक्टर नहीं मिलता है, तो TOC काम नहीं करेगा।
    const postContentArea = document.querySelector('.post-body'); // <-- इसे अपनी थीम के अनुसार अवश्य बदलें!

    // --- राज्य चर ---
    let currentlyHighlightedElements = [];
    let highlightTimeout = null;
    let tocButtonObserver = null;
    let hasHeadings = false;

    // --- कॉन्फ़िगरेशन ---
    const headingIcons = {
        2: 'fas fa-layer-group', 3: 'fas fa-stream', 4: 'fas fa-circle-dot',
        5: 'fas fa-minus', 6: 'fas fa-chevron-right'
    };
    const scrollOffset = 70; // Adjust based on your fixed header height
    const highlightDurationFallback = 6000; // ms
    const clickEffectDuration = 400; // ms

    // --- प्रारंभिक जांच ---
    // सुनिश्चित करें कि आवश्यक कंटेनर और सबसे महत्वपूर्ण, पोस्ट कंटेंट एरिया मिला है।
    if (!tocButtonList || !tocSidebarList || !postContentArea || !tocButtonWrapper || !floatingTocIcon || !tocSidebar) {
        console.warn("Stylish TOC Error: आवश्यक TOC तत्व या पोस्ट कंटेंट एरिया नहीं मिला। कृपया JavaScript में 'postContentArea' सेलेक्टर जांचें। वर्तमान में सेट है:", postContentArea ? "मिला" : "नहीं मिला");
        // Hide TOC elements if essential parts are missing
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
        return; // Stop execution if setup is incomplete
    }

    // --- हेडिंग्स से TOC बनाएं ---
    const headings = postContentArea.querySelectorAll('h2, h3, h4, h5, h6'); // H1 को छोड़ दें
    const fragmentButton = document.createDocumentFragment();
    const fragmentSidebar = document.createDocumentFragment();

    headings.forEach((heading) => {
        // Skip empty headings
        if (!heading.textContent?.trim()) {
            return;
        }

        hasHeadings = true;
        let id = heading.id;

        // Generate unique ID if missing
        if (!id) {
            id = 'stoc_' + (heading.textContent || 'heading').trim().toLowerCase()
                   .replace(/[^\w\s-]/g, '') // Remove non-word chars except space/hyphen
                   .replace(/\s+/g, '-') // Replace spaces with hyphens
                   .replace(/-+/g, '-'); // Replace multiple hyphens with single

            // Ensure uniqueness
            let counter = 1;
            let originalId = id;
            while (document.getElementById(id)) {
                id = `${originalId}-${counter}`;
                counter++;
            }
            heading.id = id; // Assign the generated ID back to the heading
        }

        const level = parseInt(heading.tagName.substring(1));
        const linkText = heading.textContent.trim();
        const iconClass = headingIcons[level] || 'fas fa-circle'; // Default icon

        // Create list items for both TOCs
        [fragmentButton, fragmentSidebar].forEach(fragment => {
            const listItem = document.createElement('li');
            listItem.className = `stoc-toc-list-item level-${level}`;

            const link = document.createElement('a');
            link.href = `#${id}`;
            link.dataset.targetId = id; // Store target ID for easy retrieval

            const iconSpan = document.createElement('span');
            iconSpan.className = 'stoc-toc-item-icon';
            iconSpan.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;

            const textSpan = document.createElement('span');
            textSpan.className = 'stoc-toc-item-text';
            textSpan.textContent = linkText;

            link.appendChild(iconSpan);
            link.appendChild(textSpan);
            listItem.appendChild(link);
            fragment.appendChild(listItem);
        });
    });

    // Append generated TOCs to the respective lists
    tocButtonList.appendChild(fragmentButton);
    tocSidebarList.appendChild(fragmentSidebar);

    // Hide TOCs if no valid headings were found
    if (!hasHeadings) {
        console.warn("Stylish TOC: पोस्ट में कोई H2-H6 हेडिंग नहीं मिली। TOC छिपाया जा रहा है।");
        if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
        if (floatingTocIcon) floatingTocIcon.style.display = 'none';
        // Sidebar is already hidden by default
    } else {
        // Initialize visibility checks and observers only if headings exist
        checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
        checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
        setupTocButtonObserver();
        setInitialButtonTocState();
    }

    // --- बटन TOC कार्यक्षमता ---
    function toggleButtonToc() {
        const isCollapsed = tocButtonWrapper.classList.toggle('collapsed');
        tocButtonWrapper.classList.toggle('expanded', !isCollapsed);
        tocButtonHeader.setAttribute('aria-expanded', String(!isCollapsed));
        if (!isCollapsed) {
            // Check indicator visibility *after* expansion animation might start
            setTimeout(() => checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator), 50);
            tocButtonScrollbox.focus(); // Focus scrollbox for accessibility
        } else {
            tocButtonHeader.focus(); // Return focus to header
        }
    }

    function setInitialButtonTocState() {
        tocButtonWrapper.classList.add('collapsed');
        tocButtonWrapper.classList.remove('expanded');
        tocButtonHeader.setAttribute('aria-expanded', 'false');
        if(buttonScrollIndicator) buttonScrollIndicator.classList.remove('visible');
    }

    if (tocButtonHeader) {
        tocButtonHeader.addEventListener('click', toggleButtonToc);
        tocButtonHeader.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault(); // Prevent page scroll on space
                toggleButtonToc();
            }
        });
    }

    // --- फ्लोटिंग आइकन दृश्यता (Intersection Observer) ---
    function setupTocButtonObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn("IntersectionObserver समर्थित नहीं है। फ्लोटिंग TOC आइकन हमेशा दिख सकता है (यदि हेडिंग्स हैं)।");
            // Fallback: Show icon if observer is not supported and headings exist
             if(floatingTocIcon && hasHeadings) floatingTocIcon.classList.add('visible');
            return;
        }

        const observerOptions = {
            root: null, // Use viewport
            rootMargin: '0px',
            threshold: 0 // Trigger as soon as it enters/leaves viewport
        };

        tocButtonObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Show floating icon ONLY if button TOC is NOT visible AND sidebar is closed
                if (!entry.isIntersecting && !tocSidebar.classList.contains('visible')) {
                     if(floatingTocIcon) floatingTocIcon.classList.add('visible');
                } else {
                     if(floatingTocIcon) floatingTocIcon.classList.remove('visible');
                }
            });
        }, observerOptions);

        // Observe the button TOC wrapper
        tocButtonObserver.observe(tocButtonWrapper);
    }

    // --- साइडबार TOC कार्यक्षमता ---
    function openSidebar() {
        tocSidebar.classList.add('visible');
        tocSidebar.setAttribute('aria-hidden', 'false');
        document.body.classList.add('stoc-toc-sidebar-open'); // Class for potential body styles (e.g., prevent scroll)
        if(tocSidebarExternalClose) tocSidebarExternalClose.classList.add('visible');
         if(floatingTocIcon) floatingTocIcon.classList.remove('visible'); // Hide floating icon when sidebar is open

        // Check scroll indicator visibility and set focus after transition
        checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
        setTimeout(() => tocSidebarInternalClose?.focus(), 50); // Focus internal close button

        // Add listener to close sidebar on outside click (after a short delay)
         setTimeout(() => {
             document.addEventListener('click', handleOutsideSidebarClick, true); // Use capture phase
         }, 100);
    }

    function closeSidebar() {
        tocSidebar.classList.remove('visible');
        tocSidebar.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('stoc-toc-sidebar-open');
        if(tocSidebarExternalClose) tocSidebarExternalClose.classList.remove('visible');

        // Re-evaluate floating icon visibility after sidebar closes
        // Check if the button TOC is *still* off-screen
        const buttonRect = tocButtonWrapper.getBoundingClientRect();
        if (buttonRect.bottom < 0 || buttonRect.top > window.innerHeight) {
             if(floatingTocIcon) floatingTocIcon.classList.add('visible');
        }

        // Remove the outside click listener
        document.removeEventListener('click', handleOutsideSidebarClick, true);

        // Return focus to the floating icon if it was the trigger
        if(floatingTocIcon && document.activeElement === tocSidebarInternalClose) {
             floatingTocIcon.focus();
        } else if (tocSidebarExternalClose && document.activeElement === tocSidebarExternalClose){
             floatingTocIcon?.focus(); // Focus floating icon if external close was used
        }
    }

    // Click outside handler
    function handleOutsideSidebarClick(event) {
        // Close only if the click is outside the sidebar and *not* on the floating icon or external close button
         if (tocSidebar.classList.contains('visible') &&
             !tocSidebar.contains(event.target) &&
             event.target !== floatingTocIcon && // Don't close if clicking the icon again
             !floatingTocIcon?.contains(event.target) &&
             event.target !== tocSidebarExternalClose &&
             !tocSidebarExternalClose?.contains(event.target))
         {
            closeSidebar();
         }
    }

    // Event listeners for opening/closing sidebar
    if (floatingTocIcon) {
        floatingTocIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering body click listener immediately
            openSidebar();
        });
    }
    if (tocSidebarInternalClose) {
        tocSidebarInternalClose.addEventListener('click', closeSidebar);
    }
    if (tocSidebarExternalClose) {
        tocSidebarExternalClose.addEventListener('click', closeSidebar);
    }

    // Close sidebar with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && tocSidebar.classList.contains('visible')) {
            closeSidebar();
        }
    });

    // --- TOC लिंक क्लिक हैंडलिंग और हाइलाइटिंग ---
    function handleTocLinkClick(event) {
        const linkElement = event.target.closest('a');
        if (linkElement && linkElement.dataset.targetId) {
            event.preventDefault(); // Prevent default anchor jump
            const targetId = linkElement.dataset.targetId;
            const targetElement = document.getElementById(targetId);

            // Apply visual click effect
            linkElement.classList.add('stoc-toc-link-clicked');
            setTimeout(() => {
                linkElement.classList.remove('stoc-toc-link-clicked');
            }, clickEffectDuration);

            if (targetElement) {
                // If sidebar is open, close it first, then scroll after a delay
                if (tocSidebar.classList.contains('visible')) {
                    closeSidebar();
                    // Delay scrolling slightly to allow sidebar close animation
                    setTimeout(() => {
                        scrollToElement(targetElement);
                    }, 300); // Adjust delay based on sidebar transition time
                } else {
                    // Sidebar is closed, scroll immediately
                    scrollToElement(targetElement);
                }
            } else {
                console.warn(`Stylish TOC: लक्ष्य तत्व आईडी के साथ नहीं मिला: ${targetId}`);
            }
        }
    }

    function scrollToElement(element) {
         // Calculate target position considering the scroll offset
         const elementRect = element.getBoundingClientRect();
         const absoluteElementTop = elementRect.top + window.pageYOffset;
         const offsetPosition = absoluteElementTop - scrollOffset;

         window.scrollTo({
             top: offsetPosition,
             behavior: 'smooth'
         });

         // Apply highlight *after* scrolling likely finishes
         // Using a timeout as 'scrollend' event isn't universally supported
         setTimeout(() => {
             applyHighlight(element);
             // Optional: Update URL hash without triggering scroll
             // history.pushState(null, null, `#${element.id}`);
         }, 700); // Estimate for smooth scroll duration
    }

    // Event delegation for TOC links
    if (tocButtonList) tocButtonList.addEventListener('click', handleTocLinkClick);
    if (tocSidebarList) tocSidebarList.addEventListener('click', handleTocLinkClick);

    // --- हेडिंग और पैराग्राफ हाइलाइटिंग ---
    function applyHighlight(headingElement) {
        clearHighlight(); // Clear any previous highlights

        headingElement.classList.add('stoc-toc-target-heading');
        currentlyHighlightedElements.push(headingElement);

        let nextElem = headingElement.nextElementSibling;
        const headingLevel = parseInt(headingElement.tagName.substring(1));

        // Highlight subsequent paragraphs until the next heading of same or higher level
        while (nextElem) {
            const tagName = nextElem.tagName.toUpperCase();
            // Check if it's a heading that should stop the highlight
            if (tagName.startsWith('H')) {
                const nextLevel = parseInt(tagName.substring(1));
                if (nextLevel <= headingLevel) {
                    break; // Found same or higher level heading, stop.
                }
            }
            // Highlight common block elements associated with the heading
            if (['P', 'UL', 'OL', 'DIV', 'BLOCKQUOTE', 'PRE', 'TABLE'].includes(tagName)) {
                nextElem.classList.add('stoc-toc-target-paragraph');
                currentlyHighlightedElements.push(nextElem);
            }
            // If it's a non-highlightable element but shouldn't stop search (like BR, HR)
            else if (['BR', 'HR', 'SCRIPT', 'STYLE'].includes(tagName)) {
                 // Just skip these elements
            }
            // If it's another type of block element, decide whether to stop or continue
            // For now, we stop on unknown block elements to be safe.
            else if (nextElem.offsetWidth > 0 && nextElem.offsetHeight > 0 && getComputedStyle(nextElem).display !== 'inline') {
                 // break; // Optional: Stop on any unexpected block element
            }

            nextElem = nextElem.nextElementSibling;
        }

        // Get duration from CSS variable or use fallback
         const cssDuration = getComputedStyle(document.documentElement).getPropertyValue('--stoc-popup-highlight-duration');
         let highlightDurationMs = highlightDurationFallback; // Default
         if (cssDuration) {
             // Parse duration (e.g., "6s" -> 6000)
             try {
                 const durationValue = parseFloat(cssDuration);
                 if (cssDuration.toLowerCase().includes('ms')) {
                     highlightDurationMs = durationValue;
                 } else if (cssDuration.toLowerCase().includes('s')) {
                     highlightDurationMs = durationValue * 1000;
                 }
             } catch (e) {
                 console.warn("Stylish TOC: Could not parse --stoc-popup-highlight-duration CSS variable.", e);
             }
         }

        // Set timeout to remove highlight classes
        highlightTimeout = setTimeout(() => {
            currentlyHighlightedElements.forEach(el => {
                el.classList.add('fading-out'); // Trigger fade-out transition
                // Remove classes after the fade-out transition completes (CSS transition duration is 0.5s)
                setTimeout(() => {
                    el.classList.remove('stoc-toc-target-heading', 'stoc-toc-target-paragraph', 'fading-out');
                }, 500); // Match CSS transition duration
            });
            currentlyHighlightedElements = []; // Clear the array
        }, highlightDurationMs - 500); // Start fade-out slightly before total duration ends
    }

    function clearHighlight() {
        if (highlightTimeout) clearTimeout(highlightTimeout);
        highlightTimeout = null;
        currentlyHighlightedElements.forEach(el => {
            // Remove all potentially active classes immediately
            el.classList.remove('stoc-toc-target-heading', 'stoc-toc-target-paragraph', 'fading-out');
        });
        currentlyHighlightedElements = [];
    }

    // --- स्क्रॉल इंडिकेटर दृश्यता ---
    function checkScrollIndicatorVisibility(scrollbox, indicator) {
        if (!scrollbox || !indicator) return;

        let isVisible = indicator.classList.contains('visible'); // Track current state

        function check() {
            // Special case for button TOC: always hide if collapsed
            if (scrollbox === tocButtonScrollbox && tocButtonWrapper?.classList.contains('collapsed')) {
                if (isVisible) {
                    indicator.classList.remove('visible');
                    isVisible = false;
                }
                return;
            }

            // Check if content is scrollable (add buffer for precision issues)
            const isScrollable = scrollbox.scrollHeight > scrollbox.clientHeight + 5;
            // Check if user is near the top (add buffer)
            const isNearTop = scrollbox.scrollTop < 20;

            const shouldBeVisible = isScrollable && isNearTop;

            if (shouldBeVisible && !isVisible) {
                indicator.classList.add('visible');
                isVisible = true;
            } else if (!shouldBeVisible && isVisible) {
                indicator.classList.remove('visible');
                isVisible = false;
            }
        }

        // Initial check after a short delay
        setTimeout(check, 250);

        // Check on scroll (use passive listener for performance)
        scrollbox.addEventListener('scroll', check, { passive: true });

        // Re-check when button TOC is toggled (after transition)
         if (scrollbox === tocButtonScrollbox && tocButtonHeader) {
             tocButtonHeader.addEventListener('click', () => {
                 // Delay check to occur after max-height transition (~0.55s)
                 setTimeout(check, 600);
             });
         }
         // Re-check when sidebar is opened (after transition)
         if (scrollbox === tocSidebarScrollbox && floatingTocIcon) {
             floatingTocIcon.addEventListener('click', () => {
                 // Delay check to occur after sidebar transform transition (~0.5s)
                 setTimeout(check, 550);
             });
         }
         // Also check on window resize as clientHeight might change
         window.addEventListener('resize', check, { passive: true });
    }
});
