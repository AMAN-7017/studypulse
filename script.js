class StudyTracker {
  constructor() {
    this.sessions = this.loadSessions();
    this.timer = null;
    this.isRunning = false;
    this.seconds = 0;
    this.chart = null;
    this.startTime = 0;

    this.initDOMReferences();
    this.initEventListeners();
    this.initChart();
    this.updateUI();
  }

  initDOMReferences() {
    this.dom = {
      timer: document.getElementById("timer"),
      startBtn: document.getElementById("startBtn"),
      stopBtn: document.getElementById("stopBtn"),
      resetBtn: document.getElementById("resetBtn"),
      sessionLog: document.getElementById("sessionLog"),
      totalHours: document.getElementById("totalHours"),
      dailyAverage: document.getElementById("dailyAverage"),
      currentStreak: document.getElementById("currentStreak"),
      chart: document.getElementById("progressChart").getContext("2d"),
    };
  }

  initEventListeners() {
    this.dom.startBtn.addEventListener("click", () => this.startTimer());
    this.dom.stopBtn.addEventListener("click", () => this.stopTimer());
    this.dom.resetBtn.addEventListener("click", () => this.confirmReset());
  }

  // Core timer functionality
  startTimer() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.startTime = new Date().getTime();
      this.timer = setInterval(() => this.updateTimer(), 1000);
      this.toggleButtonStates();
    }
  }

  stopTimer() {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.timer);
      if (this.seconds > 5) this.saveSession();
      this.seconds = 0;
      this.updateDisplay();
      this.toggleButtonStates();
    }
  }

  updateTimer() {
    this.seconds = Math.round((new Date().getTime() - this.startTime) / 1000);
    this.updateDisplay();
  }

  // Data management
  loadSessions() {
    try {
      return JSON.parse(localStorage.getItem("studySessions")) || [];
    } catch (error) {
      console.error("Error loading sessions:", error);
      return [];
    }
  }

  saveSession() {
    const session = {
      timestamp: Date.now(),
      duration: this.seconds,
    };

    this.sessions.push(session);
    localStorage.setItem("studySessions", JSON.stringify(this.sessions));
    this.updateUI();
  }

  // UI updates
  updateDisplay() {
    const hours = Math.floor(this.seconds / 3600);
    const minutes = Math.floor((this.seconds % 3600) / 60);
    const seconds = this.seconds % 60;

    this.dom.timer.textContent =
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;
  }

  updateUI() {
    this.updateSessionLog();
    this.updateStats();
    this.updateChart();
  }

  updateSessionLog() {
    this.dom.sessionLog.innerHTML = this.sessions
      .map((session) => this.createSessionElement(session))
      .reverse()
      .join("");
  }

  createSessionElement(session) {
    const date = new Date(session.timestamp);
    return `
            <div class="session-item">
                <span class="session-date">
                    ${date.toLocaleDateString()} • 
                    ${date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </span>
                <span class="session-duration">
                    ${this.formatDuration(session.duration)}
                </span>
            </div>
        `;
  }

  // Statistics calculations
  updateStats() {
    this.dom.totalHours.textContent = `${(
      this.sessions.reduce((acc, s) => acc + s.duration, 0) / 3600
    ).toFixed(1)}h`;

    this.dom.dailyAverage.textContent = `${this.calculateDailyAverage().toFixed(
      1
    )}h`;

    this.dom.currentStreak.textContent = this.calculateCurrentStreak();
  }

  calculateDailyAverage() {
    if (this.sessions.length === 0) return 0;
    const firstDate = new Date(this.sessions[0].timestamp);
    const days = Math.ceil((Date.now() - firstDate) / (1000 * 3600 * 24)) || 1;
    return this.sessions.reduce((acc, s) => acc + s.duration, 0) / 3600 / days;
  }

  calculateCurrentStreak() {
    // Implementation logic for streak calculation
    return "3"; // Placeholder
  }

  // Chart implementation
  initChart() {
    this.chart = new Chart(this.dom.chart, {
      type: "line",
      data: {
        labels: this.getWeekLabels(),
        datasets: [
          {
            label: "Study Time (hours)",
            data: this.getWeeklyData(),
            borderColor: "rgba(79, 70, 229, 1)",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 400);
              gradient.addColorStop(0, "rgba(79, 70, 229, 0.2)");
              gradient.addColorStop(1, "rgba(79, 70, 229, 0.01)");
              return gradient;
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 0.5,
              callback: (value) => `${value}h`,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y.toFixed(1)} hours studied`,
            },
          },
        },
      },
    });
  }

  updateChart() {
    if (this.chart) {
      this.chart.data.labels = this.getWeekLabels();
      this.chart.data.datasets[0].data = this.getWeeklyData();
      this.chart.update();
    }
  }

  getWeekLabels() {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + i + 1);
      return date.toLocaleDateString("en-US", { weekday: "short" });
    });
  }

  getWeeklyData() {
    const now = new Date();
    const startOfWeek = new Date(
      now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
    );
    startOfWeek.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + index);

      return (
        this.sessions.reduce((total, session) => {
          const sessionDate = new Date(session.timestamp);
          return sessionDate >= day &&
            sessionDate < new Date(day.getTime() + 86400000)
            ? total + session.duration
            : total;
        }, 0) / 3600
      );
    });
  }

  // Utility methods
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  toggleButtonStates() {
    this.dom.startBtn.disabled = this.isRunning;
    this.dom.stopBtn.disabled = !this.isRunning;
  }

  confirmReset() {
    if (confirm("Are you sure you want to reset all data?")) {
      localStorage.removeItem("studySessions");
      this.sessions = [];
      this.seconds = 0;
      this.updateUI();
      this.updateDisplay();
    }
  }
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  new StudyTracker();
});
