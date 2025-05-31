const morseCode = {
    'A': '.-',
    'B': '-...',
    'C': '-.-.',
    'D': '-..',
    'E': '.',
    'F': '..-.',
    'G': '--.',
    'H': '....',
    'I': '..',
    'J': '.---',
    'K': '-.-',
    'L': '.-..',
    'M': '--',
    'N': '-.',
    'O': '---',
    'P': '.--.',
    'Q': '--.-',
    'R': '.-.',
    'S': '...',
    'T': '-',
    'U': '..-',
    'V': '...-',
    'W': '.--',
    'X': '-..-',
    'Y': '-.--',
    'Z': '--..'
};

const winningNotes = [523.25, 659.25, 783.99]; // C5, E5, G5 (a C major arpeggio)
const losingNotes  = [392.00, 329.63, 261.63]; // G4, E4, C4

PetiteVue.createApp({
    currentLetter: 'A',
    currentMorse: '',
    audioContext: null,
    oscillator: null,
    gainNode: null,
    startTime: 0,
    timeout: null,
    stopBeep: function() {        
        const duration = Date.now() - this.startTime;
        if (duration < 200) {
            this.currentMorse += '.'; // Dot
        } else {
            this.currentMorse += '-'; // Dash
        }

        this.stopSound();
        this.timeout = setTimeout(() => {
            this.checkMorse();
        }, 750); // Delay checkMorse by 500ms
    },
    startBeep: function() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.startTime = Date.now();
        this.beep();
    },
    beep: function() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime); // Frequency in Hz
        this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        this.oscillator.start();
    },
    playNotes: function(notes) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const startTime = context.currentTime;
      
        notes.forEach((freq, i) => {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
      
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, startTime + i * 0.15);
      
          gainNode.gain.setValueAtTime(0.2, startTime + i * 0.15);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.15 + 0.2);
      
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
      
          oscillator.start(startTime + i * 0.15);
          oscillator.stop(startTime + i * 0.15 + 0.3);
        });
    },
    stopSound: function() {
        if (this.oscillator) {
            this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
            this.oscillator.stop(this.audioContext.currentTime + 0.1);
            this.oscillator.disconnect();
            this.oscillator = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    },
    checkMorse: function() {
        if (this.currentMorse === morseCode[this.currentLetter]) {
            this.currentLetter = this.getRandomLetter();
            this.currentMorse = '';
            this.playNotes(winningNotes);
        } else {
            console.log('Incorrect Morse: ' + this.currentMorse);
            this.currentMorse = '';
            this.playNotes(losingNotes);
        }
    },
    getRandomLetter: function() {
        const letters = Object.keys(morseCode);
        return letters[Math.floor(Math.random() * letters.length)];
    },
    playCurrentLetter: function() {
        this.playMorse(morseCode[this.currentLetter]);
    },
    playMorse: async function(morse) {
        const unitTime = 100; // ms
        for (let i = 0; i < morse.length; i++) {
            const timeOfBeep = morse[i] === '.' ? unitTime : unitTime * 3
            this.playSine(timeOfBeep)
            await new Promise(resolve => setTimeout(resolve, timeOfBeep + unitTime));
        }
    },
    playSine: function(duration) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, context.currentTime); // Frequency in Hz
        gainNode.gain.setValueAtTime(0.5, context.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + (duration / 1000));
    }
}).mount('#app')

