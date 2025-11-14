console.log("script.js is working!");
alert("JavaScript file is working!");

const hamMenu = document.querySelector('.ham-menu');

const offScreenMenu = document.querySelector('.off-screen-menu');

hamMenu.addEventListener('click', () =>{
hamMenu.classList.toggle('active');
offScreenMenu.classList.toggle('active');
})
