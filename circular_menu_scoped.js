// circle-menu.js

// सुनिश्चित करें कि DOM पूरी तरह से लोड हो गया है
document.addEventListener('DOMContentLoaded', function() {

    // सुनिश्चित करें कि JS कोड यूनिक आईडी के अंदर के एलिमेंट को टारगेट करे
    const menuWidget = document.getElementById('my-unique-circle-menu');

    // यदि विजेट मौजूद है, तभी आगे बढ़ें
    if (menuWidget) {
        // मेन्यू टॉगल बटन और मेन्यू एलिमेंट्स प्राप्त करें (विजेट के अंदर से)
        const menuToggle = menuWidget.querySelector('.menu-toggle');
        const categoriesMenu = menuWidget.querySelector('.menu-categories');
        const linksMenu = menuWidget.querySelector('.menu-links');
        // सुनिश्चित करें कि ये एलिमेंट मौजूद हैं, अन्यथा त्रुटि आ सकती है
        const linksTitle = linksMenu ? linksMenu.querySelector('.links-title') : null;
        const categoryTitleElement = categoriesMenu ? categoriesMenu.querySelector('.category-title') : null;

        // सभी कैटेगरी एलिमेंट्स प्राप्त करें (विजेट के अंदर से)
        const categories = menuWidget.querySelectorAll('.category');

        // सभी लिंक्स कंटेंट एलिमेंट्स प्राप्त करें (विजेट के अंदर से)
        const linksContent = menuWidget.querySelectorAll('.links-content .links');

        // आइकन मैपिंग (यह वही रहेगा)
        const categoryIcons = {
            'class-1-5': '<i class="fas fa-book-reader"></i>', 'class-6-8': '<i class="fas fa-graduation-cap"></i>',
            'class-9-10': '<i class="fas fa-school"></i>', 'class-11-12': '<i class="fas fa-university"></i>',
            'competitive-exam': '<i class="fas fa-trophy"></i>', 'news-channel': '<i class="fas fa-newspaper"></i>',
            'yoga-ayurveda': '<i class="fas fa-heart"></i>', 'marriage-links': '<i class="fas fa-ring"></i>',
            'editorial-links': '<i class="fas fa-edit"></i>', 'government-links': '<i class="fas fa-flag"></i>',
            'astrology-links': '<i class="fas fa-star"></i>', 'vaidik-links': '<i class="fas fa-om"></i>'
        };

        // Gradient classes (यह वही रहेगा)
        const gradientClasses = [
            'gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5', 'gradient-6',
            'gradient-7', 'gradient-8', 'gradient-9', 'gradient-10', 'gradient-11', 'gradient-12'
        ];

        // Function to remove all gradient classes (यह वही रहेगा)
        function removeGradientClasses(element) {
             if (element) { // Check if element exists
                 gradientClasses.forEach(cls => element.classList.remove(cls));
             }
         }

        // --- इवेंट लिस्टनर्स ---

        // मेन्यू टॉगल बटन पर क्लिक इवेंट जोड़ें
        if (menuToggle && categoriesMenu && linksMenu && categoryTitleElement) {
            menuToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                const isActive = categoriesMenu.classList.contains('active');

                if (isActive) {
                    categoriesMenu.classList.remove('active');
                    linksMenu.classList.remove('show');
                    categoryTitleElement.style.display = 'none';
                } else {
                    linksMenu.classList.remove('show');
                    categoriesMenu.classList.add('active');
                    categoryTitleElement.style.display = 'block';
                    removeGradientClasses(categoryTitleElement);
                    const randomGradientIndex = Math.floor(Math.random() * gradientClasses.length);
                    categoryTitleElement.classList.add(gradientClasses[randomGradientIndex]);
                    categoryTitleElement.innerHTML = '<i class="fas fa-hand-point-down"></i> अपनी पसंद पर क्लिक करें';
                }
            });
        }

         // हर कैटेगरी के लिए क्लिक इवेंट जोड़ें
         if (categories.length > 0 && linksMenu && linksTitle && categoriesMenu && categoryTitleElement) {
             categories.forEach((category, index) => {
                 category.addEventListener('click', (event) => {
                     event.stopPropagation();

                     const categoryData = category.getAttribute('data-category');
                     const titleText = category.getAttribute('data-title');
                     const iconHtml = categoryIcons[categoryData] || '<i class="fas fa-link"></i>';

                     // सभी लिंक्स सेक्शन छिपाएं
                     linksContent.forEach(linkBox => {
                         linkBox.style.display = 'none';
                     });

                     // सही लिंक्स सेक्शन दिखाएं (विजेट के अंदर से)
                     const targetLinks = linksMenu.querySelector(`.links-content .${categoryData}`);
                     if (targetLinks) {
                         targetLinks.style.display = 'block';
                     } // वार्निंग हटा दी गई, अगर नहीं मिलता है तो कुछ नहीं होगा

                     // लिंक्स टाइटल अपडेट करें
                     linksTitle.innerHTML = `${iconHtml} ${titleText}`;

                     // लिंक्स टाइटल पर स्पेसिफिक ग्रेडिएंट बॉर्डर लागू करें
                     removeGradientClasses(linksTitle);
                     linksTitle.classList.add(gradientClasses[index % gradientClasses.length]);

                     // मेन्यू छिपाएं और दिखाएं
                     categoriesMenu.classList.remove('active');
                     linksMenu.classList.add('show');
                     categoryTitleElement.style.display = 'none';
                 });
             });
         }

        // डॉक्यूमेंट पर कहीं और क्लिक होने पर मेन्यू छिपाने के लिए इवेंट जोड़ें
        document.addEventListener('click', (event) => {
            // Ensure elements exist before checking contains
            if (menuToggle && categoriesMenu && linksMenu && categoryTitleElement) {
                 if (
                    !menuToggle.contains(event.target) &&
                    !categoriesMenu.contains(event.target) &&
                    !linksMenu.contains(event.target)
                 ) {
                    categoriesMenu.classList.remove('active');
                    linksMenu.classList.remove('show');
                    categoryTitleElement.style.display = 'none';
                 }
            }
        });

    } // End if (menuWidget)
}); // End DOMContentLoaded listener
