console.log("script.js is working!");
alert("Your JavaScript file is linked!");

const hamMenu = document.querySelector('.ham-menu');

const offScreenMenu = document.querySelector('.off-screen-menu');

hamMenu.addEventListener('click', () =>{
hamMenu.classList.toggle('active');
offScreenMenu.classList.toggle('active');
})
