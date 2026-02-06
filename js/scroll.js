// ===== SILKEMYKE FADE-IN + EKSTRA SMOOTH SCROLL =====
const faders = document.querySelectorAll('.fade-in');
const revealElements = document.querySelectorAll('.reveal');

const appearOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -100px 0px" // starter animasjon litt tidligere = bedre følelse
};

const appearOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('show');
        observer.unobserve(entry.target); // stopper etter første visning
    });
}, appearOptions);

const revealOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('active');
        observer.unobserve(entry.target);
    });
}, appearOptions);

// Start observasjon
faders.forEach(fader => appearOnScroll.observe(fader));
revealElements.forEach(el => revealOnScroll.observe(el));

// ===== EKSTRA: Gjør all scrolling på siden helt silkemyk =====
document.documentElement.style.scrollBehavior = 'smooth';

// ===== VALGFRI BONUS: Fade-in hele siden når du kommer fra jay.html / martin.html =====
window.addEventListener('pageshow', (e) => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    requestAnimationFrame(() => {
        document.body.style.opacity = '1';
    });
});