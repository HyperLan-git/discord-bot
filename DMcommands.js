this.registerDMCommands = function(client) {
	client.DMcommands['invite'] = function(client, message, args) {
		message.reply(client.config.invite);
		return true;
	};
}