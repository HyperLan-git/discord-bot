this.getAllVars = function(obj) {let result = ""; for(name in obj) result += name+", "; return result;}

this.readAudio = function(connexion) {
	return audio = connection.receiver.createStream('User ID');
}

this.playAudio = function(connexion, audio) {
	connection.play(audio, { type: 'opus' });
}

this.shuffle = function(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}