this.getAllVars = function(obj) {let result = ""; for(name in obj) result += name+", "; return result;}

this.shuffle = function(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

this.remove_all_messages = function(channel) {
	del = function(channel, resolve, reject) {
		channel.messages.fetch({limit: 1}).then((map) => {
			if(map == null || map.size <= 0) {
				resolve('OK');
				return;
			}
			msg = map.entries().next().value[1];
			if(msg != null) {
				msg.delete().then(msg => {
					del(channel, resolve);
				}).catch();
			}
		}).catch();
	};
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			del(channel, resolve, reject);
		}, 3000);
	});
}

this.log = function(client, content) {
	client.fs.appendFile('log.txt', content + "\n", err => {
		if (err) {
			console.error(err);
			return;
		}
	});
}