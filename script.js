function showNextImage() {
    const carousel = document.querySelector('.carousel');
    const firstImage = carousel.querySelector('img');
    
    carousel.style.transition = 'transform 0.5s ease-in-out';
    carousel.style.transform = 'translateX(-25%)';
    
    setTimeout(() => {
        carousel.style.transition = 'none';
        carousel.appendChild(firstImage.cloneNode(true));
        carousel.removeChild(firstImage);
        carousel.style.transform = 'translateX(0)';
    }, 500);
}
setInterval(showNextImage, 3000);
