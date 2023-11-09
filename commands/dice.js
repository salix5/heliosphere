import { SlashCommandBuilder } from 'discord.js';
import { randomInt } from 'node:crypto';
import { promisify } from 'node:util';
const rand = promisify(randomInt);

export const data = new SlashCommandBuilder()
	.setName('dice')
	.setDescription('Roll a N-sided dice.')
	.addIntegerOption(option => option.setName('face')
		.setDescription('face')
		.setRequired(true)
		.setMinValue(2)
		.setMaxValue(0xffffffffffff)
	);
export async function execute(interaction) {
	const face = interaction.options.getInteger('face');
	if (face) {
		const result = await rand(face) + 1;
		await interaction.reply(result.toString());
	}
	else {
		await interaction.reply('Error');
	}
}
