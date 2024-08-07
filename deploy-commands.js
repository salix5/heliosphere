import { REST, Routes } from 'discord.js';

const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

export async function deploy_command(commands) {
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	const public_commands = [];
	for (const command of commands) {
		public_commands.push(command.data.toJSON());
	}
	try {
		console.log(`Started refreshing ${public_commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			//Routes.applicationGuildCommands(clientId, guildId),
			Routes.applicationCommands(clientId),
			{ body: public_commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
}
