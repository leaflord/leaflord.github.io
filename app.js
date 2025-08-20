class FocusTimer {
    constructor() {
        this.focusTime = 25 * 60; // 25 minutes in seconds
        this.currentTime = this.focusTime;
        this.totalTime = this.focusTime;
        this.isRunning = false;
        this.isBreakMode = false;
        this.sessionCount = 0;
        this.intervalId = null;
        
        this.initializeElements();
        this.bindEvents();
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
            this.currentTime--;
            this.updateDisplay();
            
            if (this.currentTime <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }
    
    stopTimer() {
        this.isRunning = false;
        this.startStopBtn.textContent = 'Start';
        this.statusText.textContent = 'Paused';
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    resetTimer() {
        this.stopTimer();
        
        if (this.isBreakMode) {
            // Reset to focus mode
            this.isBreakMode = false;
            this.currentTime = this.focusTime;
            this.totalTime = this.focusTime;
            this.timerLabel.textContent = 'Focus Time';
            this.container.classList.remove('break-mode');
        } else {
            // Reset focus timer
            this.currentTime = this.focusTime;
            this.totalTime = this.focusTime;
        }
        
        this.statusText.textContent = 'Ready';
        this.updateDisplay();
    }
    
    timerComplete() {
        this.stopTimer();
        
        if (!this.isBreakMode) {
            // Focus session completed, start break
            this.sessionCount++;
            this.sessionCountEl.textContent = this.sessionCount;
            
            const breakTime = Math.floor(this.focusTime / 3); // 1/3 of focus time
            this.currentTime = breakTime;
            this.totalTime = breakTime;
            this.isBreakMode = true;
            
            this.timerLabel.textContent = 'Break Time';
            this.container.classList.add('break-mode');
            this.statusText.textContent = 'Break Started!';
            
            // Auto-start break timer
            setTimeout(() => this.startTimer(), 1000);
            
            // Show notification
            this.showNotification('Focus session complete!', 'Time for a break 🎉');
        } else {
            // Break completed, return to focus mode
            this.isBreakMode = false;
            this.currentTime = this.focusTime;
            this.totalTime = this.focusTime;
            
            this.timerLabel.textContent = 'Focus Time';
            this.container.classList.remove('break-mode');
            this.statusText.textContent = 'Break Complete!';
            
            // Show notification
            this.showNotification('Break complete!', 'Ready for another focus session? 💪');
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        
        this.timeDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress bar
        const progress = ((this.totalTime - this.currentTime) / this.totalTime) * 100;
        this.progressFill.style.width = `${progress}%`;
        
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
