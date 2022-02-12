this.rules = function(client, channel) {
	channel.send(new client.discord.MessageEmbed(client.messages.rules)).then(async function f(msg) {
		msg.react(client.config.yes_emoji);
		msg.react(client.config.no_emoji);
		msg.awaitReactions((manager) => {
			manager.users.cache.forEach(
				(user, userID, map) => {
					if(user.bot) return;
					let member = msg.guild.members.cache.get(userID);
					manager.users.remove(userID);
					let role = channel.guild.roles.cache.find(r => (r.name === client.config.rules_accepted));
					let emoji_yes = msg.guild.emojis['cache'].find(emoji => emoji.name === client.config.yes_emoji);
					let emoji_no = msg.guild.emojis['cache'].find(emoji => emoji.name === client.config.no_emoji);
					if(emoji_yes === undefined) {
						if(client.config.yes_emoji === manager._emoji.name) member.roles.add(role);
					} else if(client.config.yes_emoji === manager._emoji.id) member.roles.add(role);
					if(emoji_no === undefined) {
						if(client.config.no_emoji === manager._emoji.name)
							member.send(client.config.message_kicked).then(() => {
								member.kick().catch((err) => {
									console.log("[INFO] " + err);
								});
							});
					} else if(client.config.no_emoji === manager._emoji.id)
						member.send(client.config.message_kicked).then(() => {
							member.kick().catch((err) => {
								console.log("[INFO] " + err);
							});
						});
				}
			);
		}, {max: 10})
	});
}

this.roles = function(client, channel) {
	channel.send(new client.discord.MessageEmbed(client.messages.roles)).then(async function f(msg) {
		let result = null;
		for(name in client.config.assignable_roles) {
			let emoji = msg.guild.emojis['cache'].find(emoji => emoji.name === client.config.assignable_roles[name]);
			if(emoji === undefined) {
				result = await msg.react(client.config.assignable_roles[name]);
			} else {
				result = await msg.react(emoji.id);
			}
		}
		msg.awaitReactions((manager) => {
			manager.users.cache.forEach(
				(user, userID, map) => {
					if(user.bot) return;
					let member = msg.guild.members.resolve(userID);
					manager.users.remove(userID);
					for(name in client.config.assignable_roles) {
						let role = channel.guild.roles.cache.find(r => (r.name === name));
						let emoji = msg.guild.emojis.resolve(client.config.assignable_roles[name]);
						if(emoji === undefined) {
							if(client.config.assignable_roles[name] != manager._emoji.name) continue;
							member.roles.add(role);
						} else {
							if(client.config.assignable_roles[name] != manager._emoji.id) continue;
							member.roles.add(role);
						}
					}
				}
			);
		}, {max: 10})
	});
}

this.handleCustomCommand = function(client, message) {
	const args = message.content.split(' ');
	const command = args.shift().toLowerCase();

	switch(command) {
		case '$delete':
			const number = args[0];
			message.channel.bulkDelete(number);
			break;
		case "$say":
			if(!client.connection)
				message.channel.send("Le bot doit être dans un VC !\nUtilisez $join")
			var gtts = new client.gtts(message.content.substring(4), 'fr');

			gtts.save('tts.mp3', function (err, result) {
				if(err) { throw new Error(err); }
				console.log("Text to speech converted!");
				client.connection.play('tts.mp3');
			});
			break;
		case "$listen_to":
			if(!client.connection)
				message.channel.send("Le bot doit être dans un VC !\nUtilisez $join");
			let at = args[0];
			at = at.substring(3, at.length - 1);
			let to_listen = client.connection.channel.members.get(at);
			if(to_listen === null) {
				message.reply("écouter qui? Mettez en argument un @ de cette personne.");
				return;
			}
			const receiver = client.connection.receiver.createStream(to_listen, {
				mode: "pcm",
				end: "silence"
			});

			const writer = receiver.pipe(client.fs.createWriteStream('./recording.pcm'));
			writer.on('finish', () => {
				let args = ["-y", "-f", "s16le", "-ar", "44.1k", "-ac", "2", "-i", "recording.pcm", "file.wav"];
				let proc = client.child.spawn(client.ffmpeg, args);
				proc.on('error', (err) => {
					console.error('Failed to start subprocess.');
				});
				proc.on('close', (data) => {
					client.child.exec("python jarvis.py file.wav text.txt", (error, stdout, stderr) => {
						if (error) {
							message.channel.send("Je n'ai pas compris le fdp");
							console.error(`error: ${stderr}`);
							return;
						}

						if (stderr) {
							message.channel.send("Je n'ai pas compris le fdp");
							console.error(`stderr: ${stderr}`);
							return;
						}
						message.channel.send("Le fdp a dit : `" + stdout + "`");
					});
				});
			});
			break;
		default:
			for(let comm in client.commands) if(("$" + comm) == command &&
					client.commands[comm](client, message, args))
				return;
			message.reply(client.config.message_invalid);
			console.log("Invalid command : " + command + "\nArgs = " + args);
			return;
	}
}

this.loadAll = function(client) {
	client.cleverbot = client.child.spawn("python", ["cleverbot.py"]);
	client.cleverbot.stdout.on('data', (data) => {
		if (data != "")
			client.channels.fetch(client.config.chat_with_bot).then((channel) => {channel.send("" + data)});
		console.log("data :" + data);
	});
	client.messageListener = async function(message) {
		try {
			if(message.author.bot) return;
			console.log("[INFO] Recieved message : " + message.content);

			if(message.channel.id === client.config.chat_with_bot) {
				client.cleverbot.stdin.write(message.content + "\n");
				return;
			}
			if(message.guild === null) {
				client.command.handleDM(client, message);
				return;
			}
			if(message.channel.id == client.config.channel_welcome ||
				message.channel.id == client.config.channel_roles) message.delete();
			if(!message.content.startsWith('$')) return;
			for(let k in client.config.messages) if(message.content.substring(1) === k) {
				message.reply(client.config.messages[k]);
				return;
			}
			let member = message.member;
			const FLAGS = client.discord.Permissions.FLAGS;
			switch(message.content) {
				case "$reset":
					client.cleverbot = client.child.spawn("python", ["cleverbot.py"]);
					client.cleverbot.stdout.on('data', (data) => {
					if (data != "")
						client.channels.fetch(client.config.chat_with_bot).then((channel) => {channel.send("" + data)});
						console.log("data :" + data);
					});
					break;
				case "$del_all":
					if(!member.permissions.has(FLAGS.MANAGE_MESSAGES)) {
						message.reply("vous n'avez pas la permission !");
						return;
					}
					client.utils.remove_all_messages(message.channel);
					break;
				case "$rules":
					client.command.rules(client, message.channel);
					break;
				case "$init":
					client.command.roles(client, message.channel);
					break;
				case "$roll":
					message.channel.send(Math.floor(Math.random() * 100));
					break;
				case "$join":
					if (member.voice.channel) {
						client.vc = member.voice.channel;
						member.voice.channel.join().then((connection) => {
							client.connection = connection;
						});
					} else
						message.channel.send("Vous devez être dans un VC !");
					break;
				case "$listen":
					if(!client.connection)
						message.channel.send("Le bot doit être dans un VC !\nUtilisez $join");
					const receiver = client.connection.receiver.createStream(message.member, {
						mode: "pcm",
						end: "silence"
					});

					const writer = receiver.pipe(client.fs.createWriteStream('./recording.pcm'));
					writer.on('finish', () => {
						let args = ["-y", "-f", "s16le", "-ar", "44.1k", "-ac", "2", "-i", "recording.pcm", "file.wav"];
						let proc = client.child.spawn(client.ffmpeg, args);
						proc.on('error', (err) => {
							console.error('Failed to start subprocess.');
						});
						proc.on('close', (data) => {
							client.child.exec("python jarvis.py file.wav text.txt", (error, stdout, stderr) => {
								if (error) {
									message.channel.send("Je n'ai pas compris");
									console.error(`error: ${stderr}`);
									return;
								}

								if (stderr) {
									message.channel.send("Je n'ai pas compris");
									console.error(`stderr: ${stderr}`);
									return;
								}
								message.channel.send("Tu as dit : `" + stdout + "`");
							});
						});
					});
					break;
				case "$start_discussion":
					if(!client.connection)
						message.channel.send("Le bot doit être dans un VC !\nUtilisez $join");
					discuss = async function(member) {
						const receiver = client.connection.receiver.createStream(member, {
							mode: "pcm",
							end: "silence"
						});

						const writer = receiver.pipe(client.fs.createWriteStream('./recording.pcm'));
						writer.on('finish', () => {
							let args = ["-y", "-f", "s16le", "-ar", "44.1k", "-ac", "2", "-i", "recording.pcm", "file.wav"];
							let proc = client.child.spawn(client.ffmpeg, args);
							proc.on('error', (err) => {
								console.error('Failed to start subprocess.');
							});
							proc.on('close', (data) => {
								client.child.exec("python jarvis.py file.wav text.txt", (error, stdout, stderr) => {
									if (error) {
										//message.channel.send("Je n'ai pas compris");
										console.error(`error: ${stderr}`);
										return;
									}

									if (stderr) {
										//message.channel.send("Je n'ai pas compris");
										console.error(`stderr: ${stderr}`);
										return;
									}
									
									client.discussion = discuss(member);
								});
							});
						});
					}
					if(client.discussionProcess !== undefined) client.discussionProcess.kill();
					client.discussion = discuss(message.member);
					break;
				case "$end_discussion":
					
					break;
				case "$reload":
					delete require.cache[require.resolve("./commands.js")];
					delete require.cache[require.resolve("./config.json")];
					delete require.cache[require.resolve("./utils.js")];
					delete require.cache[require.resolve("./embeds.json")];
					client.command = require("./commands.js");
					client.config = require("./config.json");
					client.utils = require("./utils.js");
					client.messages = require("./embeds.json");
					client.commands = [];
					client.DMcommands = [];

					client.removeListener('message', client.messageListener);
					client.cleverbot.kill('SIGINT');
					client.command.loadAll(client);
					console.log("[INFO] reload !");
					break;
				case '$stop_listening':
					if(client.listen_list === undefined)
						client.listen_list = [];
					if(client.vars[msg.author.id] !== undefined && client.vars[msg.author.id][3] !== undefined)
						client.vars[msg.author.id][3].kill();
					client.listen_list.splice(client.listen_list.indexOf(message.author.id));
					break;
				case '$start_listening':
					if(client.listen_list === undefined)
						client.listen_list = [];
					if(client.vars === undefined)
						client.vars = [];
					if(client.connection === undefined)
						message.channel.send("Le bot doit être dans un VC !\nUtilisez $join");
					if(client.listen_list.includes(message.author.id))
						return;
					client.listen_list.push(message.author.id);
					listen = async function(client, msg) {
						let obj = [];
						obj[0] = client.connection.receiver.createStream(msg.member, {
							mode: "pcm",
							end: "silence"
						});

						obj[1] = obj[0].pipe(client.fs.createWriteStream('./recording' + msg.author.id + '.pcm'));
						obj[1].on('finish', () => {
							obj[2] = ["-y", "-f", "s16le", "-ar", "44.1k", "-ac", "2", "-i", "recording" + msg.author.id + ".pcm", "file" + msg.author.id + ".wav"];
							obj[3] = client.child.spawn(client.ffmpeg, obj[2]);
							obj[3].on('error', (err) => {
								console.error('Failed to start subprocess.');
							});
							obj[3].on('close', (data) => {
								client.child.exec("python jarvis.py file" + msg.author.id + ".wav text" + msg.author.id + ".txt", (error, stdout, stderr) => {
									if (error) {
										if(client.listen_list.includes(msg.author.id))
											listen(client, msg);
										//console.log(stderr);
										console.log("[INFO] " + msg.author.username + " pas compris");
										return;
									}
									if (stderr) {
										if(client.listen_list.includes(msg.author.id))
											listen(client, msg);
										//console.log(stderr);
										console.log("[INFO] " + msg.author.username + " pas compris");
										return;
									}
									msg.channel.send(msg.author.username + " : `" + stdout + "`");
									if(client.listen_list.includes(msg.author.id))
										listen(client, msg);
								});
							});
						});
						client.vars[msg.author.id] = obj;
					}
					listen(client, message);
					break;
				default:
					client.command.handleCustomCommand(client, message);
			}
		} catch (e) {
			console.log("Error " + e + " logged !");
			client.utils.log(client, "[" + new Date().toISOString() + "]" + e + "\nStack trace : " + e.stack);
		}
	};
	client.on("message", client.messageListener);
	require("./admin_commands.js").registerAdminCommands(client);
	require("./DMcommands.js").registerDMCommands(client);
}

this.handleDM = function(client, message) {
	const args = message.content.split(' ');
	const command = args.shift().toLowerCase();
	
	for(let comm in client.DMcommands) if(("$" + comm) == command &&
			client.DMcommands[comm](client, message, args))
		return;
	message.reply(client.config.message_invalid);
	console.log("Invalid command : " + command + "\nArgs = " + args);
	return;
}