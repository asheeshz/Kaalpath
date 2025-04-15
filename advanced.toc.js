document.addEventListener('DOMContentLoaded', () => {
        // --- एलिमेंट चयन ---
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

        // --- राज्य चर ---
        let currentlyHighlightedElements = []; // हाइलाइट किए गए तत्वों का ट्रैक रखें
        let highlightTimeout = null; // हाइलाइट टाइमआउट को प्रबंधित करने के लिए
        let tocButtonObserver = null; // इंटरसेक्शन ऑब्जर्वर इंस्टेंस
        let hasHeadings = false; // क्या पोस्ट में हेडिंग हैं

        // --- कॉन्फ़िगरेशन ---
        const headingIcons = {
            2: 'fas fa-layer-group', // H2 के लिए आइकन
            3: 'fas fa-stream',      // H3 के लिए आइकन
            4: 'fas fa-circle-dot',  // H4 के लिए आइकन
            5: 'fas fa-minus',       // H5 के लिए आइकन
            6: 'fas fa-chevron-right' // H6 के लिए आइकन
        };
        const scrollOffset = 70; // स्क्रॉल करते समय हेडर के लिए ऑफसेट (पिक्सेल में)
        const highlightDurationFallback = 6000; // मिलीसेकंड में डिफ़ॉल्ट हाइलाइट अवधि (CSS متغیر से मेल खाना चाहिए)
        const clickEffectDuration = 400; // मिलीसेकंड में लिंक क्लिक प्रभाव अवधि

        // --- प्रारंभिक जांच ---
        if (!tocButtonList || !tocSidebarList || !postContentArea || !tocButtonWrapper || !floatingTocIcon || !tocSidebar) {
            console.warn("आवश्यक TOC तत्व या पोस्ट कंटेंट एरिया नहीं मिला। TOC कार्यक्षमता अक्षम हो सकती है।");
            if (tocButtonWrapper) tocButtonWrapper.style.display = 'none';
            if (floatingTocIcon) floatingTocIcon.style.display = 'none';
            return; // यदि आवश्यक तत्व मौजूद नहीं हैं तो आगे न बढ़ें
        }

        // --- हेडिंग्स से TOC बनाएं ---
        const headings = postContentArea.querySelectorAll('h1, h2, h3, h4, h5, h6'); // H1 को भी शामिल करें यदि आवश्यक हो, लेकिन आमतौर पर TOC H2 से शुरू होता है
        const fragmentButton = document.createDocumentFragment();
        const fragmentSidebar = document.createDocumentFragment();

        headings.forEach((heading) => {
             // H1 को छोड़ दें या अपनी आवश्यकतानुसार संभालें
             if (heading.tagName === 'H1') {
                 return;
             }

            hasHeadings = true;
            let id = heading.id;

            // यदि आईडी मौजूद नहीं है तो एक अद्वितीय आईडी बनाएं
            if (!id) {
                // टेक्स्ट से स्लग बनाएं
                id = 'toc_' + (heading.textContent || 'heading')
                                .trim()
                                .toLowerCase()
                                .replace(/\s+/g, '-') // स्पेसेस को हाइफ़न से बदलें
                                .replace(/[^\w-]+/g, ''); // गैर-अल्फ़ान्यूमेरिक वर्ण हटाएं (हाइफ़न को छोड़कर)

                // आईडी की विशिष्टता सुनिश्चित करें
                let counter = 1;
                let originalId = id;
                while (document.getElementById(id)) {
                    id = `${originalId}-${counter}`;
                    counter++;
                }
                heading.id = id; // हेडिंग में आईडी सेट करें
            }

            const level = parseInt(heading.tagName.substring(1));
            const linkText = heading.textContent || 'शीर्षक रहित';
            const iconClass = headingIcons[level] || 'fas fa-circle'; // डिफ़ॉल्ट आइकन

            // दोनों TOCs के लिए लिस्ट आइटम बनाएं
            [fragmentButton, fragmentSidebar].forEach(fragment => {
                const listItem = document.createElement('li');
                listItem.classList.add('toc-list-item', `level-${level}`);

                const link = document.createElement('a');
                link.href = `#${id}`;
                link.dataset.targetId = id; // आसान लक्ष्य पुनर्प्राप्ति के लिए डेटा विशेषता

                const iconSpan = document.createElement('span');
                iconSpan.className = 'toc-item-icon';
                iconSpan.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`; // ARIA: आइकन सजावटी है

                const textSpan = document.createElement('span');
                textSpan.className = 'toc-item-text';
                textSpan.textContent = linkText;

                link.appendChild(iconSpan);
                link.appendChild(textSpan);
                listItem.appendChild(link);
                fragment.appendChild(listItem);
            });
        });

        // उत्पन्न TOC को DOM में जोड़ें
        tocButtonList.appendChild(fragmentButton);
        tocSidebarList.appendChild(fragmentSidebar);

        // यदि कोई हेडिंग नहीं मिली तो TOC छिपाएँ
        if (!hasHeadings) {
            tocButtonWrapper.style.display = 'none';
            floatingTocIcon.style.display = 'none';
        } else {
            // स्क्रॉल इंडिकेटर और ऑब्जर्वर सेटअप करें
            checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
            checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
            setupTocButtonObserver();
            setInitialButtonTocState();
        }

        // --- बटन TOC कार्यक्षमता ---
        function toggleButtonToc() {
            const isCollapsed = tocButtonWrapper.classList.toggle('collapsed');
            tocButtonWrapper.classList.toggle('expanded', !isCollapsed);
            tocButtonHeader.setAttribute('aria-expanded', String(!isCollapsed)); // स्ट्रिंग में बदलें
            if (!isCollapsed) {
                // विस्तारित होने पर इंडिकेटर जांचें
                checkScrollIndicatorVisibility(tocButtonScrollbox, buttonScrollIndicator);
                tocButtonScrollbox.focus(); // स्क्रॉलबॉक्स पर फ़ोकस करें
            } else {
                tocButtonHeader.focus(); // संक्षिप्त होने पर हेडर पर फ़ोकस करें
            }
        }

        function setInitialButtonTocState() {
            tocButtonWrapper.classList.add('collapsed');
            tocButtonWrapper.classList.remove('expanded');
            tocButtonHeader.setAttribute('aria-expanded', 'false');
            // सुनिश्चित करें कि प्रारंभिक अवस्था में इंडिकेटर छिपा हुआ है
            if(buttonScrollIndicator) buttonScrollIndicator.classList.remove('visible');
        }

        // बटन TOC टॉगल के लिए इवेंट श्रोता
        if (tocButtonHeader) {
            tocButtonHeader.addEventListener('click', toggleButtonToc);
            tocButtonHeader.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault(); // डिफ़ॉल्ट क्रिया रोकें (जैसे स्पेस से स्क्रॉल करना)
                    toggleButtonToc();
                }
            });
        }

        // --- फ्लोटिंग आइकन दृश्यता (इंटरसेक्शन ऑब्जर्वर) ---
        function setupTocButtonObserver() {
            if (!('IntersectionObserver' in window)) {
                console.warn("IntersectionObserver समर्थित नहीं है। फ्लोटिंग TOC आइकन हमेशा दिख सकता है।");
                // फॉलबैक: आइकन को हमेशा दृश्यमान बनाएं यदि ऑब्जर्वर समर्थित नहीं है
                 if(floatingTocIcon && hasHeadings) floatingTocIcon.classList.add('visible');
                return;
            }

            const observerOptions = {
                root: null, // व्यूपोर्ट के सापेक्ष
                rootMargin: '0px',
                threshold: 0 // जैसे ही तत्व व्यूपोर्ट से बाहर निकलता है
            };

            tocButtonObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // यदि बटन TOC दिखाई नहीं दे रहा है और साइडबार बंद है, तो फ्लोटिंग आइकन दिखाएँ
                    if (!entry.isIntersecting && !tocSidebar.classList.contains('visible')) {
                         if(floatingTocIcon) floatingTocIcon.classList.add('visible');
                    } else {
                         if(floatingTocIcon) floatingTocIcon.classList.remove('visible');
                    }
                });
            }, observerOptions);

            tocButtonObserver.observe(tocButtonWrapper);
        }

        // --- साइडबार TOC कार्यक्षमता ---
        function openSidebar() {
            tocSidebar.classList.add('visible');
            tocSidebar.setAttribute('aria-hidden', 'false');
            document.body.classList.add('toc-sidebar-open');
            if(tocSidebarExternalClose) tocSidebarExternalClose.classList.add('visible');
             if(floatingTocIcon) floatingTocIcon.classList.remove('visible'); // साइडबार खुला होने पर फ्लोटिंग आइकन छिपाएँ

            // इंडिकेटर जांचें और फोकस सेट करें
            checkScrollIndicatorVisibility(tocSidebarScrollbox, sidebarScrollIndicator);
            setTimeout(() => tocSidebarInternalClose?.focus(), 50); // आंतरिक क्लोज बटन पर फोकस करें

            // बाहर क्लिक करने पर बंद करने के लिए श्रोता जोड़ें
             setTimeout(() => { // थोड़ी देरी के बाद जोड़ें ताकि प्रारंभिक क्लिक इसे बंद न करे
                 document.addEventListener('click', handleOutsideSidebarClick, true);
             }, 100);
        }

        function closeSidebar() {
            tocSidebar.classList.remove('visible');
            tocSidebar.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('toc-sidebar-open');
            if(tocSidebarExternalClose) tocSidebarExternalClose.classList.remove('visible');

            // यदि बटन TOC अभी भी ऑफ-स्क्रीन है तो फ्लोटिंग आइकन फिर से दिखाएँ
            if (tocButtonObserver && !tocButtonObserver.takeRecords()[0]?.isIntersecting) {
                // दोबारा जांचने के लिए एक छोटा विलंब दें कि क्या बटन TOC अभी भी दृश्यमान नहीं है
                setTimeout(() => {
                    const buttonEntry = new IntersectionObserver(entries => {
                        if (!entries[0].isIntersecting) {
                             if(floatingTocIcon) floatingTocIcon.classList.add('visible');
                        }
                         // एक बार जांच करने के बाद ऑब्जर्वर को डिस्कनेक्ट करें
                        buttonEntry.disconnect();
                    }).observe(tocButtonWrapper);
                }, 50); // CSS ट्रांज़िशन के बाद जांच करें
            }

            // बाहर क्लिक श्रोता हटाएं
            document.removeEventListener('click', handleOutsideSidebarClick, true);

            // फोकस वापस फ्लोटिंग आइकन पर ले जाएं (यदि यह मौजूद है)
             if(floatingTocIcon) floatingTocIcon.focus();
        }

        // साइडबार के बाहर क्लिक हैंडलर
        function handleOutsideSidebarClick(event) {
            // जांचें कि क्या क्लिक साइडबार या इसे खोलने वाले आइकन के बाहर हुआ है
             if (tocSidebar.classList.contains('visible') &&
                 !tocSidebar.contains(event.target) &&
                 event.target !== floatingTocIcon && // आइकन पर क्लिक करने से बंद नहीं होना चाहिए
                 !floatingTocIcon?.contains(event.target) && // आइकन के अंदर क्लिक करने से बंद नहीं होना चाहिए
                 event.target !== tocSidebarExternalClose &&
                 !tocSidebarExternalClose?.contains(event.target))
             {
                closeSidebar();
             }
        }

        // साइडबार खोलने/बंद करने के लिए इवेंट श्रोता
        if (floatingTocIcon) {
            floatingTocIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // बॉडी क्लिक को ट्रिगर होने से रोकें
                openSidebar();
            });
        }
        if (tocSidebarInternalClose) {
            tocSidebarInternalClose.addEventListener('click', closeSidebar);
        }
        if (tocSidebarExternalClose) {
            tocSidebarExternalClose.addEventListener('click', closeSidebar);
        }

        // एस्केप कुंजी से साइडबार बंद करें
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && tocSidebar.classList.contains('visible')) {
                closeSidebar();
            }
        });

        // --- TOC लिंक क्लिक हैंडलिंग और हाइलाइटिंग ---
        function handleTocLinkClick(event) {
            const linkElement = event.target.closest('a');
            if (linkElement && linkElement.dataset.targetId) {
                event.preventDefault(); // डिफ़ॉल्ट एंकर व्यवहार रोकें
                const targetId = linkElement.dataset.targetId;
                const targetElement = document.getElementById(targetId);

                // लिंक पर क्लिक प्रभाव लागू करें
                linkElement.classList.add('toc-link-clicked');
                setTimeout(() => {
                    linkElement.classList.remove('toc-link-clicked');
                }, clickEffectDuration);

                if (targetElement) {
                    // यदि साइडबार खुला है, तो स्क्रॉल करने से पहले इसे बंद करें (स्मूद अनुभव के लिए थोड़ा विलंब दें)
                    if (tocSidebar.classList.contains('visible')) {
                         // साइडबार बंद होने के बाद स्क्रॉल करें
                        closeSidebar();
                         // थोड़ा विलंब दें ताकि साइडबार के बंद होने का ट्रांज़िशन स्क्रॉल के साथ इंटरफेयर न करे
                        setTimeout(() => {
                            scrollToElement(targetElement);
                        }, 300); // साइडबार बंद होने के ट्रांज़िशन समय के करीब
                    } else {
                        // साइडबार बंद है, तुरंत स्क्रॉल करें
                        scrollToElement(targetElement);
                    }
                } else {
                    console.warn(`लक्ष्य तत्व आईडी के साथ नहीं मिला: ${targetId}`);
                }
            }
        }

        function scrollToElement(element) {
             const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - scrollOffset;
             window.scrollTo({
                 top: offsetTop,
                 behavior: 'smooth'
             });
             // स्क्रॉल पूरा होने के बाद हाइलाइट लागू करें
             // 'smooth' व्यवहार के लिए सटीक समय जानना मुश्किल है, इसलिए एक निश्चित विलंब का उपयोग करें
             setTimeout(() => {
                 applyHighlight(element);
                 // इतिहास बदलें ताकि URL हैश अपडेट हो जाए
                 // history.pushState(null, '', `#${element.id}`); // वैकल्पिक: यदि आप URL अपडेट करना चाहते हैं
             }, 700); // स्मूद स्क्रॉल के लिए अनुमानित समय
        }


        // TOC लिंक क्लिक के लिए इवेंट श्रोता (इवेंट डेलिगेशन)
        if (tocButtonList) tocButtonList.addEventListener('click', handleTocLinkClick);
        if (tocSidebarList) tocSidebarList.addEventListener('click', handleTocLinkClick);

        // --- हेडिंग और पैराग्राफ हाइलाइटिंग ---
        function applyHighlight(headingElement) {
            clearHighlight(); // पिछली हाइलाइट हटाएं

            headingElement.classList.add('toc-target-heading');
            currentlyHighlightedElements.push(headingElement);

            let nextElem = headingElement.nextElementSibling;
            const headingLevel = parseInt(headingElement.tagName.substring(1));

            // अगले हेडिंग तक (या समान/उच्च स्तर के हेडिंग तक) पैराग्राफ हाइलाइट करें
            while (nextElem) {
                const tagName = nextElem.tagName.toUpperCase();
                // यदि यह एक हेडिंग है, तो जांचें कि क्या यह हाइलाइटिंग समाप्त कर देता है
                if (tagName.startsWith('H')) {
                    const nextLevel = parseInt(tagName.substring(1));
                    if (nextLevel <= headingLevel) {
                        break; // समान या उच्च स्तर का हेडिंग मिला, रुकें
                    }
                }
                // यदि यह एक पैराग्राफ या संबंधित ब्लॉक तत्व है, तो हाइलाइट करें
                if (['P', 'UL', 'OL', 'DIV', 'BLOCKQUOTE', 'PRE'].includes(tagName)) {
                    nextElem.classList.add('toc-target-paragraph');
                    currentlyHighlightedElements.push(nextElem);
                }
                nextElem = nextElem.nextElementSibling;
            }

            // CSS متغیر से अवधि प्राप्त करें या फॉलबैक का उपयोग करें
             const highlightDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toc-popup-highlight-duration') || highlightDurationFallback / 1000) * 1000 || highlightDurationFallback;


            // हाइलाइट हटाने के लिए टाइमआउट सेट करें
            highlightTimeout = setTimeout(() => {
                currentlyHighlightedElements.forEach(el => {
                    el.classList.add('fading-out');
                    // फेड-आउट ट्रांज़िशन पूरा होने के बाद कक्षाएं हटाएं
                    setTimeout(() => {
                        el.classList.remove('toc-target-heading', 'toc-target-paragraph', 'fading-out');
                    }, 500); // CSS में ट्रांज़िशन अवधि से मेल खाना चाहिए
                });
                currentlyHighlightedElements = []; // ऐरे साफ़ करें
            }, highlightDuration - 500); // फेड-आउट ट्रांज़िशन समय घटाएं
        }

        function clearHighlight() {
            if (highlightTimeout) clearTimeout(highlightTimeout);
            highlightTimeout = null;
            currentlyHighlightedElements.forEach(el => {
                el.classList.remove('toc-target-heading', 'toc-target-paragraph', 'fading-out');
            });
            currentlyHighlightedElements = [];
        }

        // --- स्क्रॉल इंडिकेटर दृश्यता ---
        function checkScrollIndicatorVisibility(scrollbox, indicator) {
            if (!scrollbox || !indicator) return;

            let isVisible = false; // स्थानीय स्थिति ट्रैकर

            function check() {
                // बटन TOC के लिए विशेष मामला: यदि यह संक्षिप्त है तो इंडिकेटर छिपाएँ
                if (scrollbox === tocButtonScrollbox && tocButtonWrapper?.classList.contains('collapsed')) {
                    if (isVisible) {
                        indicator.classList.remove('visible');
                        isVisible = false;
                    }
                    return;
                }

                // क्या सामग्री स्क्रॉल करने योग्य है? (ऊंचाई में थोड़ा मार्जिन दें)
                const isScrollable = scrollbox.scrollHeight > scrollbox.clientHeight + 5;
                // क्या उपयोगकर्ता शीर्ष के पास है? (थोड़ा मार्जिन दें)
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

            // थोड़ी देर बाद प्रारंभिक जांच करें ताकि सामग्री लोड हो सके
            setTimeout(check, 250);

            // स्क्रॉल पर जांच करें (थ्रॉटलिंग के बिना, लेकिन निष्क्रिय)
            scrollbox.addEventListener('scroll', check, { passive: true });

             // बटन TOC टॉगल होने पर भी जांच करें
             if (scrollbox === tocButtonScrollbox && tocButtonHeader) {
                 tocButtonHeader.addEventListener('click', () => {
                     // ट्रांज़िशन पूरा होने के बाद जांच करने के लिए विलंब करें
                     setTimeout(check, 600); // max-height ट्रांज़िशन समय से थोड़ा अधिक
                 });
             }
             // साइडबार खुलने पर जांच करें
             if (scrollbox === tocSidebarScrollbox && floatingTocIcon) {
                 floatingTocIcon.addEventListener('click', () => {
                     setTimeout(check, 550); // साइडबार खुलने के ट्रांज़िशन के बाद
                 });
             }
        }
    });
