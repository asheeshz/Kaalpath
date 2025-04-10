// Scoped JavaScript for Circular Menu Widget

// Wait for the DOM to be fully loaded to ensure all elements are available
document.addEventListener('DOMContentLoaded', () => {

    // Get the main widget container using its unique ID
    const widgetContainer = document.getElementById('circle-menu-widget-ash');

    // Only proceed if the widget container element exists in the DOM
    if (widgetContainer) {
        // Select elements *inside* the widget container
        const menuToggle = widgetContainer.querySelector('.menu-toggle');
        const categoriesMenu = widgetContainer.querySelector('.menu-categories');
        const linksMenu = widgetContainer.querySelector('.menu-links');

        // Check if core menu elements exist before trying to select sub-elements
        if (categoriesMenu && linksMenu) {
            const linksTitle = linksMenu.querySelector('.links-title');
            const categoryTitleElement = categoriesMenu.querySelector('.category-title');
            const categories = widgetContainer.querySelectorAll('.category'); // Select all category divs within the container
            const linksContent = widgetContainer.querySelectorAll('.links-content .links'); // Select all links divs within the container

            // Icon mapping (remains the same)
            const categoryIcons = {
                'class-1-5': '<i class="fas fa-book-reader"></i>', 'class-6-8': '<i class="fas fa-graduation-cap"></i>',
                'class-9-10': '<i class="fas fa-school"></i>', 'class-11-12': '<i class="fas fa-university"></i>',
                'competitive-exam': '<i class="fas fa-trophy"></i>', 'news-channel': '<i class="fas fa-newspaper"></i>',
                'yoga-ayurveda': '<i class="fas fa-heart"></i>', 'marriage-links': '<i class="fas fa-ring"></i>',
                'editorial-links': '<i class="fas fa-edit"></i>', 'government-links': '<i class="fas fa-flag"></i>',
                'astrology-links': '<i class="fas fa-star"></i>', 'vaidik-links': '<i class="fas fa-om"></i>'
            };

            // Gradient classes (remains the same)
            const gradientClasses = [
                'gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5', 'gradient-6',
                'gradient-7', 'gradient-8', 'gradient-9', 'gradient-10', 'gradient-11', 'gradient-12'
            ];

            // Function to remove all gradient classes (remains the same)
            function removeGradientClasses(element) {
                 if (element) { // Check if element exists
                    gradientClasses.forEach(cls => element.classList.remove(cls));
                 }
             }

            // Add click event listener to the menu toggle button
            // Ensure all required elements exist before adding the listener
            if (menuToggle && categoriesMenu && linksMenu && categoryTitleElement && linksTitle) {
                menuToggle.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent click from bubbling up to the document
                    const isActive = categoriesMenu.classList.contains('active');

                    if (isActive) {
                        // Close categories menu and links menu
                        categoriesMenu.classList.remove('active');
                        linksMenu.classList.remove('show');
                        categoryTitleElement.style.display = 'none';
                    } else {
                         // Close links menu first (if open)
                         linksMenu.classList.remove('show');
                         // Open categories menu
                         categoriesMenu.classList.add('active');
                         // Show and update category title
                         categoryTitleElement.style.display = 'block';
                         removeGradientClasses(categoryTitleElement);
                         const randomGradientIndex = Math.floor(Math.random() * gradientClasses.length);
                         categoryTitleElement.classList.add(gradientClasses[randomGradientIndex]);
                         categoryTitleElement.innerHTML = '<i class="fas fa-hand-point-down"></i> अपनी पसंद पर क्लिक करें';
                    }
                });
            } else {
                 console.error("Circular Menu Widget Error: Could not find essential toggle/menu elements.");
            }


             // Add click event listener to each category icon
             categories.forEach((category, index) => {
                 category.addEventListener('click', (event) => {
                     event.stopPropagation(); // Prevent click from bubbling up

                     const categoryData = category.getAttribute('data-category');
                     const titleText = category.getAttribute('data-title');
                     const iconHtml = categoryIcons[categoryData] || '<i class="fas fa-link"></i>'; // Default icon

                     // Hide all specific link sections first
                     linksContent.forEach(linkBox => {
                         linkBox.style.display = 'none';
                     });

                     // Find and show the target link section within the linksMenu
                     const targetLinks = linksMenu.querySelector(`.links-content .${categoryData}`);
                     if (targetLinks) {
                         targetLinks.style.display = 'block';
                     } else {
                          console.warn(`Circular Menu Widget Warning: No link section found for category "${categoryData}"`);
                     }

                     // Update the title of the links box
                     if(linksTitle) {
                        linksTitle.innerHTML = `${iconHtml} ${titleText}`;
                        // Apply specific gradient border to the links title
                        removeGradientClasses(linksTitle);
                        linksTitle.classList.add(gradientClasses[index % gradientClasses.length]); // Cycle through gradients
                     }

                     // Hide categories menu and show the links menu
                     if(categoriesMenu && linksMenu && categoryTitleElement) {
                        categoriesMenu.classList.remove('active');
                        linksMenu.classList.add('show');
                        categoryTitleElement.style.display = 'none'; // Hide the main category title
                     }
                 });
             });


            // Add click listener to the document to close menus if clicked outside
            // This listener remains on the document, not scoped to the widget
            document.addEventListener('click', (event) => {
                 // Check if the necessary elements exist before accessing their properties/methods
                 if (menuToggle && categoriesMenu && linksMenu && categoryTitleElement) {
                     // Check if the click target is outside the toggle button AND outside the category menu AND outside the links menu
                     if (
                         !menuToggle.contains(event.target) &&
                         !categoriesMenu.contains(event.target) &&
                         !linksMenu.contains(event.target)
                     ) {
                         // If clicked outside, close both menus
                         categoriesMenu.classList.remove('active');
                         linksMenu.classList.remove('show');
                         categoryTitleElement.style.display = 'none';
                     }
                 }
            });

        } else {
             console.error("Circular Menu Widget Error: Could not find categories or links menu container.");
        }

    } else {
        console.error("Circular Menu Widget container (#circle-menu-widget-ash) not found in the DOM!");
    }

}); // End of DOMContentLoaded listener
