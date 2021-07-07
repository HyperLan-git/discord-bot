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
		console.log("Audio finished playing $");
		playNext(client, channel);
	});
	if(client.looping) playlist.push(song);
}


handleCustomCommand = function(client, message) {
	const args = message.content.split(' ');
	const command = args.shift().toLowerCase();

	
	switch(command) {
		case "$p":
			if(client.connection === undefined) {
				message.reply('You need to do $join first $');
				return;
			}
			if(args.length === 0) {
				message.reply("What do you want me to play ? Add search terms after $p");
				return;
			}
			client.yts(args.slice(0).join(" ")).then((result) => {
				let videos = result.videos;
				if(videos.length === 0) return message.reply("No songs were found!");
				if(playlist.length === 0) {
					playlist.push(videos[0].url);
					if(client.dispatcher !== undefined) {
						message.reply("Playing something else, added song to playlist !");
					} else
						playNext(client, message.channel);
				} else {
					message.reply("Added song to playlist !");
					playlist.push(videos[0].url);
				}
			});
			break;
		case "$play":
			if(client.connection === undefined) {
				message.reply('You need to do $join first $');
				return;
			}
			if(args.length === 0) {
				message.reply("What do you want me to play ? Add a url after $play");
				return;
			}
			if(playlist.length === 0) {
				playlist.push(args[0]);
				if(client.dispatcher !== undefined) {
					message.reply("Playing something else, added song to playlist $");
				} else
					playNext(client, message.channel);
			} else {
				message.reply("Added song to playlist $");
				playlist.push(args[0]);
			}

			if(client.delete_embeds)
				message.suppressEmbeds(true);
			break;
		case "$earrape":
			if(client.connection === undefined) {
				message.reply('You need to do $join first $');
				return;
			}
			if(args.length === 0) {
				message.reply("What do you want me to play ? Add a url after $play");
				return;
			}

			earrape(args[0], client);

			if(client.delete_embeds)
				message.suppressEmbeds(true);
			break;
		case "$volume":
			let num = parseFloat(args[0]);
			if(num == "NaN" || num < 0 || num > 1) {
				message.reply("Put a number between 0 and 1 as argument $");
				return;
			}

			client.volume = num;
			client.dispatcher.setVolume(client.volume);
			message.reply("Set volume to : " + num);
			break;
		case "$list":
			if(args[0] === "list") {
				let embed = new client.discord.MessageEmbed().setAuthor(name="Gaming bot", icon_url="https://cdn.discordapp.com/avatars/823718736833937418/4ee8b0a917ea30b1ef725e44dcbd5337.png?size=128")
					.setFooter(text="You can play any of them using $list play <name>");
				client.playlists.list.forEach((elem) => {
					let tracks = "Tracks : ";
					console.log(client.utils.getAllVars(elem));
					elem.songs.forEach((elem) => {
						tracks += elem.name + ", ";
					});
					if(elem.songs.length > 0) tracks = tracks.slice(0, -2); 
					embed.addField(elem.name, tracks);
				});
				message.channel.send(embed);
				return;
			}
			if(args.length === 1) {
				message.reply("Invalid command ! Use $help for a list of commands");
				console.log("a");
				return;
			}
			switch(args[0]) {
				case "create":
					if(args.length !== 2) {
						message.reply("Write a valid name for your playlist $");
					}
					client.playlists.list.push({name:args[1], songs:[]});
					client.playlists.savePlaylists(client, client.config.playlist_file);
					message.reply("Successfully created a new playlist $");
					break;
				case "add":
					if(args.length < 3) {
						message.reply("Invalid number of arguments $ Use $help for help on command usage.");
						return;
					}
					let name = args.slice(2).join(" ");
					for(let i = 0; i < client.playlists.list.length; i++) {
						const playlist = client.playlists.list[i];
						if(playlist.name !== args[1]) continue;
						client.yts(name).then((result) => {
							let videos = result.videos;
							if(videos.length === 0) return message.reply("No songs were found $");
							message.reply("Added song \"" + videos[0].title + "\" to " + args[1] + " $");
							playlist.songs.push({name: videos[0].title, url:videos[0].url});
							client.playlists.savePlaylists(client, client.config.playlist_file);
						});
						return;
					}
					message.reply("Could not find playlist \"" + args[1] + "\" $");
					break;
				case "delete":
					if(args.length !== 2) {
						message.reply("Invalid number of arguments $ Use $help for help on command usage.");
						return;
					}
					const playlist2 = client.playlists.list.find(element => element.name === args[1]);
					if(playlist2 === undefined) {
						message.reply("Could not find playlist \"" + args[1] + "\" !");
						return;
					}
					client.playlists.list = client.playlists.list.filter((elem) => {elem !== playlist2});
					client.playlists.savePlaylists(client, client.config.playlist_file);
					message.reply("Playlist successfully deleted $");
					break;
				case "remove":
					if(args.length < 3) {
						message.reply("Invalid number of arguments $ Use $help for help on command usage.");
						return;
					}
					let name2 = args.slice(2).join(" ");
					for(let i = 0; i < client.playlists.list.length; i++) {
						let playlist = client.playlists.list[i];
						if(playlist.name !== args[1]) continue;
						for(let j = 0; j < playlist.songs.length; j++) {
							const song = playlist.songs[j];
							if(song.name !== name2) continue;
							playlist.songs = playlist.songs.filter((elem) => {elem !== song});
							console.log(playlist.songs);
							client.playlists.savePlaylists(client, client.config.playlist_file);
							message.reply("Successfully removed song from playlist $");
							return;
						}
						message.reply("Could not find this song in the playlist $");
						return;
					}
					message.reply("Could not find playlist \"" + args[1] + "\" $");
					break;
				case "play":
					if(args.length !== 2) {
						message.reply("Invalid number of arguments $ Use $help for help on command usage.");
						return;
					}
					const playlist3 = client.playlists.list.find(element => element.name === args[1]);
					if(playlist3 === undefined) {
						message.reply("Could not find playlist \"" + args[1] + "\" $");
						return;
					}
					playlist3.songs.forEach((elem) => {
						if(client.connection === undefined) {
							message.reply('You need to do $join first !');
							return;
						}
						if(playlist.length === 0) {
							playlist.push(elem.url);
							if(client.dispatcher === undefined)
								playNext(client, message.channel);
						} else {
							playlist.push(elem.url);
						}
					});
					break;
				default:
					message.reply("Invalid command ! Use $help for a list of commands.");
					break;
			}
			break;
		default:
			message.reply("Invalid command ! Use $help for a list of commands");
			console.log(args);
			return;
	} 
}

this.loadAll = function(client) {
	client.on("message", async function(message) {
		if(message.author.bot) return;
		switch(message.content) {
			case "$help":
				message.reply("Here's a list of commands :\n$ping $join $leave $playlist\n$play <youtube url> $volume <number> $p <song name>" +
					"\n$earrape <url>\n$pause $resume $stop $skip $shuffle\n$list create <name> $list delete <name> $list add <playlist> <search terms> $list remove <playlist> <video title> $list play <name> $list list\n$loop\n$sound create <name> <url>");
				break;
			case "$ping":
				message.reply("Pong $");
				break;
			case "$join":
				if (message.member.voice.channel)
					client.connection = await message.member.voice.channel.join();
				else
					message.reply('You need to join a voice channel first$');
				break;
			case "$pause":
				if(client.dispatcher === undefined) {
					message.reply("No playing song !");
					return;
				}
				console.log("paused audio");
				client.dispatcher.pause();
				break;
			case "$resume":
				if(client.dispatcher === undefined) {
					message.reply("No playing song !");
					return;
				}
				console.log("resumed audio");
				client.dispatcher.resume();
				break;
			case "$stop":
				if(client.dispatcher === undefined) {
					message.reply("No playing song !");
					return;
				}
				console.log("stopped audio");
				client.dispatcher.destroy();
				client.dispatcher = undefined;
				break;
			case "$playlist":
				if(playlist.length === 0) {
					message.channel.send("Playlist is empty !");
					return;
				}
				console.log(playlist.length);
				let embed = new client.discord.MessageEmbed().setTitle("Next songs to play").setAuthor(name="Gaming bot",
					icon_url="https://cdn.discordapp.com/avatars/823718736833937418/4ee8b0a917ea30b1ef725e44dcbd5337.png?size=128")
					.setFooter(text="Songs play from top to bottom");
				for(let i = 0; i < playlist.length; i++)
					embed = embed.addField(name="Unkown title", value=playlist[i], inline=false);

				message.channel.send(embed).then(async function f(msg) {
					let edited =  new client.discord.MessageEmbed().setAuthor(name="Gaming bot", icon_url="https://cdn.discordapp.com/avatars/823718736833937418/4ee8b0a917ea30b1ef725e44dcbd5337.png?size=128")
						.setFooter(text="Songs play from top to bottom");
					for(let i = 0; i < playlist.length; i++) {
						var getinfo = await client.ytdl.getBasicInfo(playlist[i]).catch((err) => {console.log(err);});
						var title = getinfo.videoDetails.title;
						edited = edited.addField(title, value=playlist[i], inline=false);
					}
					msg.edit(edited);
				});
				break;
			case "$skip":
				if(playlist.length === 0) {
					message.reply("The playlist is empty !");
					return;
				}
				playNext(client, message.channel);
				break;
			case "$shuffle":
				if(playlist.length === 0) {
					message.reply("The playlist is empty !");
					return;
				}
				playlist = client.utils.shuffle(playlist);
				message.reply("Playlist shuffled !");
				break;
			case "$loop":
				client.looping = $client.looping;
				if(client.looping)
					message.reply("Songs played will now also be added at the end of the playlist $ Currently playing song is unaffected.");
				else
					message.reply("The playlist will no longer loop $");
				break;
			default:
				handleCustomCommand(client, message);
		}
	});
}
/*file_path, info_configuration, metadata, addCommand, addInput, addFilterComplex, 
setDisableAudio, setDisableVideo, setVideoFormat, setVideoCodec, setVideoBitRate, 
setVideoFrameRate, setVideoStartTime, setVideoDuration, setVideoAspectRatio, setVideoSize, 
setAudioCodec, setAudioFrequency, setAudioChannels, setAudioBitRate, setAudioQuality, 
setWatermark, save, fnExtractSoundToMP3, fnExtractFrameToJPG, fnAddWatermark,
ffmpeg -y -i audio.mp4 -filter_complex "bass=g=30,treble=g=30" audio2.mp3*/


earrape = function(url, client) {
	let temp = client.ytdl(url).pipe(client.fs.createWriteStream('audio.mp3'));
	temp.on("end", function() {
		const { exec } = require("child_process");

		console.log("a");
		let child = exec("ffmpeg -y -i audio.mp3 -filter_complex \"bass=g=20,treble=g=20\" audio3.mp3");
		child.on("end", function(){
		console.log("b");
			client.dispatcher = client.connection.play('./audio3.mp3');
		console.log("c");
		});
	});
}