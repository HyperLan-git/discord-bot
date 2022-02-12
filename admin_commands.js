this.registerAdminCommands = function(client) {
	client.commands["remove_all_roles"] = function(client, message, args) {
		let member = message.guild.members.cache.get(message.author.id);
		const FLAGS = client.discord.Permissions.FLAGS;
		if(!member.permissions.has(FLAGS.MANAGE_ROLES)) {
			return false;
		}
		message.guild.members.cache.forEach(
			(member, memberID, map) => {
				if(member.bot) return;
				member.roles.remove(member.roles.cache);
			}
		);
		message.reply("retiré les roles de tout le monde !");
		return true;
	}
}