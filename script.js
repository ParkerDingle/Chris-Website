document.addEventListener("DOMContentLoaded", () => {
   // Select all navigation links and content sections
   const tabLinks = document.querySelectorAll('.tab-link');
   const tabContents = document.querySelectorAll('.tab-content');


   // Add interaction to navigation tabs
   tabLinks.forEach(link => {
       link.addEventListener('click', function(e) {
           e.preventDefault();


           // Remove active status from all links and content
           tabLinks.forEach(item => item.classList.remove('active'));
           tabContents.forEach(content => content.classList.remove('active-tab'));


           // Add active status to the clicked link
           this.classList.add('active');


           // Find and display the corresponding section
           const targetId = this.getAttribute('data-target');
           const targetSection = document.getElementById(targetId);
          
           if (targetSection) {
               targetSection.classList.add('active-tab');
              
               // Add a slight scroll effect if on mobile to ensure content is visible
               if (window.innerWidth <= 768) {
                   window.scrollTo({ top: targetSection.offsetTop - 100, behavior: 'smooth' });
               }
           }
       });
   });
});
