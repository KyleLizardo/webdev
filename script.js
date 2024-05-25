const primaryHeader = document.querySelector('.primary-header')
const scrollWatcher = document.createElement('div');
 
scrollWatcher.setAttribute('data-scroll-watcher', '');
primaryHeader.before(scrollWatcher);

const navObserver = new IntersectionObserver((entries) => {
    primaryHeader.classList.toggle('sticking', !entries[0].isIntersecting)
});

navObserver.observe(scrollWatcher)



document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-list a');

    function setActiveLink() {
        let index = sections.length;

        while (--index && window.scrollY + 50 < sections[index].offsetTop) {}

        navLinks.forEach((link) => link.classList.remove('active'));
        navLinks[index].classList.add('active');
    }

    setActiveLink();
    window.addEventListener('scroll', setActiveLink);

    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            navLinks.forEach((link) => link.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
});