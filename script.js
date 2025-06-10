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

const DASH_MULTIPLIER = 3;
const DOT_DASH_THRESHOLD = 200;

const GAIN_END_VALUE = 0.001;
const GAIN_RAMP_DOWN_TIME = 0.05;
const GAIN_START_VALUE = 0.2;
const GAIN_VALUE = 0.5;
const MORSE_CHECK_DELAY = 750;
const NOTE_TIME_INCREMENT = 0.15;
const OSCILLATOR_FREQUENCY = 600;
const OSCILLATOR_STOP_TIME = 0.3;
const RAMP_TIME = 0.2;
const UNIT_TIME = 100;

const LOSING_NOTES  = [392.00, 329.63, 261.63]; // G4, E4, C4
const WINNING_NOTES = [523.25, 659.25, 783.99]; // C5, E5, G5 (a C major arpeggio)

PetiteVue.createApp({
    currentLetter: 'A',
    currentMorse: '',
    audioContext: new (window.AudioContext || window.webkitAudioContext)(),
    oscillator: null,
    gainNode: null,
    startTime: 0,
    timeout: null,
    stopBeep: function() {
        const duration = Date.now() - this.startTime;
        if (duration < DOT_DASH_THRESHOLD) {
            this.currentMorse += '.'; // Dot
        } else {
            this.currentMorse += '-'; // Dash
        }

        this.stopSound();
        this.timeout = setTimeout(() => {
            this.checkMorse();
        }, MORSE_CHECK_DELAY);
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
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(OSCILLATOR_FREQUENCY, this.audioContext.currentTime); // Frequency in Hz
        this.gainNode.gain.setValueAtTime(GAIN_VALUE, this.audioContext.currentTime);

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        this.oscillator.start();
    },
    playNotes: function(notes) {
        const startTime = this.audioContext.currentTime;
      
        notes.forEach((freq, i) => {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();
      
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, startTime + i * NOTE_TIME_INCREMENT);
      
          gainNode.gain.setValueAtTime(GAIN_START_VALUE, startTime + i * NOTE_TIME_INCREMENT);
          gainNode.gain.exponentialRampToValueAtTime(GAIN_END_VALUE, startTime + i * NOTE_TIME_INCREMENT + RAMP_TIME);
      
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
      
          oscillator.start(startTime + i * NOTE_TIME_INCREMENT);
          oscillator.stop(startTime + i * NOTE_TIME_INCREMENT + OSCILLATOR_STOP_TIME);
        });
    },
    stopSound: function() {
        if (this.oscillator) {
            this.gainNode.gain.exponentialRampToValueAtTime(GAIN_END_VALUE, this.audioContext.currentTime + GAIN_RAMP_DOWN_TIME);
            this.oscillator.stop(this.audioContext.currentTime + OSCILLATOR_STOP_TIME);
            this.oscillator.disconnect();
            this.oscillator = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
    },
    checkMorse: function() {
        if (this.currentMorse === morseCode[this.currentLetter]) {
            this.currentLetter = this.getRandomLetter();
            this.currentMorse = '';
            this.playNotes(WINNING_NOTES);
        } else {
            console.log('Incorrect Morse: ' + this.currentMorse);
            this.currentMorse = '';
            this.playNotes(LOSING_NOTES);
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
        for (let i = 0; i < morse.length; i++) {
            const timeOfBeep = morse[i] === '.' ? UNIT_TIME : UNIT_TIME * DASH_MULTIPLIER
            this.playSine(timeOfBeep)
            await new Promise(resolve => setTimeout(resolve, timeOfBeep + UNIT_TIME));
        }
    },
    playSine: function(duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(OSCILLATOR_FREQUENCY, this.audioContext.currentTime); // Frequency in Hz
        gainNode.gain.setValueAtTime(GAIN_VALUE, this.audioContext.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + (duration / 1000));
    }
}).mount('#app')

