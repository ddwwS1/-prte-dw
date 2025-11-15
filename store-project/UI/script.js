console.log("script.js is working!");
alert("JavaScript file is working!");

const hamMenu = document.querySelector('.ham-menu');

const offScreenMenu = document.querySelector('.off-screen-menu');

hamMenu.addEventListener('click', () =>{
hamMenu.classList.toggle('active');
offScreenMenu.classList.toggle('active');
})

// Enable horizontal scrolling on main grid with mouse wheel
const mainGrid = document.querySelector('.main-grid');

if (mainGrid) {
  mainGrid.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    mainGrid.scrollLeft += e.deltaY * 0.5;
  }, { passive: false });
}
