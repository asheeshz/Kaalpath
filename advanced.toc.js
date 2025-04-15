// script.js - ब्लॉगर TOC के लिए GitHub होस्टेड JS

document.addEventListener('DOMContentLoaded', () => {
    // --- तत्व चयन ---
    // जितना संभव हो सके, robust सेलेक्टर का उपयोग करें
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
    // पोस्ट कंटेंट एरिया के लिए fallback सेलेक्टर, यदि ID नहीं मिलता है
    const postContentArea = document.getElementById('post-content-area') || document.querySelector('.post-body') || document.body;

    // --- ग्लोबल वेरिएबल्स ---
    let currentlyHighlightedElements = []; // ट्रैक करें कि कौन से तत्व हाइलाइटेड हैं
    let highlightTimeout = null; // हाइलाइट हटाने के लिए टाइमआउट
    let tocButtonObserver = null; // Intersection Observer

    // --- आइकन मैप (H2-H6 के लिए) ---
    const headingIcons = {
        2: 'fas fa-layer-group', // H2
        3: 'fas fa-stream',      // H3
        4: 'fas fa-circle-dot',  // H4 (Font Awesome 6)
        5: 'fas fa-minus',       // H5
        6: 'fas fa-chevron-right'// H6
    };

    // --- TOC जेनरेशन ---
    function generateToc() {
        // सुनिश्चित करें कि आवश्यक लिस्ट तत्व और कंटेंट एरिया मौजूद हैं
        if (!tocButtonList || !tocSidebarList || !postContentArea || !tocButtonWrapper) {
            console.warn("TOC Generation Error: Required elements not found. TOC Button Wrapper:", tocButtonWrapper, "Button List:", tocButtonList, "Sidebar List:", tocSidebarList, "Content Area:", postContentArea);
            // यदि आवश्यक तत्व नहीं मिलते हैं, तो संबंधित UI छिपाएं
            if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
            if (floatingTocIcon) floatingTocIcon.style.display = 'none';
            return; // आगे बढ़ने से रोकें
        }

        const headings = postContentArea.querySelectorAll('h2, h3, h4, h5, h6');
        let hasHeadings = false;
        const fragmentButton = document.createDocumentFragment();
        const fragmentSidebar = document.createDocumentFragment();

        headings.forEach((heading) => {
            // सुनिश्चित करें कि हेडिंग में कुछ टेक्स्ट है
            const headingText = (heading.textContent || heading.innerText || '').trim();
            if (!headingText) {
                return; // खाली हेडिंग को छोड़ दें
            }

            hasHeadings = true;
            let id = heading.id;
            // सुरक्षित ID बनाएं यदि मौजूद नहीं है
            if (!id) {
                // टेक्स्ट से आईडी बनाएं, गैर-अल्फ़ान्यूमेरिक हटाएं, स्पेस को हाइफ़न से बदलें
                id = 'toc_' + headingText.toLowerCase()
                                       .replace(/[^\w\s-]/g, '') // गैर-शब्द, गैर-स्पेस, गैर-हाइफ़न हटाएं
                                       .replace(/[\s_-]+/g, '-') // स्पेस/अंडरस्कोर/हाइफ़न को एकल हाइफ़न से बदलें
                                       .replace(/^-+|-+$/g, ''); // शुरुआत/अंत के हाइफ़न हटाएं
                if (!id || id === 'toc_') { // यदि सफाई के बाद कुछ नहीं बचा
                    id = 'toc-heading-' + Math.random().toString(36).substring(2, 7);
                }
                let counter = 1;
                let originalId = id;
                // सुनिश्चित करें कि ID यूनिक है
                while (document.getElementById(id)) {
                    id = `${originalId}-${counter}`;
                    counter++;
                }
                heading.id = id; // जेनरेट की गई ID को हेडिंग में सेट करें
            }

            const level = parseInt(heading.tagName.substring(1));
            const linkText = headingText;
            const iconClass = headingIcons[level] || 'fas fa-circle'; // फॉलबैक आइकन

            // दोनों लिस्ट (बटन और साइडबार) के लिए आइटम बनाएं
            [fragmentButton, fragmentSidebar].forEach(fragment => {
                const listItem = document.createElement('li');
                listItem.classList.add('toc-list-item', `level-${level}`);

                const link = document.createElement('a');
                link.href = `#${id}`;
                link.dataset.targetId = id; // आसान चयन के लिए

                const iconSpan = document.createElement('span');
                iconSpan.className = 'toc-item-icon';
                iconSpan.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`; // आइकन जोड़ें, aria-hidden

                const textSpan = document.createElement('span');
                textSpan.className = 'toc-item-text';
                textSpan.textContent = linkText;

                link.appendChild(iconSpan);
                link.appendChild(textSpan);
                listItem.appendChild(link);
                fragment.appendChild(listItem);
            });
        });

        // लिस्ट में कंटेंट डालें
        tocButtonList.innerHTML = ''; // पहले से मौजूद आइटम हटाएं
        tocSidebarList.innerHTML = '';
        tocButtonList.appendChild(fragmentButton);
        tocSidebarList.appendChild(fragmentSidebar);

        // यदि कोई मान्य हेडिंग नहीं मिली, तो TOC ट्रिगर्स छिपाएं
        if (!hasHeadings) {
            console.log("No valid headings found for TOC.");
            if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
            if (floatingTocIcon) floatingTocIcon.style.display = 'none';
        } else {
            // स्क्रॉल इंडिकेटर चेक करें
            checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
            checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
            // फ्लोटिंग आइकन दृश्यता के लिए ऑब्जर्वर सेट करें
            setupTocButtonObserver();
            // बटन TOC को शुरू में collapsed सेट करें
            setInitialButtonTocState();
        }
    }

    // --- बटन TOC टॉगल लॉजिक ---
    function toggleButtonToc() {
        if (!tocButtonWrapper || !tocButtonHeader) return;
        const isCollapsed = tocButtonWrapper.classList.toggle('collapsed');
        tocButtonWrapper.classList.toggle('expanded', !isCollapsed);
        tocButtonHeader.setAttribute('aria-expanded', String(!isCollapsed));
        tocButtonHeader.focus(); // एक्सेसिबिलिटी: फोकस हेडर पर रखें
        // इंडिकेटर फिर से चेक करें (खासकर जब एक्सपैंड हो)
        checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
    }

    function setInitialButtonTocState() {
        if (!tocButtonWrapper || !tocButtonHeader) return;
        tocButtonWrapper.classList.add('collapsed');
        tocButtonWrapper.classList.remove('expanded');
        tocButtonHeader.setAttribute('aria-expanded', 'false');
        checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
    }

    // --- फ्लोटिंग आइकन दृश्यता ऑब्जर्वर ---
    function setupTocButtonObserver() {
        if (!('IntersectionObserver' in window) || !tocButtonWrapper || !floatingTocIcon) {
            console.warn("IntersectionObserver not supported or required elements not found for observer.");
            // फॉलबैक: यदि ऑब्जर्वर काम नहीं करता है, तो शायद आइकन को हमेशा दिखाना बेहतर है?
            // floatingTocIcon?.classList.add('visible');
            return;
        }

        // यदि ऑब्जर्वर पहले से मौजूद है, तो उसे डिस्कनेक्ट करें
        if (tocButtonObserver) {
            tocButtonObserver.disconnect();
        }

        const observerOptions = {
            root: null, // व्यूपोर्ट के सापेक्ष
            rootMargin: '0px',
            threshold: 0 // जैसे ही तत्व व्यूपोर्ट से बाहर जाता है
        };

        tocButtonObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // यदि बटन TOC व्यूपोर्ट में नहीं है, तो फ्लोटिंग आइकन दिखाएं
                floatingTocIcon.classList.toggle('visible', !entry.isIntersecting);
            });
        }, observerOptions);

        tocButtonObserver.observe(tocButtonWrapper);
    }

    // --- साइडबार खोलें/बंद करें ---
    function openSidebar() {
        if (!tocSidebar) return;
        tocSidebar.classList.add('visible');
        tocSidebar.setAttribute('aria-hidden', 'false');
        document.body.classList.add('toc-sidebar-open'); // बॉडी क्लास (आइकन शिफ्टिंग आदि के लिए)
        tocSidebarExternalClose?.classList.add('visible'); // बाहरी क्लोज बटन दिखाएं
        // फोकस इंटरनल क्लोज बटन पर ले जाएं (एक्सेसिबिलिटी)
        setTimeout(() => tocSidebarInternalClose?.focus(), 50);
        // बाहर क्लिक को सुनने के लिए लिस्नर जोड़ें (थोड़ी देर बाद)
        setTimeout(() => {
            document.addEventListener('click', handleOutsideSidebarClick, { capture: true, once: false });
        }, 100);
    }

    function closeSidebar() {
        if (!tocSidebar) return;
        tocSidebar.classList.remove('visible');
        tocSidebar.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('toc-sidebar-open');
        tocSidebarExternalClose?.classList.remove('visible'); // बाहरी क्लोज बटन छिपाएं
        document.removeEventListener('click', handleOutsideSidebarClick, { capture: true }); // लिस्नर हटाएं
        floatingTocIcon?.focus(); // फोकस फ्लोटिंग आइकन पर वापस
    }

    function handleOutsideSidebarClick(event) {
        // यदि साइडबार खुला है और क्लिक साइडबार, फ्लोटिंग आइकन या बाहरी क्लोज बटन के बाहर हुआ है
        if (tocSidebar?.classList.contains('visible') &&
            !tocSidebar.contains(event.target) &&
            event.target !== floatingTocIcon &&
            !floatingTocIcon?.contains(event.target) &&
            event.target !== tocSidebarExternalClose &&
            !tocSidebarExternalClose?.contains(event.target))
        {
             closeSidebar();
        }
    }

    // --- Esc कुंजी से बंद करें ---
    function handleEscKey(event) {
        if (event.key === 'Escape' || event.key === 'Esc') { // Esc के पुराने संस्करणों के लिए भी जाँच करें
            if (tocSidebar?.classList.contains('visible')) {
                closeSidebar();
            }
            // Esc पर बटन TOC बंद नहीं करेंगे
        }
    }

    // --- TOC लिंक क्लिक हैंडलर ---
    function handleTocLinkClick(event) {
         const linkElement = event.target.closest('a'); // सुनिश्चित करें कि क्लिक a या उसके चाइल्ड पर हुआ है
        if (!linkElement || !linkElement.dataset.targetId) return; // यदि लिंक नहीं है या डेटासेट नहीं है तो बाहर निकलें

        event.preventDefault(); // डिफ़ॉल्ट नेविगेशन रोकें
        const targetId = linkElement.dataset.targetId;
        const targetElement = document.getElementById(targetId);

        // क्लिक इफ़ेक्ट
        linkElement.classList.add('toc-link-clicked');
        setTimeout(() => {
            linkElement.classList.remove('toc-link-clicked');
        }, 400); // CSS ट्रांज़िशन से थोड़ा लंबा रखें

        if (targetElement) {
            // साइडबार बंद करें (यदि खुला है)
            if (tocSidebar?.classList.contains('visible')) {
                setTimeout(closeSidebar, 100); // थोड़ा डिले
            }

            // स्क्रॉल और हाइलाइट
            const targetOffsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
            const headerOffset = 70; // अपने फिक्स्ड हेडर की ऊंचाई (या अनुमानित) यहाँ सेट करें
            const offsetPosition = targetOffsetTop - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            applyHighlight(targetElement);

            // यूआरएल हैश अपडेट करें (यदि चाहें)
            // history.pushState(null, null, `#${targetId}`);
        } else {
            console.warn(`TOC link target element with ID "${targetId}" not found.`);
        }
    }

    // --- हाइलाइटिंग लॉजिक ---
    function applyHighlight(headingElement) {
        clearHighlight(); // पहले के हाइलाइट हटाएं

        // वर्तमान हेडिंग हाइलाइट करें
        headingElement.classList.add('toc-target-heading');
        currentlyHighlightedElements.push(headingElement);

        // संबंधित पैराग्राफ्स को हाइलाइट करें
        let nextElem = headingElement.nextElementSibling;
        const headingLevel = parseInt(headingElement.tagName.substring(1));

        while (nextElem) {
            const nextElemLevelMatch = nextElem.tagName.match(/^H([2-6])$/);
            if (nextElemLevelMatch && parseInt(nextElemLevelMatch[1]) <= headingLevel) {
                break;
            }
            if (['P', 'UL', 'OL', 'DIV', 'BLOCKQUOTE', 'FIGURE', 'TABLE'].includes(nextElem.tagName)) { // और ब्लॉक तत्व शामिल करें
                 nextElem.classList.add('toc-target-paragraph');
                 currentlyHighlightedElements.push(nextElem);
             }
            nextElem = nextElem.nextElementSibling;
        }

        // हाइलाइट हटाने के लिए टाइमआउट सेट करें
        const highlightDurationMs = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toc-popup-highlight-duration')) || 6) * 1000;

        highlightTimeout = setTimeout(() => {
             currentlyHighlightedElements.forEach(el => {
                 el.classList.add('fading-out');
                 setTimeout(() => {
                    el.classList.remove('toc-target-heading', 'toc-target-paragraph', 'fading-out');
                 }, 500); // CSS ट्रांज़िशन अवधि
             });
             currentlyHighlightedElements = [];
        }, highlightDurationMs);
    }

    function clearHighlight() {
         // मौजूदा टाइमआउट रद्द करें
         if (highlightTimeout) {
             clearTimeout(highlightTimeout);
             highlightTimeout = null;
         }
         // तुरंत सभी हाइलाइटिंग क्लास हटाएं
         currentlyHighlightedElements.forEach(el => {
             el.classList.remove('toc-target-heading', 'toc-target-paragraph', 'fading-out');
         });
         currentlyHighlightedElements = [];
    }

    // --- स्क्रॉल इंडिकेटर दृश्यता ---
    function checkScrollIndicatorVisibility(scrollbox, indicator) {
        if (!scrollbox || !indicator) return; // तत्व मौजूद होने चाहिए

        let isVisible = indicator.classList.contains('visible'); // वर्तमान स्थिति प्राप्त करें

        // दृश्यता जांचने के लिए रीयूजेबल फंक्शन
        const check = () => {
            // यदि बटन TOC ढह गया है, तो छिपाएं
            if (scrollbox === tocButtonScrollbox && tocButtonWrapper?.classList.contains('collapsed')) {
                 if (isVisible) { indicator.classList.remove('visible'); isVisible = false; }
                 return;
            }
            // क्या कंटेंट स्क्रॉलबॉक्स से लंबा है?
            const isScrollable = scrollbox.scrollHeight > scrollbox.clientHeight + 2; // थोड़ा बफर
            // क्या यूजर टॉप पर है?
            const isAtTop = scrollbox.scrollTop < 10;
            // क्या दिखाना चाहिए?
            const shouldBeVisible = isScrollable && isAtTop;

            if (shouldBeVisible && !isVisible) {
                indicator.classList.add('visible');
                isVisible = true;
            } else if (!shouldBeVisible && isVisible) {
                indicator.classList.remove('visible');
                isVisible = false;
            }
        };

        // थोड़ी देर बाद जांचें (DOM रेंडरिंग के लिए समय दें)
        // requestAnimationFrame का उपयोग करना बेहतर हो सकता है
        requestAnimationFrame(() => setTimeout(check, 150));

        // स्क्रॉल करने पर फिर से जांचें (पैसिव लिस्नर)
        scrollbox.addEventListener('scroll', check, { passive: true });

        // बटन TOC के खुलने/बंद होने पर फिर से जांचें
        if (scrollbox === tocButtonScrollbox && tocButtonHeader) {
            tocButtonHeader.addEventListener('click', () => {
                 // CSS ट्रांज़िशन खत्म होने का इंतज़ार करें
                 setTimeout(check, 550); // max-height ट्रांज़िशन अवधि (0.55s)
            });
        }

        // विंडो रीसाइज़ पर भी जांचना (वैकल्पिक लेकिन अच्छा है)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(check, 200); // रीसाइज़ के रुकने के बाद जांचें
        }, { passive: true });
    }

    // --- इवेंट लिस्नर जोड़ें ---
    function addEventListeners() {
        if (tocButtonHeader) {
            tocButtonHeader.addEventListener('click', toggleButtonToc);
            tocButtonHeader.addEventListener('keydown', (event) => {
                // एक्सेसिबिलिटी: कीबोर्ड से टॉगल करें
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleButtonToc();
                }
            });
        }
        if (floatingTocIcon) {
            // स्टॉप प्रोपेगेशन महत्वपूर्ण है ताकि बॉडी क्लिक लिस्नर तुरंत बंद न कर दे
            floatingTocIcon.addEventListener('click', (e) => { e.stopPropagation(); openSidebar(); });
        }
        if (tocSidebarInternalClose) {
            tocSidebarInternalClose.addEventListener('click', closeSidebar);
        }
        if (tocSidebarExternalClose) {
            tocSidebarExternalClose.addEventListener('click', closeSidebar);
        }
        // Esc कुंजी लिस्नर
        document.addEventListener('keydown', handleEscKey);
        // TOC लिस्ट क्लिक लिस्नर
        if (tocButtonList) {
            tocButtonList.addEventListener('click', handleTocLinkClick);
        }
        if (tocSidebarList) {
            tocSidebarList.addEventListener('click', handleTocLinkClick);
        }
    }

    // --- इनिशियलाइज़ेशन ---
    generateToc(); // पेज लोड पर TOC बनाएं
    addEventListeners(); // इवेंट लिस्नर जोड़ें

}); // DOMContentLoaded End
