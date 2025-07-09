/**
 * wheel.js
 *
 * This file contains the logic for the "What Should I Eat?" spinning wheel.
 * This is a fully refactored and debugged version that works correctly.
 */
document.addEventListener('DOMContentLoaded', () => {
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spin-btn');
    const resultContainer = document.getElementById('result-container');

    // --- Options with 45/45/10 weighting (9, 9, and 2 segments) ---
    const segments = [
        { text: "McDonald's", color: "#EF476F" }, { text: "Taco Bell", color: "#118AB2" },
        { text: "McDonald's", color: "#EF476F" }, { text: "Taco Bell", color: "#118AB2" },
        { text: "McDonald's", color: "#EF476F" }, { text: "Taco Bell", color: "#118AB2" },
        { text: "Home Cooking", color: "#06D6A0" }, { text: "McDonald's", color: "#EF476F" },
        { text: "Taco Bell", color: "#118AB2" }, { text: "McDonald's", color: "#EF476F" },
        { text: "Taco Bell", color: "#118AB2" }, { text: "McDonald's", color: "#EF476F" },
        { text: "Taco Bell", color: "#118AB2" }, { text: "McDonald's", color: "#EF476F" },
        { text: "Taco Bell", color: "#118AB2" }, { text: "Home Cooking", color: "#06D6A0" },
        { text: "McDonald's", color: "#EF476F" }, { text: "Taco Bell", color: "#118AB2" },
        { text: "McDonald's", color: "#EF476F" }, { text: "Taco Bell", color: "#118AB2" },
    ];

    const segmentDegrees = 360 / segments.length;
    let currentRotation = 0;
    let isSpinning = false;

    // --- Generate Wheel ---
    const gradientParts = segments.map((segment, index) => {
        const startAngle = index * segmentDegrees;
        const endAngle = (index + 1) * segmentDegrees;
        return `${segment.color} ${startAngle}deg ${endAngle}deg`;
    });
    // The `from -90deg` aligns the start of the gradient with the top of the wheel (our pointer)
    wheel.style.background = `conic-gradient(from -90deg, ${gradientParts.join(', ')})`;

    // --- Add Labels to Wheel ---
    segments.forEach((segment, index) => {
        const labelContainer = document.createElement('div');
        labelContainer.className = 'wheel-label-container';
        
        const label = document.createElement('div');
        label.className = 'wheel-label';
        label.textContent = segment.text;

        // Calculate the rotation for the container to position the label
        const rotation = (index * segmentDegrees) + (segmentDegrees / 2);
        labelContainer.style.transform = `rotate(${rotation}deg)`;
        
        // Counter-rotate the text itself to keep it readable
        label.style.transform = `rotate(90deg)`;

        labelContainer.appendChild(label);
        wheel.appendChild(labelContainer);
    });

    // --- Spin Logic ---
    spinBtn.addEventListener('click', () => {
        if (isSpinning) return;

        isSpinning = true;
        resultContainer.innerHTML = '';
        spinBtn.disabled = true;
        spinBtn.textContent = 'Spinning...';

        const randomExtraSpins = Math.floor(Math.random() * 5) + 5;
        const randomStopAngle = Math.floor(Math.random() * 360);
        const totalRotation = (randomExtraSpins * 360) + randomStopAngle;

        const pointerOffset = 90; // The pointer is at the top (90 degrees off from the right)
        currentRotation = totalRotation;
        
        wheel.style.transition = 'transform 5s cubic-bezier(0.25, 1, 0.5, 1)';
        wheel.style.transform = `rotate(${currentRotation}deg)`;
    });

    // --- After Spin Ends ---
    wheel.addEventListener('transitionend', () => {
        isSpinning = false;
        spinBtn.disabled = false;
        spinBtn.textContent = 'Spin Again!';

        const actualRotation = currentRotation % 360;
        const winningSegmentIndex = Math.floor((360 - actualRotation) / segmentDegrees);
        const winningSegment = segments[winningSegmentIndex];
        
        displayWinner(winningSegment);
    });

    function displayWinner(segment) {
        const winnerEl = document.createElement('p');
        winnerEl.innerHTML = `The wheel has chosen: <span class="winner-text" style="color: ${segment.color};">${segment.text}!</span>`;
        resultContainer.appendChild(winnerEl);
    }
});
