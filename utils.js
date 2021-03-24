this.getAllVars = function(obj) {let result = ""; for(name in obj) result += name+", "; return result;}

this.readAudio = function(connexion) {
	return audio = connection.receiver.createStream('User ID');
}

this.playAudio = function(connexion, audio) {
	connection.play(audio, { type: 'opus' });
}