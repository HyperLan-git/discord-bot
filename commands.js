playlist = [];

playNext = function(client, channel) {
	if(playlist.length === 0) {
		client.dispatcher = undefined;
		return;
	}
	let song = playlist.shift();
	let instance = client.ytdl(song, {filter: 'audioonly', downloadURL: true});
	instance.on("error", (err) => {
		channel.send("Could not get this video (" + song + "), are you sure you typed it correctly ?");
		playNext(client, channel);
	});

	instance.on('info', (info) => {
		const embed = new client.discord.MessageEmbed().addField(name="Playing video", value="Playing : [" + info.videoDetails.title + "](" + info.videoDetails.video_url + ")", inline=true);
  		channel.send(embed);
	});

	console.log(playlist.length + " remaining");
	client.dispatcher = client.connection.play(instance);
	client.dispatcher.setVolume(client.volume);

	client.dispatcher.on('finish', () => {
		console.log("Audio finished playing !");
		playNext(client, channel);
	});
}


handleCustomCommand = function(client, message) {
	if(!message.content.startsWith('!')) return;
	const args = message.content.split(' ');
	const command = args.shift().toLowerCase();

	
	switch(command) {
		case "!p":
			if(client.connection === undefined) {
				message.reply('You need to do !join first !');
				return;
			}
			if(args.length === 0) {
				message.reply("What do you want me to play ? Add search terms after !p");
				return;
			}
			client.yts(args.slice(1).join(" ")).then((result) => {
				let videos = result.videos;
				if(videos.length === 0) return message.reply("No songs were found!");
				if(playlist.length === 0) {
					playlist.push(videos[0].title);
					if(client.dispatcher !== undefined) {
						message.reply("Playing something else, added song to playlist !");
					} else
						playNext(client, message.channel);
				} else {
					message.reply("Added song to playlist !");
					playlist.push(videos[0].title);
				}
			});
			break;
		case "!play":
			if(client.connection === undefined) {
				message.reply('You need to do !join first !');
				return;
			}
			if(args.length === 0) {
				message.reply("What do you want me to play ? Add a url after !play");
				return;
			}
			if(playlist.length === 0) {
				playlist.push(args[0]);
				if(client.dispatcher !== undefined) {
					message.reply("Playing something else, added song to playlist !");
				} else
					playNext(client, message.channel);
			} else {
				message.reply("Added song to playlist !");
				playlist.push(args[0]);
			}

			if(client.delete_embeds)
				message.suppressEmbeds(true);
			break;
		case "!volume":
			let num = parseFloat(args[0]);
			if(num == "NaN" || num < 0 || num > 1) {
				message.reply("Put a number between 0 and 1 as argument !");
				return;
			}

			client.volume = num;
			break;
		case "!list":
			if(args.length === 1) {
				message.reply("Invalid command ! Use !help for a list of commands");
				console.log("a");
				return;
			}
			switch(args[0]) {
				case "create":
					if(args.length !== 2) {
						message.reply("Write a valid name for your playlist !");
					}
					client.playlists.list.push({name:args[1], songs:[]});
					client.playlists.savePlaylists(client, client.config.playlist_file);
					break;
				case "add":
				case "get":
				case "delete":
				case "remove":
				case "list":
				case "play":
				default:
					message.reply("Invalid command ! Use !help for a list of commands");
					break;
			}
			break;
		default:
			message.reply("Invalid command ! Use !help for a list of commands");
			console.log(args);
			return;
	} 
}

this.loadAll = function(client) {
	client.on("message", async function(message) {
		if(message.author.bot) return;
		switch(message.content) {
			case "!help":
				message.reply("Here's a list of commands :\n!ping !join !leave !playlist\n!play <youtube url> !volume <number> !p <song name>" +
					"\n!pause !resume !stop !skip !shuffle\n!list create <name> !list delete <name> !list add <url> !list get <name> !list remove <song number> !list play <name> !list list\n!loop\n!sound create <name> <url>");
				console.log(client.playlists.list);
				break;
			case "!ping":
				const args = message.content.split(' ');
				message.reply("Pong !");
				break;
			case "!join":
				if (message.member.voice.channel)
					client.connection = await message.member.voice.channel.join();
				else
					message.reply('You need to join a voice channel first!');
				break;
			case "!pause":
				if(client.dispatcher === undefined) {
					message.reply("No playing song !");
					return;
				}
				console.log("paused audio");
				client.dispatcher.pause();
				break;
			case "!resume":
				if(client.dispatcher === undefined) {
					message.reply("No playing song !");
					return;
				}
				console.log("resumed audio");
				client.dispatcher.resume();
				break;
			case "!stop":
				if(client.dispatcher === undefined) {
					message.reply("No playing song !");
					return;
				}
				console.log("stopped audio");
				client.dispatcher.destroy();
				client.dispatcher = undefined;
				break;
			case "!playlist":
				if(playlist.length === 0) {
					message.channel.send("Playlist is empty !");
					return;
				}
				let embed = new client.discord.MessageEmbed().setAuthor(name="Gaming bot", icon_url="https://cdn.discordapp.com/avatars/823718736833937418/4ee8b0a917ea30b1ef725e44dcbd5337.png?size=128")
					.setFooter(text="Songs play from top to bottom");
				for(let i = 0; i < playlist.length; i++)
					embed = embed.addField(name="Unkown title", value=playlist[i], inline=false);
				message.channel.send(embed).then(async function f(msg) {
					let edited =  new client.discord.MessageEmbed().setAuthor(name="Gaming bot", icon_url="https://cdn.discordapp.com/avatars/823718736833937418/4ee8b0a917ea30b1ef725e44dcbd5337.png?size=128")
						.setFooter(text="Songs play from top to bottom");
					for(let i = 0; i < playlist.length; i++) {
						var getinfo = await client.ytdl.getBasicInfo(playlist[0]).catch((err) => {console.log(err);});
						var title = getinfo.videoDetails.title;
						edited = edited.addField(title, value=playlist[i], inline=false);
						msg.edit(edited);
					}
				});
				break;
			case "!skip":
				if(playlist.length === 0) {
					message.reply("The playlist is empty !");
					return;
				}
				playNext(client, message.channel);
				break;
			default:
				handleCustomCommand(client, message);
		}
	});
}