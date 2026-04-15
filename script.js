// script.js

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

    // Check for saved theme or default to light
    const currentTheme = localStorage.getItem('theme') || 'light';

    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeIcon) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');

            if (theme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                if (themeIcon) {
                    themeIcon.classList.replace('fa-sun', 'fa-moon');
                }
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if (themeIcon) {
                    themeIcon.classList.replace('fa-moon', 'fa-sun');
                }
            }
        });
    }

    // Set active link based on current path
    const navLinks = document.querySelectorAll('.nav-links a');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // -------------------------------------------------
    // Hamburger Menu Logic (Mobile Responsive)
    // -------------------------------------------------
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinksContainer = document.getElementById('nav-links');

    if (hamburgerBtn && navLinksContainer) {
        hamburgerBtn.addEventListener('click', () => {
            // Toggle the menu-open class
            navLinksContainer.classList.toggle('menu-open');
            // Toggle icon between bars and xmark
            const icon = hamburgerBtn.querySelector('i');
            if (navLinksContainer.classList.contains('menu-open')) {
                icon.classList.replace('fa-bars', 'fa-xmark');
            } else {
                icon.classList.replace('fa-xmark', 'fa-bars');
            }
        });
    }

    // -------------------------------------------------
    // Real-time data is now handled by firebase-config.js
    // The old simulated data code has been removed.
    // -------------------------------------------------

    // Multi-Language Logic
    const langSwitcher = document.getElementById('language-switcher');

    const applyTranslations = (lang) => {
        if (!translations[lang]) return;

        // Find all nodes with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang][key]) {
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    // special case for placeholders but we skip for now unless needed
                } else {
                    element.innerHTML = translations[lang][key];
                }
            }
        });

        // Also update the select dropdown value if present
        if (langSwitcher) {
            langSwitcher.value = lang;
        }
    };

    const savedLang = localStorage.getItem('language') || 'en';
    applyTranslations(savedLang);

    if (langSwitcher) {
        langSwitcher.addEventListener('change', (e) => {
            const newLang = e.target.value;
            localStorage.setItem('language', newLang);
            applyTranslations(newLang);
        });
    }
});
