class FocusTimer {
    constructor() {
        this.currentTime = 0; // Start at 0 for stopwatch
        this.elapsedFocusTime = 0; // Track elapsed focus time for break calculation
        this.isRunning = false;
        this.isBreakMode = false;
        this.sessionCount = 0;
        this.intervalId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.createAudioContext();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.timeDisplay = document.getElementById('timeDisplay');
        this.timerLabel = document.getElementById('timerLabel');
        this.startStopBtn = document.getElementById('startStopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.progressFill = document.getElementById('progressFill');
        this.sessionCountEl = document.getElementById('sessionCount');
        this.statusText = document.getElementById('statusText');
        this.container = document.querySelector('.container');
    }
    
    bindEvents() {
        this.startStopBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.startStopBtn.textContent = 'Stop';
        this.statusText.textContent = this.isBreakMode ? 'Break Time' : 'Focusing...';
        
        this.intervalId = setInterval(() => {
            if (this.isBreakMode) {
                this.currentTime--;
                if (this.currentTime <= 0) {
                    this.stopTimer();
                    this.completeBreak();
                }
            } else {
                this.currentTime++;
            }
            this.updateDisplay();
        }, 1000);
    }
    
    stopTimer() {
        this.isRunning = false;
        this.startStopBtn.textContent = 'Start';
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // If stopping during focus mode and there's elapsed time, start break automatically
        if (!this.isBreakMode && this.currentTime > 0) {
            this.statusText.textContent = 'Focus Complete!';
            setTimeout(() => this.startBreak(), 1000);
        } else {
            this.statusText.textContent = 'Paused';
        }
    }
    
    resetTimer() {
        // Stop timer without triggering break
        this.isRunning = false;
        this.startStopBtn.textContent = 'Start';
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.isBreakMode) {
            // Reset to focus mode
            this.isBreakMode = false;
            this.currentTime = 0;
            this.elapsedFocusTime = 0;
            this.timerLabel.textContent = 'Focus Time';
            this.container.classList.remove('break-mode');
        } else {
            // Reset focus timer
            this.currentTime = 0;
            this.elapsedFocusTime = 0;
        }
        
        this.statusText.textContent = 'Ready';
        this.updateDisplay();
    }
    
    startBreak() {
        // Store elapsed focus time and start break
        this.elapsedFocusTime = this.currentTime;
        this.sessionCount++;
        this.sessionCountEl.textContent = this.sessionCount;
        
        const breakTime = Math.floor(this.elapsedFocusTime / 3); // 1/3 of elapsed focus time
        this.currentTime = breakTime; // Start break countdown from calculated time
        this.isBreakMode = true;
        
        this.timerLabel.textContent = `Break Time (${Math.floor(breakTime / 60)}:${(breakTime % 60).toString().padStart(2, '0')})`;
        this.container.classList.add('break-mode');
        this.statusText.textContent = 'Break Started!';
        
        // Auto-start break countdown
        setTimeout(() => this.startTimer(), 1000);
        
        // Show notification
        this.showNotification('Focus session complete!', `Time for a ${Math.floor(breakTime / 60)}:${(breakTime % 60).toString().padStart(2, '0')} break 🎉`);
    }
    
    completeBreak() {
        // Break completed, return to focus mode
        this.isBreakMode = false;
        this.currentTime = 0;
        this.elapsedFocusTime = 0;
        
        this.timerLabel.textContent = 'Focus Time';
        this.container.classList.remove('break-mode');
        this.statusText.textContent = 'Break Complete!';
        
        // Play beep and vibrate when break ends
        this.playBeep();
        this.triggerVibration();
        
        // Show notification
        this.showNotification('Break complete!', 'Ready for another focus session? 💪');
        
        this.updateDisplay();
    }
    
    createAudioContext() {
        // Create audio context for beep sound
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio context not supported');
            this.audioContext = null;
        }
    }
    
    playBeep() {
        if (!this.audioContext) return;
        
        // Create a beep sound using Web Audio API
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Configure beep sound (800Hz for 300ms)
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Fade in and out to avoid clicks
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    triggerVibration() {
        // Vibrate on mobile devices if supported
        if ('vibrate' in navigator) {
            // Vibrate pattern: vibrate for 200ms, pause 100ms, vibrate 200ms
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        
        this.timeDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress bar - for stopwatch mode, show continuous progress
        if (this.isBreakMode) {
            // For break mode, show countdown progress
            const breakDuration = Math.floor(this.elapsedFocusTime / 3);
            const progress = ((breakDuration - this.currentTime) / breakDuration) * 100;
            this.progressFill.style.width = `${Math.max(0, progress)}%`;
        } else {
            // For focus mode, show elapsed time as continuous progress (no fixed end)
            // Use a visual representation that grows with time
            const progress = Math.min((this.currentTime / 1800) * 100, 100); // Cap at 30 minutes for visual purposes
            this.progressFill.style.width = `${progress}%`;
        }
        
        // Update document title for tab visibility
        document.title = `${this.timeDisplay.textContent} - Focus Timer`;
    }
    
    showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏱️</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏱️</text></svg>'
            });
        }
    }
    
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const timer = new FocusTimer();
    
    // Request notification permission after a short delay
    setTimeout(() => {
        timer.requestNotificationPermission();
    }, 2000);
});

// Handle page visibility changes to pause/resume timer appropriately
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, could pause timer or just continue running
        console.log('Page hidden');
    } else {
        // Page is visible again
        console.log('Page visible');
    }
});
