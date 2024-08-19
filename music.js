// music.js

let currentTrackIndex = 1;
let currentMusic;
let isPlaying = false;

function playMusic(trackPrefix) {
    stopMusic(); // Stop any currently playing music

    currentTrackIndex = 1; // Reset track index
    playNextTrack(trackPrefix); // Start with the first track
}

function playNextTrack(trackPrefix) {
    const trackPath = `music/${trackPrefix}${currentTrackIndex}.mp3`;

    currentMusic = new Audio(trackPath);

    currentMusic.onerror = function() {
        // If the current track doesn't exist, loop back to the first track
        if (currentTrackIndex > 1) {
            currentTrackIndex = 1;
            playNextTrack(trackPrefix);
        }
    };

    currentMusic.onended = function() {
        // Increment the track index and try to play the next one
        currentTrackIndex++;
        playNextTrack(trackPrefix);
    };

    currentMusic.play().catch(error => {
        console.error('Error playing music:', error);
        currentTrackIndex = 1; // Reset to the first track if an error occurs
    });

    isPlaying = true;
}

function stopMusic() {
    if (currentMusic && isPlaying) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
        isPlaying = false;
    }
}
