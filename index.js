const discord = require("discord.js");
const config = require("./config.json");
const commands = require("./commands.js");
const utils = require("./utils.js");
const playlists = require("./playlist.js");
const ytdl = require('ytdl-core');
const fs = require('fs');
const yts = require("yt-search");

const client = new discord.Client();

const delete_embeds = config.remove_embeds;

client.config = config;
client.ytdl = ytdl;
client.yts = yts;
client.playlists = playlists;
client.fs = fs;
client.delete_embeds = delete_embeds;
client.discord = discord;
client.volume = 1;

playlists.loadPlaylists(client, config.playlist_file);

commands.loadAll(client);


client.login(config.BOT_TOKEN);