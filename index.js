const discord = require("discord.js");
const config = require("./config.json");
const messages = require("./embeds.json");
const commands = require("./commands.js");
const utils = require("./utils.js");
const fs = require('fs');
const child = require('child_process');
const ffmpeg = require('ffmpeg-static');
const gTTS = require('gtts');


const client = new discord.Client();

client.config = config;
client.utils = utils;
client.fs = fs;
client.discord = discord;
client.messages = messages;
client.command = commands;
client.child = child;
client.ffmpeg = ffmpeg;
client.gtts = gTTS;
client.commands = [];
client.DMcommands = [];

commands.loadAll(client);

const token = fs.readFileSync("bot_token.conf").toString();
client.login(token).then(() => {
	client.channels.fetch(config.channel_roles).then((channel) => {
		client.utils.remove_all_messages(channel).then(() => {
			commands.roles(client, channel);
		});
	});
	client.channels.fetch(config.channel_welcome).then((channel) => {
		client.utils.remove_all_messages(channel).then(() => {
			commands.rules(client, channel);
		});
	});
});