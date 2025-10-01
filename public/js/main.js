// Main JavaScript file for Boofbrain

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Boofbrain website loaded successfully!');

    // CTA Button functionality
    const ctaButton = document.getElementById('cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            alert('Welcome to Boofbrain! More features coming soon.');
        });
    }

    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            // In a real application, you would send this data to your server
            console.log('Form submitted:', { name, email, message });
            
            alert(`Thank you, ${name}! Your message has been received.`);
            contactForm.reset();
        });
    }

    // Add smooth scrolling to all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Check server health
    checkServerHealth();
});

// Function to check server health
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('Server status:', data);
    } catch (error) {
        console.error('Error checking server health:', error);
    }
}

// Add any additional JavaScript functionality here
