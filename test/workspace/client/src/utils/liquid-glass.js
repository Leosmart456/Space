export function initLiquidGlassEffect() {
  const liquidGlassElements = document.querySelectorAll('.liquid-glass');
  
  liquidGlassElements.forEach(element => {
    const shine = element.querySelector('.liquid-glass-shine');
    if (!shine) return;
    
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const deltaX = (x - centerX) / centerX;
      const deltaY = (y - centerY) / centerY;
      
      const moveX = deltaX * 15;
      const moveY = deltaY * 15;
      
      shine.style.transform = `translate(${moveX}px, ${moveY}px)`;
      shine.style.opacity = '0.9';
    });
    
    element.addEventListener('mouseleave', () => {
      shine.style.transform = 'translate(0, 0)';
      shine.style.opacity = '0.7';
    });
  });
}

export function applyLiquidGlassToElement(element) {
  if (!element) return;
  
  const shine = element.querySelector('.liquid-glass-shine');
  if (!shine) return;
  
  element.addEventListener('mousemove', (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;
    
    const moveX = deltaX * 15;
    const moveY = deltaY * 15;
    
    shine.style.transform = `translate(${moveX}px, ${moveY}px)`;
    shine.style.opacity = '0.9';
  });
  
  element.addEventListener('mouseleave', () => {
    shine.style.transform = 'translate(0, 0)';
    shine.style.opacity = '0.7';
  });
}
