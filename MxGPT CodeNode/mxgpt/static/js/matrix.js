// matrix.js - Core Matrix Effects and Functionality

// Initialize Matrix Rain Effect
function initMatrixRain() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '0';
    document.body.prepend(canvas);

    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Matrix characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
    const drops = Array(Math.floor(canvas.width / 20)).fill(0);

    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0';
        ctx.font = '15px monospace';

        drops.forEach((drop, i) => {
            const char = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(char, i * 20, drop * 20);
            
            if (drop * 20 > canvas.height || Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        });

        requestAnimationFrame(draw);
    }

    draw();
}

// Terminal Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize effects
    initMatrixRain();
    
    // Terminal cursor blink
    const input = document.getElementById('prompt-input');
    let cursorVisible = true;
    
    setInterval(() => {
        if (document.activeElement === input) {
            cursorVisible = !cursorVisible;
            input.style.borderColor = cursorVisible ? '#0f0' : 'transparent';
        }
    }, 500);

    // Enter key submission
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitPrompt();
        }
    });
});

// API Communication
async function submitPrompt() {
    const prompt = document.getElementById('prompt-input').value.trim();
    const output = document.getElementById('chat-output');
    
    if (!prompt) return;

    // Add user message
    output.innerHTML += `
        <div class="code-block">
            <span class="user-prompt">> USER:</span>
            <pre>${prompt}</pre>
        </div>
    `;

    // Show loading animation
    const loadingId = Date.now();
    output.innerHTML += `
        <div id="loading-${loadingId}" class="code-block">
            <span class="system-prompt">> SYSTEM:</span>
            <span class="loading-dots"></span>
        </div>
    `;

    // Animate loading dots
    animateLoadingDots(loadingId);

    try {
        // Get CSRF token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        // Make API request
        const response = await fetch('/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrfToken
            },
            body: `prompt=${encodeURIComponent(prompt)}`
        });

        const data = await response.json();
        
        // Remove loading animation
        document.getElementById(`loading-${loadingId}`).remove();
        
        // Add system response
        output.innerHTML += `
            <div class="code-block">
                <span class="system-prompt">> CODEGPT:</span>
                <pre>${data.response}</pre>
            </div>
        `;

        // Clear input and scroll
        document.getElementById('prompt-input').value = '';
        output.scrollTop = output.scrollHeight;

    } catch (error) {
        console.error('Matrix System Error:', error);
        document.getElementById(`loading-${loadingId}`).remove();
        output.innerHTML += `
            <div class="code-block error">
                > SYSTEM ERROR: Connection to DeepSeek failed
            </div>
        `;
    }
}

function animateLoadingDots(id) {
    let dots = 0;
    const element = document.getElementById(`loading-${id}`).querySelector('.loading-dots');
    
    const interval = setInterval(() => {
        dots = (dots + 1) % 4;
        element.textContent = '.'.repeat(dots);
    }, 500);

    // Clear when removed
    element.dataset.interval = interval;
}